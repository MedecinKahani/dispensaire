import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const KEY = 'fiches';
const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(request) {
  try {
    const { query } = await request.json();
    const q = (query || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ ids: [] });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Pas de clé configurée : on laisse le front retomber sur la recherche texte classique
      return NextResponse.json({ ids: null, fallback: true });
    }

    const fiches = (await kv.get(KEY)) || [];
    console.log(`[recherche IA] requête="${q}" — ${fiches.length} fiches en base`);
    if (fiches.length === 0) {
      return NextResponse.json({ ids: [] });
    }

    // On envoie titre / résumé / catégorie + un extrait du contenu pour un jugement de pertinence plus fiable
    const index = fiches.map(f => ({
      id: f.id,
      titre: f.title,
      categorie: f.category,
      resume: f.summary || '',
      extrait: (f.content || '').slice(0, 400)
    }));

    const systemPrompt = `Tu es le moteur de recherche interne d'une base de fiches médicales pratiques utilisées par des médecins dans un dispensaire à Mayotte. On te donne une liste de fiches (id, titre, catégorie, résumé, extrait du contenu) et une recherche tapée par un médecin.

Ta tâche : renvoyer les fiches pertinentes, en comprenant le SENS de la recherche, pas seulement les mots exacts. Le médecin peut taper :
- un symptôme ("bébé qui tousse", "douleur thoracique", "fièvre + éruption")
- une question clinique ("que faire si allergie pénicilline", "quand évacuer")
- un terme familier, une abréviation médicale, ou une faute de frappe
- un motif de consultation, un nom de médicament, un terme en shimaoré

Utilise tes connaissances médicales pour faire le lien entre le symptôme/la question et les fiches pertinentes. Exemples de correspondances à faire spontanément :
- "arrêt cardiaque" / "arrêt cardio-respiratoire" ↔ fiches "ACR" (Arrêt Cardio-Respiratoire), no-flow, MCE, massage cardiaque, algorithme choquable/non choquable
- "mal de gorge" ↔ angine
- "petit qui respire mal" / "bébé qui tousse" ↔ bronchiolite, asthme du nourrisson
- "piqûre qui gonfle" ↔ envenimation, réaction allergique

RÈGLE DE PRIORITÉ : classe en premier les fiches qui traitent DIRECTEMENT et PRINCIPALEMENT du sujet recherché (ex: une fiche "ACR adulte — algorithme" doit être en tête pour la recherche "arrêt cardiaque"), avant les fiches qui ne font qu'y faire référence en passant ou qui abordent un sujet voisin mais différent (ex: une fiche sur l'asthme ou une fiche sur une infection articulaire ne sont PAS pertinentes pour "arrêt cardiaque" même si elles mentionnent des gestes de réanimation en passant).

Si aucune fiche ne traite vraiment du sujet, réponds [] plutôt que de forcer des résultats approximatifs.

Réponds UNIQUEMENT avec un tableau JSON des ids des fiches pertinentes, triés du plus au moins pertinent, sans aucun texte autour. Maximum 15 résultats.

Exemple de réponse valide : ["a1b2c3","d4e5f6"]`;

    const userPrompt = `FICHES DISPONIBLES :\n${JSON.stringify(index)}\n\nRECHERCHE DU MÉDECIN : "${q}"`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur API Anthropic:', response.status, errText);
      return NextResponse.json({ ids: null, fallback: true });
    }

    const data = await response.json();
    const text = (data.content || [])
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
    console.log(`[recherche IA] réponse brute du modèle: ${text.slice(0, 500)}`);

    let ids;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      ids = JSON.parse(cleaned);
      if (!Array.isArray(ids)) throw new Error('Pas un tableau');
    } catch (parseErr) {
      console.error('Réponse IA non parsable:', text);
      return NextResponse.json({ ids: null, fallback: true });
    }

    // On ne garde que des ids qui existent réellement, par sécurité
    const validIds = new Set(fiches.map(f => f.id));
    ids = ids.filter(id => validIds.has(id));

    const titresRenvoyes = ids.map(id => fiches.find(f => f.id === id)?.title);
    console.log(`[recherche IA] résultats finaux pour "${q}":`, titresRenvoyes);

    return NextResponse.json({ ids });
  } catch (e) {
    console.error('Erreur recherche IA:', e);
    return NextResponse.json({ ids: null, fallback: true });
  }
}
