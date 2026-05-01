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
const CDN_BASE = `https://storage.googleapis.com/${BUCKET}`;

const STORAGE_HOSTS = [
  `https://storage.googleapis.com/${BUCKET}/`,
  'https://storage.googleapis.com/verdantia-494121.appspot.com/',
];

function appendCacheBust(url: string, enabled: boolean) {
  if (!enabled || !url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Extrae la ruta interna del Storage (ej. "uploads/blog/foto.webp")
 * a partir de cualquier URL completa de Google Storage / Firebase.
 */
function extractStoragePath(rawUrl: string): string | null {
  // https://storage.googleapis.com/BUCKET/uploads/...
  for (const host of STORAGE_HOSTS) {
    if (rawUrl.startsWith(host)) {
      return rawUrl.slice(host.length).split('?')[0];
    }
  }

  // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/uploads%2F...?alt=media
  const firebaseStorageMatch = rawUrl.match(/\/o\/([^?]+)/);
  if (firebaseStorageMatch) {
    return decodeURIComponent(firebaseStorageMatch[1]);
  }

  return null;
}

/**
 * Convierte cualquier referencia de archivo a URL directa de CDN.
 */
export function getMediaUrl(value?: string | null, options: { cacheBust?: boolean } = {}): string {
  if (!value) return '';

  const clean = value.trim().replace(/\\/g, '/');
  if (!clean) return '';
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean;

  // ── Ya es una URL /api/media?path=... → extraer path y convertir a CDN ──
  if (clean.startsWith('/api/media')) {
    try {
      const fakeBase = 'http://x';
      const parsed = new URL(clean, fakeBase);
      const pathParam = parsed.searchParams.get('path');
      if (pathParam) {
        return appendCacheBust(`${CDN_BASE}/${pathParam}`, Boolean(options.cacheBust));
      }
    } catch {}
    // Fallback: devolver tal cual si no se puede parsear
    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  // ── URL absoluta (https://...) ──
  if (/^https?:\/\//i.test(clean)) {
    const storagePath = extractStoragePath(clean);
    if (storagePath) {
      return appendCacheBust(`${CDN_BASE}/${storagePath}`, Boolean(options.cacheBust));
    }

    // URL de localhost legacy
    try {
      const url = new URL(clean);
      if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.pathname.startsWith('/uploads/')) {
        return appendCacheBust(`${CDN_BASE}/${url.pathname.slice(1)}`, Boolean(options.cacheBust));
      }
    } catch {}

    // Otra URL externa → devolver tal cual
    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  // ── Ruta relativa (uploads/..., /uploads/..., public/uploads/...) ──
  const withoutPublic = clean.replace(/^\/?public\//, '');
  const path = withoutPublic.startsWith('/') ? withoutPublic.slice(1) : withoutPublic;

  if (path.startsWith('uploads/')) {
    return appendCacheBust(`${CDN_BASE}/${path}`, Boolean(options.cacheBust));
  }

  // Cualquier otra cosa (logo local, etc.) → ruta relativa normal
  return appendCacheBust(clean.startsWith('/') ? clean : `/${clean}`, Boolean(options.cacheBust));
}
