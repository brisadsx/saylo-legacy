// URL base de la API pública (Reina Valera 1960 aproximada o similar en español)
const API_URL = 'https://bible-api.com';

export interface BiblePassage {
  reference: string; 
  text: string;     
  verses: {
    book_id: string;
    name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];     
}

export const fetchPassage = async (query: string): Promise<BiblePassage | null> => {
  try {
    // Pedimos la versión en español (RVR)
    // translation=almeida es portugués/español antiguo, pero bible-api tiene 'rvr' o similar.
    // Usaremos la default que suele detectar español si escribes "Juan", 
    // o forzamos 'rvr1960' si tuvieramos key, pero la versión gratis 'bhs' o 'web' es inglés.
    // TRUCO: bible-api.com detecta el idioma del libro. Si pides "Juan 3", te da español.
    
    const response = await fetch(`${API_URL}/${query}?translation=rvr`);
    
    if (!response.ok) throw new Error('Pasaje no encontrado');
    
    const data = await response.json();
    return {
      reference: data.reference,
      text: data.text,
      verses: data.verses
    };
  } catch (error) {
    console.error("Error buscando pasaje:", error);
    return null;
  }
};