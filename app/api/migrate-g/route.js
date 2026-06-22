import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const KEY = 'planning_v2';
const SECRET = 'kahani-migrate-2025';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const data = await kv.get(KEY);
  if (!data) return NextResponse.json({ message: 'Rien à migrer', changed: 0 });

  const log = [];
  let changed = 0;

  for (const catId of Object.keys(data)) {
    const cat = data[catId];
    if (!cat?.cellules) continue;
    const newCellules = { ...cat.cellules };
    for (const key of Object.keys(newCellules)) {
      const parts = key.split('|');
      // Format : agentId|YYYY-MM-DD|MOMENT  valeur: 'G'
      if (parts.length === 3 && parts[2] === 'M' && newCellules[key] === 'G') {
        const newKey = `${parts[0]}|${parts[1]}|N`;
        newCellules[newKey] = 'G';
        delete newCellules[key];
        changed++;
        log.push(`${catId}: ${key} → ${newKey}`);
      }
    }
    data[catId] = { ...cat, cellules: newCellules };
  }

  if (changed > 0) {
    await kv.set(KEY, data);
  }

  return NextResponse.json({ changed, log });
}
