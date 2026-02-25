export interface UserProfile {
  uid: string;          
  displayName: string;  
  photoURL?: string;   
  bio?: string;         
  favoriteVerse?: string;
  username?: string; 
  
  currentReading?: {
    reference: string; 
    text: string;      
  };

  // metadatos útiles para la app, no necesariamente parte del perfil público
  createdAt: number;
  lastLogin: number;
}