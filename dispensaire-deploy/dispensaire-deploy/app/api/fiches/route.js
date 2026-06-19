import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const KEY = 'fiches';

export async function GET() {
  try {
    const fiches = (await kv.get(KEY)) || [];
    return NextResponse.json({ fiches });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de lecture' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, fiche, fiches, id, patch } = body;

    const current = (await kv.get(KEY)) || [];

    if (action === 'add') {
      const newFiche = { ...fiche, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), updatedAt: new Date().toISOString() };
      const next = [...current, newFiche];
      await kv.set(KEY, next);
      return NextResponse.json({ fiches: next });
    }

    if (action === 'bulkAdd') {
      const stamped = fiches.map(f => ({ ...f, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5), updatedAt: new Date().toISOString() }));
      const next = [...current, ...stamped];
      await kv.set(KEY, next);
      return NextResponse.json({ fiches: next, added: stamped.length });
    }

    if (action === 'update') {
      const next = current.map(f => f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f);
      await kv.set(KEY, next);
      return NextResponse.json({ fiches: next });
    }

    if (action === 'delete') {
      const next = current.filter(f => f.id !== id);
      await kv.set(KEY, next);
      return NextResponse.json({ fiches: next });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur de traitement', details: String(e) }, { status: 500 });
  }
}
