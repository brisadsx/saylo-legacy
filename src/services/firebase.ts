import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 1. configuración
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

console.log("Auditoría de Configuración:", firebaseConfig);

export const app = initializeApp(firebaseConfig);

// 3. exportar servicios
export const db = getFirestore(app);   // bd firestore
export const auth = getAuth(app);      // login y autenticación

console.log("Firebase inicializado correctamente");
