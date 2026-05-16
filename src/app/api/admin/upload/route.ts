import { NextResponse } from 'next/server';
// Lazy load: NO importar firebase/storage ni sharp estáticamente (causa hash corrupto en Turbopack)
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || (!user.roles?.includes('superadministrador') && !user.roles?.includes('administrador'))) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Archivo y ruta requeridos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    // Lazy import para evitar hash corrupto de Turbopack en producción
    const sharp = eval(`require('sharp')`);
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    
    // Configurar marca de agua
    const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
      <rect x="0" y="0" width="300" height="60" fill="black" fill-opacity="0.4" rx="8" />
      <text x="280" y="40" text-anchor="end"
        font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold"
        fill="white" fill-opacity="0.9" letter-spacing="2">
        VERDANTIA
      </text>
    </svg>`);

    const sharpInstance = sharp(Buffer.from(bytes));
    const metadata = await sharpInstance.metadata();
    const targetWidth = Math.min(metadata.width || 1920, 1920);
    const targetHeight = Math.min(metadata.height || 1080, 1080);

    let mainSharp = sharpInstance
      .clone()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });

    // Aplicar marca de agua si la imagen es suficientemente grande
    if (targetWidth >= 300 && targetHeight >= 60) {
      mainSharp = mainSharp.composite([{
        input: watermarkSvg,
        gravity: 'southeast'
      }]);
    }

    const processedBuffer = await mainSharp
      .webp({ quality: 85 })
      .toBuffer();

    const publicUrl = await uploadToStorage(processedBuffer, path, 'image/webp');

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
