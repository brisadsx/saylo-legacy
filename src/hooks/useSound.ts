// src/hooks/useSound.ts
import { useCallback } from 'react';

const BELL_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 

export const useSound = () => {
  const playBell = useCallback(() => {
    try {
      const audio = new Audio(BELL_SOUND);
      audio.volume = 0.5; 
      audio.play().catch(error => {
        console.warn("Audio bloqueado por el navegador:", error);
      });
    } catch (e) {
      console.error("Error al reproducir sonido", e);
    }
  }, []);

  return { playBell };
};