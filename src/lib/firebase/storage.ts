// Lazy loaded to avoid Turbopack hash bug

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
  const { bucket } = await import('./admin');
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // Cache 1 año
    },
  });

  try {
    await file.makePublic();
  } catch (e) {
    console.warn('[Storage] No se pudo hacer público el archivo. Verifica permisos.', e);
  }

  // URL pública directa de Google Cloud Storage (sin proxy /api/media)
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

/**
 * Elimina un archivo de Firebase Storage.
 * @param destination - Ruta dentro del bucket
 */
export async function deleteFromStorage(destination: string): Promise<void> {
  try {
    const { bucket } = await import('./admin');
    const file = bucket.file(destination);
    await file.delete();
  } catch (error: any) {
    // Si el archivo no existe, no pasa nada
    if (error.code !== 404) {
      console.error('[Storage] Error eliminando archivo:', error);
    }
  }
}


