import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const KEY = 'planning';

// Structure stockée dans Redis :
// {
//   medecins: [{ id, nom }],
//   cellules: { "medecinId|YYYY-MM-DD|M|AM|N": "code" }
// }
const EMPTY_PLANNING = { medecins: [], cellules: {} };

export async function GET() {
  try {
    const planning = (await kv.get(KEY)) || EMPTY_PLANNING;
    return NextResponse.json({ planning });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de lecture' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    const current = (await kv.get(KEY)) || EMPTY_PLANNING;

    if (action === 'setCell') {
      // body: { medecinId, date, moment, code }
      const { medecinId, date, moment, code } = body;
      if (!medecinId || !date || !moment) {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
      }
      const key = `${medecinId}|${date}|${moment}`;
      const nextCellules = { ...current.cellules };
      if (code === '' || code === null) {
        delete nextCellules[key];
      } else {
        nextCellules[key] = code;
      }
      const next = { ...current, cellules: nextCellules };
      await kv.set(KEY, next);
      return NextResponse.json({ planning: next });
    }

    if (action === 'addMedecin') {
      // body: { nom }
      const { nom } = body;
      if (!nom || !nom.trim()) {
        return NextResponse.json({ error: 'Nom manquant' }, { status: 400 });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const next = { ...current, medecins: [...current.medecins, { id, nom: nom.trim() }] };
      await kv.set(KEY, next);
      return NextResponse.json({ planning: next });
    }

    if (action === 'removeMedecin') {
      // body: { medecinId }
      const { medecinId } = body;
      const nextCellules = { ...current.cellules };
      Object.keys(nextCellules).forEach(k => {
        if (k.startsWith(medecinId + '|')) delete nextCellules[k];
      });
      const next = {
        medecins: current.medecins.filter(m => m.id !== medecinId),
        cellules: nextCellules
      };
      await kv.set(KEY, next);
      return NextResponse.json({ planning: next });
    }

    if (action === 'renameMedecin') {
      // body: { medecinId, nom }
      const { medecinId, nom } = body;
      if (!nom || !nom.trim()) {
        return NextResponse.json({ error: 'Nom manquant' }, { status: 400 });
      }
      const next = {
        ...current,
        medecins: current.medecins.map(m => m.id === medecinId ? { ...m, nom: nom.trim() } : m)
      };
      await kv.set(KEY, next);
      return NextResponse.json({ planning: next });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de traitement', details: String(e) }, { status: 500 });
  }
}
