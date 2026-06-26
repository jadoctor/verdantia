import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
      // First try HEAD
      let response = await fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);

      // Si falla con 405 Method Not Allowed, intentar GET
      if (response.status === 405) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 10000);
        response = await fetch(url, { 
          method: 'GET', 
          signal: getController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        clearTimeout(getTimeoutId);
      }

      return NextResponse.json({ 
        status: response.status,
        ok: response.ok,
        statusText: response.statusText 
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ status: 408, ok: false, error: 'Timeout (10s)' });
      }
      return NextResponse.json({ status: 500, ok: false, error: fetchError.message || 'Error de conexión' });
    }

  } catch (error: any) {
    console.error('Error checking enlace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
