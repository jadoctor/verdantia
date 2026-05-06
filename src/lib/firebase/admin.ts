// Bypass de Análisis Estático para Turbopack/Next.js 15
// Usamos eval para evitar que Turbopack detecte y empaquete/hashee firebase-admin,
// lo que rompía la aplicación en producción con el error del hash (a14c8...).

type AdminSdk = {
  apps?: unknown[];
  app: () => unknown;
  initializeApp: (options?: unknown) => unknown;
  credential: {
    cert: (serviceAccount: {
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
    }) => unknown;
  };
  auth: (app?: unknown) => AdminAuth;
  storage: (app?: unknown) => {
    bucket: (name?: string) => AdminBucket;
  };
};

let cachedAdminSdk: AdminSdk | null = null;
let cachedAdminApp: unknown = null;

type AdminBucketFile = {
  save: (data: Buffer, options?: { metadata?: { contentType?: string; cacheControl?: string } }) => Promise<unknown>;
  makePublic: () => Promise<unknown>;
  delete: () => Promise<unknown>;
  download: () => Promise<[Buffer]>;
  exists: () => Promise<[boolean]>;
  getMetadata: () => Promise<Array<{ contentType?: string }>>;
};

type AdminBucket = {
  name: string;
  file: (path: string) => AdminBucketFile;
};

type AdminUser = {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
};

type ActionCodeSettings = {
  url: string;
};

type AdminAuth = {
  getUserByEmail: (email: string) => Promise<AdminUser>;
  createCustomToken: (uid: string) => Promise<string>;
  generateEmailVerificationLink: (email: string, settings?: ActionCodeSettings) => Promise<string>;
  generatePasswordResetLink: (email: string, settings?: ActionCodeSettings) => Promise<string>;
  updateUser: (uid: string, properties: { email?: string }) => Promise<AdminUser>;
};

function getAdminSdk() {
  if (cachedAdminSdk) return cachedAdminSdk;
  cachedAdminSdk = eval(`require('firebase-admin')`) as AdminSdk;
  return cachedAdminSdk;
}

export function getAdminApp() {
  if (cachedAdminApp) return cachedAdminApp;

  const admin = getAdminSdk();
  if (admin.apps?.length) {
    cachedAdminApp = admin.app();
    return cachedAdminApp;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'verdantia-494121.firebasestorage.app';

  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      cachedAdminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket,
      });
    } else {
      // En Firebase Functions/Hosting usa ADC y ya deja enlazado el bucket por defecto.
      cachedAdminApp = admin.initializeApp({ storageBucket });
    }
  } catch (error: unknown) {
    // Mitiga race conditions en cold starts concurrentes.
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('already exists')) {
      cachedAdminApp = admin.app();
      return cachedAdminApp;
    }
    console.error('[Firebase Admin] Error crítico de inicialización:', error);
    throw error;
  }

  return cachedAdminApp;
}

export function getAdminAuth() {
  const admin = getAdminSdk();
  const app = getAdminApp();
  return admin.auth(app);
}

export function getAdminBucket() {
  const admin = getAdminSdk();
  const app = getAdminApp();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'verdantia-494121.firebasestorage.app';
  return admin.storage(app).bucket(storageBucket);
}
