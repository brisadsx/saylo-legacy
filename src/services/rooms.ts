import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  getDocs,
  updateDoc, 
  arrayUnion, 
  query, 
  where,
  orderBy,
  startAt,
  endAt,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Room } from '../types/Room';

const ROOMS_COLLECTION = 'rooms';

export const searchPublicRooms = async (topicQuery: string = ''): Promise<Room[]> => {
  try {
    const roomsRef = collection(db, ROOMS_COLLECTION);
    let q;

    const cleanQuery = topicQuery.trim().toUpperCase();

    if (!cleanQuery) {
      // Caso 1: Traer todas las públicas en espera
      q = query(
        roomsRef,
        where('isPrivate', '==', false),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Caso 2: Búsqueda por prefijo de tema (Truco NoSQL para búsqueda de texto básica)
      q = query(
        roomsRef,
        where('isPrivate', '==', false),
        where('status', '==', 'waiting'),
        orderBy('topicId'),
        startAt(cleanQuery),
        endAt(cleanQuery + '\uf8ff')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));

  } catch (error) {
    console.error("Error buscando salas:", error);
    throw error;
  }
};

/**
 * 2. CREAR SALA SIMPLE
 * Crea una sala pública por defecto. El host luego puede hacerla privada.
 */
export const createNewRoom = async (userId: string, topicInput: string): Promise<string> => {
  const cleanTopic = topicInput.trim().toUpperCase() || 'GENERAL';
  
  try {
    // Usamos Omit<Room, 'id'> para tipado estricto
    const newRoom: Omit<Room, 'id'> = {
      hostId: userId,
      topicId: cleanTopic, // Aquí va el "tag" (versículo, libro, tema)
      isPrivate: false,    // Pública por defecto al crear
      language: 'es',
      createdAt: Date.now(),
      participants: [userId],
      status: 'waiting',
      timer: { mode: 'focus', timeLeft: 25 * 60, isRunning: false }
    };
    
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), newRoom);
    return docRef.id;
  } catch (error) {
    console.error("Error creando sala:", error);
    throw error;
  }
};

/**
 * 3. CAMBIAR PRIVACIDAD (Solo para el Host)
 */
export const toggleRoomPrivacy = async (roomId: string, makePrivate: boolean) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, { isPrivate: makePrivate });
  } catch (error) {
    console.error("Error cambiando privacidad:", error);
    throw error;
  }
};

// MANTENER: joinRoomById (para unirse con código)
export const joinRoomById = async (roomId: string, userId: string): Promise<boolean> => {
  // ... (Mantén el código que ya tenías para esto) ...
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error("Sala no encontrada");
    // Validar si está llena antes de unir (opcional, buen detalle senior)
    if (roomSnap.data().status === 'full') throw new Error("Sala llena");

    await updateDoc(roomRef, { participants: arrayUnion(userId) });
    return true; 
  } catch (error) {
    console.error("Error uniéndose a sala:", error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/* UTILITIES                                  */
/* -------------------------------------------------------------------------- */

export const subscribeToRoom = (roomId: string, callback: (data: Room) => void) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      // Casteamos con seguridad porque confiamos en la estructura
      callback({ id: docSnap.id, ...docSnap.data() } as Room);
    }
  });
};

// Solución al error de línea 132: Especificamos el tipo exacto del timer
export const updateTimerState = async (roomId: string, newTimerState: Room['timer']) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { timer: newTimerState });
};

export const createPrivateRoom = async (userId: string): Promise<string> => {
  try {
    // Usamos Omit<Room, 'id'> para mantener el tipado estricto
    const newRoom: Omit<Room, 'id'> = {
      hostId: userId,
      topicId: 'PRIVADO', // Marcador especial
      isPrivate: true,    // IMPORTANTE: Esto la hace invisible al buscador
      language: 'es',
      createdAt: Date.now(),
      participants: [userId],
      status: 'waiting',
      timer: { mode: 'focus', timeLeft: 25 * 60, isRunning: false }
    };
    
    // Agregamos import { collection, addDoc } ... si no lo tienes a mano,
    // pero ya deberías tenerlo importado arriba en este archivo.
    const docRef = await addDoc(collection(db, 'rooms'), newRoom);
    return docRef.id;
  } catch (error) {
    console.error("Error creando sala privada:", error);
    throw error;
  }

};

export const updateRoomReading = async (roomId: string, reading: { reference: string, text: string }) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { 
      currentReading: reading 
    });
  } catch (error) {
    console.error("Error actualizando lectura:", error);
  }
};