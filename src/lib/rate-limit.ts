import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number; // en milisegundos
}

/**
 * Limitador de peticiones en memoria (Gold Standard para seguridad).
 * Previene ataques DDoS o abuso de scripts en los endpoints de subida.
 */
export default function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // Por defecto: 1 minuto
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Limitador estandar preconfigurado: 10 peticiones por minuto por IP
export const standardUploadLimiter = rateLimit({ interval: 60000 });

export function getIP(req: NextRequest): string {
  // Manejo estándar de Next.js para IPs
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0];
  return '127.0.0.1';
}
