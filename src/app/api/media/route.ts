import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import nodePath from 'path';
import { bucket } from '@/lib/firebase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PREFIXES = ['uploads/usuario/', 'uploads/especies/', 'uploads/labores/', 'uploads/blog/', 'uploads/especies_pdfs/', 'uploads/especies_pdfs_covers/', 'uploads/variedad/'];

function normalizeRequestedPath(value: string | null) {
  if (!value) return null;

  let path = value.trim().replace(/\\/g, '/');

  try {
    if (/^https?:\/\//i.test(path)) {
      const url = new URL(path);
      const storagePrefix = `/${bucket.name}/`;
      if (url.hostname === 'storage.googleapis.com' && url.pathname.startsWith(storagePrefix)) {
        path = decodeURIComponent(url.pathname.slice(storagePrefix.length));
      } else if (url.hostname === 'firebasestorage.googleapis.com') {
        const match = url.pathname.match(/\/o\/([^/]+)/);
        path = match ? decodeURIComponent(match[1]) : '';
      } else {
        path = url.pathname;
      }
    }
  } catch {}

  path = path.replace(/^\/+/, '').replace(/^public\//, '');
  if (path.includes('..')) return null;
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) return null;

  return path;
}

export async function GET(request: NextRequest) {
  const mediaPath = normalizeRequestedPath(request.nextUrl.searchParams.get('path'));

  if (!mediaPath) {
    return NextResponse.json({ error: 'Ruta de archivo no permitida' }, { status: 400 });
  }

  try {
    const file = bucket.file(mediaPath);
    const [exists] = await file.exists();

    if (!exists) {
      // La foto no existe en Firebase Storage. En vez de un redirect roto,
      // devolvemos un placeholder SVG para evitar imágenes rotas en producción.
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f1f5f9"/>
        <rect x="150" y="80" width="100" height="80" rx="8" fill="#cbd5e1"/>
        <circle cx="175" cy="105" r="10" fill="#94a3b8"/>
        <polygon points="155,155 200,115 245,155" fill="#94a3b8"/>
        <polygon points="185,155 215,130 245,155" fill="#64748b"/>
        <text x="200" y="195" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14" font-weight="600">Imagen no disponible</text>
      </svg>`;

      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const [metadata] = await file.getMetadata();
    const [contents] = await file.download();

    return new NextResponse(new Uint8Array(contents), {
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Media API] Error sirviendo archivo:', error);
    return NextResponse.json({ error: error.message || 'No se pudo cargar el archivo' }, { status: 500 });
  }
}
