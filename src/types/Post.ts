import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  
  content: string;     // El texto del post
  likes: number;       // Contador visual rápido
  likedBy: string[];   // Array de IDs para saber si YO ya le di like
  
  createdAt: Timestamp; // Para ordenar cronológicamente
}