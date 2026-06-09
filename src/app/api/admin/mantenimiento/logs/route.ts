import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), 'deploy_progress.log');
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      return new NextResponse(content, { 
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      });
    }
    return new NextResponse('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    return new NextResponse('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
