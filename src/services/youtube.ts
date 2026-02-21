import { CHANNELS_DB } from '../data/channels';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

// Tipado estricto para la respuesta de API
interface YouTubeApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

const cleanText = (text: string) => {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9\s]/g, ''); 
};

export const searchVideoForChat = async (
  querySubject: string, 
  intentFormat: 'sermon' | 'worship', 
  ignoredVideoIds: string[] = []
): Promise<VideoResult | null> => {
  if (!API_KEY) return null;

  // 1. FILTRO DE CANALES
  const validChannels = CHANNELS_DB.filter(ch => ch.categories.includes(intentFormat));
  const shuffledChannels = [...validChannels].sort(() => 0.5 - Math.random());
  
  const cleanSubject = cleanText(querySubject);

  // 2. BÚSQUEDA ESTRICTA POR ID
  for (const channel of shuffledChannels) {
    let suffix = '';
    
    if (intentFormat === 'worship') {
      suffix = channel.lang === 'en' ? 'worship song music' : 'alabanza adoracion musica';
    } else {
      // Optimizamos sufijos para encontrar prédicas específicas
      suffix = channel.lang === 'en' ? 'sermon message' : 'predica mensaje';
    }

    // Probamos: 1. Tema + Sufijo, 2. Tema solo (pero DENTRO del canal)
    const queries = [`${cleanSubject} ${suffix}`, cleanSubject];
    const durationStrategy = intentFormat === 'worship' ? ['medium', 'any'] : ['long', 'medium'];

    for (const q of queries) {
      for (const duration of durationStrategy) {
        try {
          // ⚠️ CAMBIO CRÍTICO: Siempre usamos 'channelId', nunca 'q' con handle.
          // Esto crea una cerca eléctrica alrededor del canal. YouTube no puede salir de aquí.
          const fetchUrl = `${BASE_URL}?part=snippet&type=video&q=${encodeURIComponent(q)}&channelId=${channel.id}&videoDuration=${duration}&maxResults=5&key=${API_KEY}`;

          const res = await fetch(fetchUrl);
          const data = await res.json();

          if (data.items && data.items.length > 0) {
            const validVideo = data.items.find((v: YouTubeApiItem) => !ignoredVideoIds.includes(v.id.videoId));
            
            if (validVideo) {
              return {
                id: validVideo.id.videoId,
                title: validVideo.snippet.title,
                thumbnail: validVideo.snippet.thumbnails.medium.url,
                channelTitle: validVideo.snippet.channelTitle,
              };
            }
          }
        } catch (e) {
          console.error(`Error buscando en ${channel.name}`, e);
        }
      }
    }
  }

  return null;
};