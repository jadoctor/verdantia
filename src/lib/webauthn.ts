import type { NextRequest } from 'next/server';

const DEFAULT_ORIGIN = 'http://localhost:3000';

export function getWebAuthnSettings(req: NextRequest) {
  const requestOrigin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_ORIGIN;
  const configuredOrigin = process.env.WEBAUTHN_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
  const origin = new URL(configuredOrigin).origin;

  return {
    rpName: process.env.WEBAUTHN_RP_NAME || 'Verdantia',
    rpID: process.env.WEBAUTHN_RP_ID || new URL(origin).hostname,
    origin,
  };
}
