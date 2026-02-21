export interface UserProfile {
  uid: string;          
  displayName: string;  
  photoURL?: string;   
  bio?: string;         
  favoriteVerse?: string; 
  
  currentReading?: {
    reference: string; 
    text: string;      
  };

  // Metadatos
  createdAt: number;
  lastLogin: number;
}