import { kv } from '@vercel/kv';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT_HEADER = `Tu es l'assistant médical interne du dispensaire de Kahani et Mramadoudou (Mayotte).

RÈGLES STRICTES :
- Réponds UNIQUEMENT à partir des fiches fournies ci-dessous (protocoles, annuaire, pharmacie, pédiatrie, etc.).
- N'utilise JAMAIS de connaissances médicales générales pour compléter une réponse : si l'information demandée n'est pas dans les fiches, dis-le clairement et propose de vérifier avec un confrère ou une ressource externe.
- Cite systématiquement le titre de la fiche source entre crochets, par exemple : [Rhinopharyngite virale].
- Sois concis et actionnable : c'est utilisé en consultation, pas pour de la lecture longue.
- Si plusieurs fiches sont pertinentes, mentionne-les toutes.
- Ne donne jamais de posologie ou de conduite à tenir qui ne figure pas explicitement dans une fiche.

FICHES DISPONIBLES :

`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun message fourni' }), { status: 400 });
    }

    const fiches = (await kv.get('fiches')) || [];

    const fichesText = fiches
      .map(f => `### ${f.title} [catégorie: ${f.category}]\n${f.summary ? f.summary + '\n' : ''}${f.content || ''}`)
      .join('\n\n---\n\n');

    const systemPrompt = SYSTEM_PROMPT_HEADER + (fichesText || '(Aucune fiche en base actuellement.)');

    // On ne garde que role/content pour l'appel API (pas de champs internes React)
    const cleanMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        system: systemPrompt,
        messages: cleanMessages,
        stream: true,
      }),
    });

    if (!anthropicRes.ok || !anthropicRes.body) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'Erreur API Anthropic', details: errText }), { status: 500 });
    }

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch (e) {
                // ignore, chunk incomplet
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erreur serveur', details: String(e) }), { status: 500 });
  }
}
