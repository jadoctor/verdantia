import * as admin from 'firebase-admin';

// Asegurar que admin está inicializado (se importa desde admin.ts)
import './admin';

const bucket = admin.storage().bucket('verdantia-494121.firebasestorage.app');

/**
 * Sube un archivo a Firebase Storage y devuelve la URL pública.
 * @param buffer - Buffer con los datos del archivo
 * @param destination - Ruta dentro del bucket (ej: 'uploads/usuario/foto.jpg')
 * @param contentType - MIME type del archivo (ej: 'image/jpeg')
 * @returns URL pública del archivo
 */
export async function uploadToStorage(
  buffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // Cache 1 año
    },
  });

  // Hacer el archivo público
  await file.makePublic();

  // Devolver URL pública
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

/**
 * Elimina un archivo de Firebase Storage.
 * @param destination - Ruta dentro del bucket
 */
export async function deleteFromStorage(destination: string): Promise<void> {
  try {
    const file = bucket.file(destination);
    await file.delete();
  } catch (error: any) {
    // Si el archivo no existe, no pasa nada
    if (error.code !== 404) {
      console.error('[Storage] Error eliminando archivo:', error);
    }
  }
}

export { bucket };
