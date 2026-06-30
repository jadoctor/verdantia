import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const METRICS_FILE_PATH = path.join(process.cwd(), '.verdantia-metrics.json');

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

function readMetrics() {
  try {
    if (fs.existsSync(METRICS_FILE_PATH)) {
      const data = fs.readFileSync(METRICS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading metrics:', error);
  }
  return {};
}

function writeMetrics(metrics: any) {
  try {
    fs.writeFileSync(METRICS_FILE_PATH, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing metrics:', error);
  }
}

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const modulePath = searchParams.get('path'); // e.g. "admin/especies/page.tsx"

  if (!modulePath) {
    const allMetrics = readMetrics();
    const unanalyzedFiles: string[] = [];
    
    Object.keys(allMetrics).forEach((fileKey) => {
      const metric = allMetrics[fileKey];
      if (metric && metric.last_updated) {
        const safePath = fileKey.replace(/\.\./g, '').replace(/\\/g, '/');
        let fullPath = path.join(process.cwd(), 'src', 'app', 'dashboard', safePath);
        if (safePath.startsWith('components/')) {
          fullPath = path.join(process.cwd(), 'src', safePath);
        }
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          const lastModified = new Date(stats.mtime).getTime();
          const lastAnalyzed = new Date(metric.last_updated).getTime();
          if (lastModified > lastAnalyzed) {
            unanalyzedFiles.push(fileKey);
          }
        }
      }
    });
    return NextResponse.json({ success: true, metrics: allMetrics, unanalyzedFiles });
  }

  const allMetrics = readMetrics();
  const moduleMetrics = allMetrics[modulePath] || null;

  let hasUnanalyzedChanges = false;
  
  if (moduleMetrics && moduleMetrics.last_updated) {
    const safePath = modulePath.replace(/\.\./g, '').replace(/\\/g, '/');
    const fullPath = path.join(process.cwd(), 'src', 'app', 'dashboard', safePath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const lastModified = new Date(stats.mtime).getTime();
      const lastAnalyzed = new Date(moduleMetrics.last_updated).getTime();
      
      // Si el archivo fue modificado después de la última vez que se analizó
      if (lastModified > lastAnalyzed) {
        hasUnanalyzedChanges = true;
      }
    }
  }

  return NextResponse.json({ success: true, metrics: moduleMetrics, hasUnanalyzedChanges });
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { modulePath, metrics } = await request.json();
    if (!modulePath || !metrics) {
      return NextResponse.json({ error: 'Faltan parámetros (modulePath, metrics)' }, { status: 400 });
    }

    const allMetrics = readMetrics();
    allMetrics[modulePath] = {
      ...metrics,
      last_updated: new Date().toISOString()
    };

    writeMetrics(allMetrics);

    return NextResponse.json({ success: true, metrics: allMetrics[modulePath] });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
