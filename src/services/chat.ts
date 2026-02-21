import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Message } from '../types/Message';

export const subscribeToMessages = (roomId: string, callback: (msgs: Message[]) => void) => {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

export const sendMessage = async (
  roomId: string, 
  messageData: { userId: string; userName: string; text: string; timestamp: number }
) => {
  try {
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      ...messageData,
      timestamp: Date.now() 
    });
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    throw error;
  }
};