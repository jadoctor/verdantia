/**
 * Resolutor Universal de Medios — Verdantia
 * 
 * Convierte CUALQUIER referencia a un archivo multimedia (ruta relativa,
 * URL de Storage, ruta legacy /api/media) en una URL pública directa
 * de Google Cloud Storage, sin pasar por el proxy /api/media.
 * 
 * Formato final:
 *   https://storage.googleapis.com/BUCKET/uploads/...
 */

const BUCKET = 'verdantia-494121.firebasestorage.app';
const CDN_BASE = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;

const STORAGE_HOSTS = [
  `https://storage.googleapis.com/${BUCKET}/`,
  'https://storage.googleapis.com/verdantia-494121.appspot.com/',
];

function appendCacheBust(url: string, enabled: boolean) {
  if (!enabled || !url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

function extractStoragePath(rawUrl: string): string | null {
  for (const host of STORAGE_HOSTS) {
    if (rawUrl.startsWith(host)) {
      return rawUrl.slice(host.length).split('?')[0];
    }
  }
  const firebaseStorageMatch = rawUrl.match(/\/o\/([^?]+)/);
  if (firebaseStorageMatch) {
    return decodeURIComponent(firebaseStorageMatch[1]);
  }
  return null;
}

function buildFirebaseUrl(path: string, cacheBust: boolean): string {
  const encodedPath = encodeURIComponent(path);
  let url = `${CDN_BASE}/${encodedPath}?alt=media`;
  if (cacheBust) {
    url += `&t=${Date.now()}`;
  }
  return url;
}

export function getMediaUrl(value?: string | null, options: { cacheBust?: boolean } = {}): string {
  if (!value) return '';

  const clean = value.trim().replace(/\\/g, '/');
  if (!clean) return '';
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean;

  if (clean.startsWith('/api/media')) {
    try {
      const fakeBase = 'http://x';
      const parsed = new URL(clean, fakeBase);
      const pathParam = parsed.searchParams.get('path');
      if (pathParam) {
        return buildFirebaseUrl(pathParam, Boolean(options.cacheBust));
      }
    } catch {}
    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  if (/^https?:\/\//i.test(clean)) {
    const storagePath = extractStoragePath(clean);
    if (storagePath) {
      return buildFirebaseUrl(storagePath, Boolean(options.cacheBust));
    }

    try {
      const url = new URL(clean);
      if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.pathname.startsWith('/uploads/')) {
        return buildFirebaseUrl(url.pathname.slice(1), Boolean(options.cacheBust));
      }
    } catch {}

    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  const withoutPublic = clean.replace(/^\/?public\//, '');
  const path = withoutPublic.startsWith('/') ? withoutPublic.slice(1) : withoutPublic;

  if (path.startsWith('uploads/')) {
    return buildFirebaseUrl(path, Boolean(options.cacheBust));
  }

  return appendCacheBust(clean.startsWith('/') ? clean : `/${clean}`, Boolean(options.cacheBust));
}
