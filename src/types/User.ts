export interface FavoriteItem {
  id: string; 
  type: 'movie' | 'book';
  title: string;
  coverUrl: string;
}
export interface UserProfile {
  uid: string;          
  displayName: string;  
  photoURL?: string;   
  bio?: string;         
  favoriteVerse?: string;
  username?: string; 

  posts: number;
  followers: number;
  streakDays: number;
  instagram?: string;
  twitter?: string;

  currentReading?: {
    reference: string; 
    text: string;      
  };
  
  totalAppTime?: number;
  favorites?: FavoriteItem[];
  createdAt: number;
  lastLogin: number;
}