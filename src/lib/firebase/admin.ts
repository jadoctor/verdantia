// Bypass dinámico para Turbopack
const admin = require('firebase-' + 'admin');

// Protect against multiple initializations
if (!admin.apps.length) {
  try {
    // Para entornos locales, esto inicializa Firebase Admin si usaste:
    // set GOOGLE_APPLICATION_CREDENTIALS=ruta/a/tu/archivo.json
    // En producción (Vercel), usará las variables de entorno.
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Reemplaza los saltos de línea literales \n por saltos reales (requerido en Next.js/Vercel)
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Intenta usar las credenciales por defecto (Application Default Credentials)
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
