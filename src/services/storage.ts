import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase"; 


const storage = getStorage(app);

export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Referencia: users/ID_USUARIO/profile.jpg
    const storageRef = ref(storage, `users/${userId}/profile_pic`);
    
    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener la URL pública para mostrarla
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    throw error;
  }
};