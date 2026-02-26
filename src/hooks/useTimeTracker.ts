import { useEffect } from 'react';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useTimeTracker = (userId: string | null) => {
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          totalAppTime: increment(60) 
        });
      } catch (err) {
        console.error("Error updating time tracking:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);
};