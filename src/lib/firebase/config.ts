import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBq3yOKLmVHoZEoYCbUyTlpOGxXNaIyAm8",
  authDomain: "verdantia-494121.firebaseapp.com",
  projectId: "verdantia-494121",
  storageBucket: "verdantia-494121.firebasestorage.app",
  messagingSenderId: "681399764298",
  appId: "1:681399764298:web:906003ed8edb43cee2edb3"
};

// Initialize Firebase (evita el error de múltiples inicializaciones en Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
