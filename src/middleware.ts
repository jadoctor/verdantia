import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Apply to all routes (including HTML pages) but exclude static assets in .next folder
  matcher: ['/:path*'],
};
