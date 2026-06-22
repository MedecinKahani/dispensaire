import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const KEY = 'planning_v2';

export const PLANNING_CATEGORIES = ['medical', 'infirmiers', 'aide-soignants', 'ash'];

// Structure stockée dans Redis :
// {
//   medical: { agents: [...], cellules: {...}, guides: { "agentId|YYYY-MM-DD": "guideAgentId" } },
// }
// guides : clé = "agentId|YYYY-MM-DD" (J1 du nouveau), valeur = id du guide
const emptyCategory = () => ({ agents: [], cellules: {}, guides: {} });
const EMPTY_PLANNING = () => ({
  medical: emptyCategory(),
  infirmiers: emptyCategory(),
  'aide-soignants': emptyCategory(),
  ash: emptyCategory(),
});

function ensureShape(planning) {
  const base = EMPTY_PLANNING();
  const safe = planning || {};
  PLANNING_CATEGORIES.forEach(cat => {
    base[cat] = {
      agents: Array.isArray(safe[cat]?.agents) ? safe[cat].agents : [],
      cellules: safe[cat]?.cellules && typeof safe[cat].cellules === 'object' ? safe[cat].cellules : {},
      guides: safe[cat]?.guides && typeof safe[cat].guides === 'object' ? safe[cat].guides : {},
    };
  });
  return base;
}

export async function GET() {
  try {
    const raw = await kv.get(KEY);
    const planning = ensureShape(raw);
    return NextResponse.json({ planning });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de lecture' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, categorie } = body;

    if (!PLANNING_CATEGORIES.includes(categorie)) {
      return NextResponse.json({ error: 'Catégorie de planning invalide' }, { status: 400 });
    }

    const current = ensureShape(await kv.get(KEY));
    const cat = current[categorie];

    if (action === 'setCell') {
      // body: { categorie, agentId, date, moment, code }
      const { agentId, date, moment, code } = body;
      if (!agentId || !date || !moment) {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
      }
      const cellKey = `${agentId}|${date}|${moment}`;
      const nextCellules = { ...cat.cellules };
      if (code === '' || code === null || code === undefined) {
        delete nextCellules[cellKey];
      } else {
        nextCellules[cellKey] = code;
      }
      current[categorie] = { ...cat, cellules: nextCellules };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'addAgent') {
      // body: { categorie, nomFamille, prenom, arrivee?, depart? }
      const { nomFamille, prenom, arrivee, depart } = body;
      if (!nomFamille || !nomFamille.trim()) {
        return NextResponse.json({ error: 'Nom de famille manquant' }, { status: 400 });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      current[categorie] = {
        ...cat,
        agents: [...cat.agents, {
          id,
          nomFamille: nomFamille.trim(),
          prenom: (prenom || '').trim(),
          arrivee: arrivee || null,
          depart: depart || null,
        }],
      };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'removeAgent') {
      // body: { categorie, agentId }
      const { agentId } = body;
      const nextCellules = { ...cat.cellules };
      Object.keys(nextCellules).forEach(k => {
        if (k.startsWith(agentId + '|')) delete nextCellules[k];
      });
      current[categorie] = {
        agents: cat.agents.filter(a => a.id !== agentId),
        cellules: nextCellules,
      };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'renameAgent') {
      // body: { categorie, agentId, nomFamille, prenom }
      const { agentId, nomFamille, prenom } = body;
      if (!nomFamille || !nomFamille.trim()) {
        return NextResponse.json({ error: 'Nom de famille manquant' }, { status: 400 });
      }
      current[categorie] = {
        ...cat,
        agents: cat.agents.map(a => a.id === agentId
          ? { ...a, nomFamille: nomFamille.trim(), prenom: (prenom || '').trim() }
          : a),
      };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'updateAgentDates') {
      // body: { categorie, agentId, arrivee, depart } - arrivee/depart: 'YYYY-MM-DD' ou null
      const { agentId, arrivee, depart } = body;
      current[categorie] = {
        ...cat,
        agents: cat.agents.map(a => a.id === agentId ? { ...a, arrivee: arrivee || null, depart: depart || null } : a),
      };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'copyDay') {
      // body: { categorie, agentId, fromDate, toDate }
      // Copie M/AM/N d'un jour vers un autre pour un agent (raccourci ergonomie)
      const { agentId, fromDate, toDate } = body;
      const nextCellules = { ...cat.cellules };
      ['M', 'AM', 'N'].forEach(moment => {
        const fromKey = `${agentId}|${fromDate}|${moment}`;
        const toKey = `${agentId}|${toDate}|${moment}`;
        if (nextCellules[fromKey]) {
          nextCellules[toKey] = nextCellules[fromKey];
        } else {
          delete nextCellules[toKey];
        }
      });
      current[categorie] = { ...cat, cellules: nextCellules };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'fillRange') {
      // body: { categorie, agentId, fromDate, toDate, moment, code }
      // Applique un code sur une plage de dates pour un agent (raccourci ergonomie)
      const { agentId, fromDate, toDate, moment, code } = body;
      const nextCellules = { ...cat.cellules };
      const start = new Date(fromDate);
      const end = new Date(toDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cellKey = `${agentId}|${dk}|${moment}`;
        if (code === '' || code === null) {
          delete nextCellules[cellKey];
        } else {
          nextCellules[cellKey] = code;
        }
      }
      current[categorie] = { ...cat, cellules: nextCellules };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    if (action === 'setGuide') {
      // body: { categorie, agentId, date, guideId }
      // guideId null = supprimer le lien
      const { agentId, date, guideId } = body;
      const nextGuides = { ...(cat.guides || {}) };
      const key = `${agentId}|${date}`;
      if (guideId) nextGuides[key] = guideId;
      else delete nextGuides[key];
      current[categorie] = { ...cat, guides: nextGuides };
      await kv.set(KEY, current);
      return NextResponse.json({ planning: current });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de traitement', details: String(e) }, { status: 500 });
  }
}
