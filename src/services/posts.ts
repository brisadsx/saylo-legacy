import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from '../types/Post';

const POSTS_COLLECTION = 'posts';

// 1. CREAR POST
export const createPost = async (userId: string, userName: string, userAvatar: string, content: string) => {
  try {
    await addDoc(collection(db, POSTS_COLLECTION), {
      userId,
      userName,
      userAvatar,
      content,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creando post:", error);
    throw error;
  }
};

// 2. LEER POSTS (Últimos 20)
export const getRecentPosts = async (): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    console.error("Error leyendo posts:", error);
    return [];
  }
};

// 3. DAR / QUITAR LIKE (Toggle)
export const toggleLike = async (postId: string, userId: string, isLiked: boolean) => {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  try {
    if (isLiked) {
      // Si ya le di like -> QUITARLO
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
    } else {
      // Si no le he dado like -> PONERLO
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error("Error en like:", error);
  }
};