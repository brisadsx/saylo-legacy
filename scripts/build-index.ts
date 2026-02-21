// scripts/build-index.ts
// EJECUTAR CON: npx tsx scripts/build-index.ts

import { YoutubeTranscript } from 'youtube-transcript';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("❌ ERROR: No hay VITE_YOUTUBE_API_KEY en .env");
  process.exit(1);
}

// ✅ CONFIGURACIÓN CON HANDLES
const CHANNELS = [
  { name: 'UPPERROOM', id: 'UCCrxpO3RnaL-RbPbmB3TQCw' },
  { name: 'TTL Iglesia', id: '@ttliglesia' },
  { name: 'origeniglesia', id: '@origeniglesia' }
];

const MAX_VIDEOS_PER_CHANNEL = 50; 

// --- INTERFACES ---
interface VideoContent {
  videoId: string;
  title: string;
  channel: string;
  fullTranscript: string;
  chunks: { text: string, offset: number }[];
}

interface PlaylistItem {
  snippet: {
    title: string;
    resourceId: { videoId: string; };
  };
}

interface PlaylistResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
}

// --- FUNCIONES HELPER ---

// 🧠 FUNCIÓN HÍBRIDA: Soporta ID (UC...) y Handle (@...)
const getUploadsPlaylistId = async (channelIdentifier: string) => {
  let url = '';
  
  if (channelIdentifier.startsWith('@')) {
    // Buscar por Handle
    url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${channelIdentifier}&key=${API_KEY}`;
  } else {
    // Buscar por ID clásico
    url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelIdentifier}&key=${API_KEY}`;
  }

  // Truco para evitar error 403 de referer
  const res = await fetch(url, { headers: { "Referer": "http://localhost:5173" } });
  const data = await res.json();
  
  // CORRECCIÓN: Tipado básico para evitar errores de linter si 'data' es any implícito
  if (data.error) {
    console.error(`   🔥 API Error: ${data.error.message}`);
    return null;
  }

  if (!data.items || data.items.length === 0) return null;
  return data.items[0].contentDetails.relatedPlaylists.uploads;
};

const getVideosFromPlaylist = async (playlistId: string, maxVideos: number) => {
  let videoIds: { id: string, title: string }[] = [];
  let nextPageToken = '';

  while (videoIds.length < maxVideos) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`;
    const res = await fetch(url, { headers: { "Referer": "http://localhost:5173" } });
    const data: PlaylistResponse = await res.json();

    if (!data.items) break;

    const items = data.items.map((item: PlaylistItem) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title
    }));

    videoIds = [...videoIds, ...items];
    if (data.nextPageToken) nextPageToken = data.nextPageToken;
    else break; 
  }
  return videoIds.slice(0, maxVideos);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MAIN ---

const main = async () => {
  console.log(`🤖 Crawler Iniciado (Modo Híbrido: ID/Handle)...`);
  
  const db: VideoContent[] = [];

  for (const channel of CHANNELS) {
    console.log(`\n📡 Conectando con: ${channel.name} (${channel.id})...`);
    
    const uploadsId = await getUploadsPlaylistId(channel.id);
    
    if (!uploadsId) {
      console.error(`   ❌ No se encontró el canal. Verifica el ID o Handle.`);
      continue;
    }

    console.log(`   📥 Descargando últimos ${MAX_VIDEOS_PER_CHANNEL} videos...`);
    const videos = await getVideosFromPlaylist(uploadsId, MAX_VIDEOS_PER_CHANNEL);
    console.log(`   ✅ Encontrados ${videos.length} videos.`);

    for (const [index, video] of videos.entries()) {
      try {
        process.stdout.write(`      [${index + 1}/${videos.length}] ${video.title.substring(0, 40)}... `);
        
        const transcript = await YoutubeTranscript.fetchTranscript(video.id, { lang: 'es' })
          .catch(() => YoutubeTranscript.fetchTranscript(video.id, { lang: 'en' }))
          .catch(() => null);

        if (!transcript) {
          console.log("❌ (Sin CC)");
          continue;
        }

        db.push({
          videoId: video.id,
          title: video.title,
          channel: channel.name,
          fullTranscript: transcript.map(t => t.text).join(' '),
          chunks: transcript.map(t => ({ text: t.text, offset: t.offset }))
        });

        console.log("✅ OK");
        await sleep(200); 

      } catch (e) {
        // CORREGIDO: Ahora usamos 'e' para imprimir el error, satisfaciendo al linter
        console.log("❌ Error:", e);
      }
    }
  }

  const outputPath = path.join(process.cwd(), 'src', 'data', 'video-db.json');
  
  // Aseguramos que el directorio exista
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));
  
  console.log(`\n🎉 TERMINADO. Base de datos con ${db.length} videos guardada.`);
};

main();