// 1. ACTUALIZAMOS LOS IMPORTS (Agregamos collection, query, where, documentId, getDocs)
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  documentId, 
  getDocs 
} from 'firebase/firestore';

import { db } from './firebase';
import type { UserProfile } from '../types/User';

const USERS_COLLECTION = 'users';

// --- TUS FUNCIONES EXISTENTES (Las dejamos igual) ---

// Obtener perfil de usuario individual
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
};

// Crear o Actualizar perfil
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    // setDoc con { merge: true } crea si no existe, o actualiza si existe
    await setDoc(userRef, {
      ...data,
      uid, // Aseguramos que el UID siempre esté
      lastLogin: Date.now() // Actualizamos última vez visto
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error guardando perfil:", error);
    throw error;
  }
};

// --- 👇 LA NUEVA FUNCIÓN AGREGADA ---

// Traer varios usuarios a la vez (para la lista de participantes)
export const getUsersByIds = async (uids: string[]): Promise<UserProfile[]> => {
  // Si la lista está vacía, no molestamos a Firebase
  if (!uids || uids.length === 0) return [];

  try {
    // Firestore limita el operador 'in' a 10 items por lote.
    // Para este MVP asumimos salas de <10 personas. 
    // Si escalas, aquí habría que dividir en grupos.
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Query especial: "Dame los usuarios cuyo ID esté EN esta lista"
    const q = query(usersRef, where(documentId(), 'in', uids.slice(0, 10)));
    
    const snapshot = await getDocs(q);
    
    // Convertimos los documentos en un array de UserProfile
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error trayendo participantes:", error);
    return [];
  }
};