import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
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
      q = query(
        roomsRef,
        where('isPrivate', '==', false),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'desc')
      );
    } else {
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

export const createNewRoom = async (userId: string, topicInput: string): Promise<string> => {
  const cleanTopic = topicInput.trim().toUpperCase() || 'GENERAL';
  
  try {
    const newRoom: Omit<Room, 'id'> = {
      hostId: userId,
      topicId: cleanTopic,
      isPrivate: false,
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

export const toggleRoomPrivacy = async (roomId: string, makePrivate: boolean) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, { isPrivate: makePrivate });
  } catch (error) {
    console.error("Error cambiando privacidad:", error);
    throw error;
  }
};

export const joinRoomById = async (roomId: string, userId: string): Promise<boolean> => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error("Sala no encontrada");
    if (roomSnap.data().status === 'full') throw new Error("Sala llena");

    await updateDoc(roomRef, { participants: arrayUnion(userId) });
    return true; 
  } catch (error) {
    console.error("Error uniéndose a sala:", error);
    return false;
  }
};


export const subscribeToRoom = (roomId: string, callback: (data: Room | null) => void) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Room);
    } else {
      callback(null); // deja de suscribirse si la sala fue eliminada
    }
  });
};

export const updateTimerState = async (roomId: string, newTimerState: Room['timer']) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { timer: newTimerState });
};

export const createPrivateRoom = async (userId: string): Promise<string> => {
  try {
    const newRoom: Omit<Room, 'id'> = {
      hostId: userId,
      topicId: 'PRIVADO', 
      isPrivate: true,    
      language: 'es',
      createdAt: Date.now(),
      participants: [userId],
      status: 'waiting',
      timer: { mode: 'focus', timeLeft: 25 * 60, isRunning: false }
    };
    
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

export const endRoom = async (roomId: string) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error("Error eliminando la sala:", error);
  }
};