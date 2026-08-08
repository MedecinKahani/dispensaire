export const runtime = 'edge';

const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(request) {
  try {
    const { query, fiches } = await request.json();
    const q = (query || '').trim();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!q || !apiKey || !Array.isArray(fiches) || fiches.length === 0) {
      return new Response('', { status: 200 });
    }

    const context = fiches
      .map(f => `### ${f.title}\n${f.content || ''}`)
      .join('\n\n---\n\n');

    const systemPrompt = `Tu es un collègue médecin expérimenté du dispensaire de Kahani (Mayotte). Un membre de l'équipe te pose une question clinique. Réponds en te basant UNIQUEMENT sur les fiches de référence fournies ci-dessous — ce sont les protocoles internes du dispensaire.

Consignes :
- Réponds directement et de façon actionnable, comme à l'oral entre collègues, pas comme un manuel.
- Utilise des puces ou étapes numérotées pour les séquences d'action, posologies, algorithmes.
- Reste concis : l'essentiel d'abord, pas de blabla.
- Si les fiches ne couvrent pas vraiment la question posée, dis-le clairement plutôt que d'inventer une réponse.
- Ne dis jamais des phrases comme "d'après les fiches fournies" — parle comme si tu connaissais directement les protocoles du dispensaire.

FICHES DE RÉFÉRENCE :
${context}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: systemPrompt,
        messages: [{ role: 'user', content: q }],
        stream: true
      })
    });

    if (!anthropicRes.ok || !anthropicRes.body) {
      return new Response('', { status: 200 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
              const dataLine = part.split('\n').find(l => l.startsWith('data:'));
              if (!dataLine) continue;
              try {
                const json = JSON.parse(dataLine.slice(5).trim());
                if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                  controller.enqueue(encoder.encode(json.delta.text));
                }
              } catch (e) { /* fragment JSON incomplet, on ignore */ }
            }
          }
        } catch (e) {
          // flux interrompu, on ferme simplement
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (e) {
    return new Response('', { status: 200 });
  }
}
