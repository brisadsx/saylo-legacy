import { GoogleGenerativeAI } from "@google/generative-ai";

import { searchVideoForChat, type VideoResult } from './youtube';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface BotResponse {
  message: string;
  video: VideoResult | null;
}

export const askSayloBot = async (userMessage: string): Promise<BotResponse> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // EL PROMPT MAESTRO:
    // Le enseñamos a Gemini a entender tu estructura de 'ChannelCategory'
    const prompt = `
      Eres Saylo, un asistente espiritual en una comunidad cristiana joven.
      El usuario dice: "${userMessage}".

      Tu misión es:
      1. Responder con empatía y brevedad (máximo 2 frases).
      2. Analizar qué TEMA busca el usuario (ej: "ansiedad", "gozo", "fe").
      3. Analizar la INTENCIÓN (Formato):
         - Si pide música, alabanza, adoración, canción -> "worship"
         - Si pide palabra, mensaje, prédica, consejo, ayuda -> "sermon"
         - Si no especifica, deduce lo mejor para su estado de ánimo.

      Responde ÚNICAMENTE con este JSON válido:
      {
        "chatResponse": "Tu respuesta aquí...",
        "topic": "palabra clave del tema",
        "intent": "worship" o "sermon"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Limpieza de JSON (por si Gemini agrega bloques de código)
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    console.log(`🤖 Saylo Cerebro: Tema="${parsed.topic}" | Intención="${parsed.intent}"`);

    // --- AQUÍ OCURRE LA MAGIA ---
    // Usamos TU función de youtube.ts que filtra por tus canales de channels.ts
    const videoData = await searchVideoForChat(
        parsed.topic, 
        parsed.intent as 'worship' | 'sermon' // Forzamos el tipo porque confiamos en el prompt
    );

    return {
      message: parsed.chatResponse,
      video: videoData
    };

  } catch (error) {
    console.error("Error en Saylo Bot:", error);
    return {
      message: "Estoy orando por ti. Tuve un pequeño problema técnico, pero no pierdas la fe. 🙏",
      video: null
    };
  }
};