import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import nodePath from 'path';
import { bucket } from '@/lib/firebase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PREFIXES = ['uploads/usuario/', 'uploads/especies/', 'uploads/labores/', 'uploads/blog/', 'uploads/especies_pdfs/', 'uploads/variedad/'];

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
      try {
        const publicPath = nodePath.join(process.cwd(), 'public', mediaPath);
        const contents = await readFile(publicPath);
        return new NextResponse(new Uint8Array(contents), {
          headers: {
            'Content-Type': mediaPath.endsWith('.webp') ? 'image/webp' : mediaPath.endsWith('.png') ? 'image/png' : mediaPath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch {
        return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
      }
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
