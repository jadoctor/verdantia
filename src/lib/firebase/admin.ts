// Bypass de Análisis Estático para Turbopack/Next.js 15
// Usamos eval para evitar que Turbopack detecte y empaquete/hashee firebase-admin,
// lo que rompía la aplicación en producción con el error del hash (a14c8...).

export function getAdminApp() {
  const admin = eval(`require('firebase-admin')`);
  
  // Protect against multiple initializations
  if (!admin.apps.length) {
    try {
      // Para entornos locales, esto inicializa Firebase Admin si usaste:
      // En producción (Vercel/Firebase), usará las variables de entorno o ADC.
      if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        // Intenta usar las credenciales por defecto (Application Default Credentials)
        admin.initializeApp();
      }
    } catch (error) {
      console.error('[Firebase Admin] Error crítico de inicialización:', error);
      throw error;
    }
  }
  return admin;
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminBucket() {
  return getAdminApp().storage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'verdantia-494121.firebasestorage.app');
}
