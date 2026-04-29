const STORAGE_HOSTS = [
  'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/',
  'https://storage.googleapis.com/verdantia-494121.appspot.com/',
];

function appendCacheBust(url: string, enabled: boolean) {
  if (!enabled || !url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

function extractStoragePath(rawUrl: string) {
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

export function getMediaUrl(value?: string | null, options: { cacheBust?: boolean } = {}) {
  if (!value) return '';

  const clean = value.trim().replace(/\\/g, '/');
  if (!clean) return '';
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean;

  if (clean.startsWith('/api/media')) {
    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  if (/^https?:\/\//i.test(clean)) {
    const storagePath = extractStoragePath(clean);
    if (storagePath) {
      return appendCacheBust(`/api/media?path=${encodeURIComponent(storagePath)}`, Boolean(options.cacheBust));
    }

    try {
      const url = new URL(clean);
      if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.pathname.startsWith('/uploads/')) {
        return appendCacheBust(`/api/media?path=${encodeURIComponent(url.pathname.slice(1))}`, Boolean(options.cacheBust));
      }
    } catch {}

    return appendCacheBust(clean, Boolean(options.cacheBust));
  }

  const withoutPublic = clean.replace(/^\/?public\//, '');
  const path = withoutPublic.startsWith('/') ? withoutPublic.slice(1) : withoutPublic;

  if (path.startsWith('uploads/')) {
    return appendCacheBust(`/api/media?path=${encodeURIComponent(path)}`, Boolean(options.cacheBust));
  }

  return appendCacheBust(clean.startsWith('/') ? clean : `/${clean}`, Boolean(options.cacheBust));
}
