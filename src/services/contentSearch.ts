// src/services/contentSearch.ts
import videoDb from '../data/video-db.json';

// 1. DEFINIMOS LA FORMA DE LOS DATOS (Interfaces)
// Así TypeScript sabe exactamente qué hay dentro del JSON sin usar 'any'
interface VideoChunk {
  text: string;
  offset: number;
}

interface VideoEntry {
  videoId: string;
  title: string;
  channel: string;
  fullTranscript: string;
  chunks: VideoChunk[];
}

export interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  matchedText: string;
  timestamp: number;
  score: number;
}

export const searchContentInVideos = (query: string): SearchResult | null => {
  // Limpiamos la query: minúsculas y sin tildes
  const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const queryWords = cleanQuery.split(' ').filter(w => w.length > 3); 

  let bestMatch: SearchResult | null = null;
  let highestScore = 0;

  // 2. CASTING SEGURO
  // Le decimos a TS: "Confía en mí, este JSON tiene esta forma"
  const db = videoDb as unknown as VideoEntry[];

  // RECORREMOS CADA VIDEO
  for (const video of db) {
    // RECORREMOS CADA FRASE (CHUNK)
    for (const chunk of video.chunks) {
      const chunkText = chunk.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let score = 0;

      // A. Coincidencia Exacta
      if (chunkText.includes(cleanQuery)) {
        score += 100;
      }

      // B. Coincidencia por Palabras Clave
      let foundWords = 0;
      for (const word of queryWords) {
        if (chunkText.includes(word)) {
          score += 15;
          foundWords++;
        }
      }

      // Bonus si encontró todas las palabras
      if (foundWords === queryWords.length && queryWords.length > 1) {
        score += 50;
      }

      // Guardamos el mejor resultado
      if (score > highestScore && score > 30) { 
        highestScore = score;
        bestMatch = {
          videoId: video.videoId,
          title: video.title,
          channel: video.channel,
          matchedText: chunk.text,
          timestamp: Math.floor(chunk.offset / 1000), // Convertimos ms a segundos
          score
        };
      }
    }
  }

  return bestMatch;
};