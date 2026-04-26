import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache the data in memory
let cachedData: [string, string][] | null = null;

function loadData(): [string, string][] {
  if (cachedData) return cachedData;
  const filePath = path.join(process.cwd(), 'src/data/cp_es.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedData = JSON.parse(raw);
  return cachedData!;
}

/**
 * GET /api/location/search?q=texto&type=cp|ciudad
 * Búsqueda bidireccional: por código postal o por nombre de ciudad.
 * Devuelve máximo 10 resultados.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const type = searchParams.get('type') || 'cp'; // 'cp' o 'ciudad'

  if (q.length === 0) {
    // Return first 5 entries as initial suggestions
    const data = loadData();
    const initial = data.slice(0, 5).map(([cp, ciudad]) => ({ cp, ciudad }));
    return NextResponse.json({ results: initial });
  }

  const data = loadData();
  const results: { cp: string; ciudad: string }[] = [];
  const seen = new Set<string>();

  for (const [cp, ciudad] of data) {
    if (results.length >= 5) break;

    if (type === 'cp') {
      // Buscar por código postal
      if (cp.startsWith(q)) {
        const key = `${cp}-${ciudad}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ cp, ciudad });
        }
      }
    } else {
      // Buscar por nombre de ciudad
      if (ciudad.toLowerCase().includes(q)) {
        const key = `${cp}-${ciudad}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ cp, ciudad });
        }
      }
    }
  }

  return NextResponse.json({ results });
}
