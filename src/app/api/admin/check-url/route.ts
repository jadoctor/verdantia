import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de URLs' }, { status: 400 });
    }

    // Limitar a 50 URLs por petición para no sobrecargar
    const urlsToCheck = urls.slice(0, 50);

    const results: Record<string, boolean> = {};

    await Promise.allSettled(
      urlsToCheck.map(async (url: string) => {
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000), // Timeout 5s
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VerdantiaBot/1.0; +https://verdantia.es)'
            }
          });
          results[url] = res.ok;
        } catch {
          // Si HEAD falla (algunos servidores lo bloquean), intentar GET con rango mínimo
          try {
            const res = await fetch(url, {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
              redirect: 'follow',
              headers: {
                'Range': 'bytes=0-0',
                'User-Agent': 'Mozilla/5.0 (compatible; VerdantiaBot/1.0; +https://verdantia.es)'
              }
            });
            results[url] = res.ok || res.status === 206;
          } catch {
            results[url] = false;
          }
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error checking URLs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
