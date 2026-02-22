import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const sendFeedback = async (userId: string, type: 'bug' | 'feature' | 'other', message: string) => {
  try {
    await addDoc(collection(db, 'feedback'), {
      userId,
      type,
      message,
      createdAt: serverTimestamp(),
      status: 'new' 
    });
  } catch (error) {
    console.error("Error enviando feedback:", error);
    throw error;
  }
};