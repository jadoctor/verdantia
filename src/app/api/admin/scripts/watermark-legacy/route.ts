import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdminBucket } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const sharp = eval(`require('sharp')`);
    const bucket = getAdminBucket();

    const [rows] = await pool.query(`
      SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, datosadjuntosresumen as resumen 
      FROM datosadjuntos 
      WHERE datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1
    `);

    const photos = rows as any[];
    let processed = 0;
    let skipped = 0;

    const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
      <text x="290" y="50" text-anchor="end"
        font-family="Arial, sans-serif" font-size="28" font-weight="bold"
        fill="white" fill-opacity="0.35" stroke="black" stroke-width="1.5" stroke-opacity="0.25">
        VERDANTIA
      </text>
    </svg>`);

    for (const photo of photos) {
      let resumenObj: any = {};
      try {
        if (photo.resumen) resumenObj = JSON.parse(photo.resumen);
      } catch (e) {}

      if (resumenObj.watermarked) {
        skipped++;
        continue;
      }

      console.log(`Procesando foto ID ${photo.id}: ${photo.ruta}`);

      try {
        const fileRef = bucket.file(photo.ruta);
        const [exists] = await fileRef.exists();
        if (!exists) {
          console.log(`El archivo no existe en Storage: ${photo.ruta}`);
          skipped++;
          continue;
        }

        const [downloadedFile] = await fileRef.download();
        const bytes = downloadedFile;

        const sharpInstance = sharp(Buffer.from(bytes));
        const metadata = await sharpInstance.metadata();
        const targetWidth = Math.min(metadata.width || 1920, 1920);
        const targetHeight = Math.min(metadata.height || 1080, 1080);

        let mainSharp = sharpInstance
          .clone()
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });

        if (targetWidth >= 300 && targetHeight >= 60) {
          mainSharp = mainSharp.composite([{
            input: watermarkSvg,
            gravity: 'southeast'
          }]);
        }

        // Determinar formato de salida basado en la extensión original
        const isWebp = photo.ruta.toLowerCase().endsWith('.webp');
        const isPng = photo.ruta.toLowerCase().endsWith('.png');
        
        let outputBuffer;
        let contentType = 'image/jpeg';
        
        if (isWebp) {
          outputBuffer = await mainSharp.webp({ quality: 85 }).toBuffer();
          contentType = 'image/webp';
        } else if (isPng) {
          outputBuffer = await mainSharp.png({ quality: 85 }).toBuffer();
          contentType = 'image/png';
        } else {
          outputBuffer = await mainSharp.jpeg({ quality: 85 }).toBuffer();
          contentType = 'image/jpeg';
        }

        await fileRef.save(outputBuffer, {
          metadata: { contentType, cacheControl: 'public, max-age=31536000' }
        });

        // Marcar como procesada en la base de datos
        resumenObj.watermarked = true;
        await pool.query(
          "UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ?",
          [JSON.stringify(resumenObj), photo.id]
        );

        processed++;
      } catch (err) {
        console.error(`Error procesando ID ${photo.id}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Proceso de marcas de agua completado',
      stats: { total: photos.length, procesadas: processed, saltadas: skipped }
    });

  } catch (error: any) {
    console.error('Error en script de marcas de agua:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
