import { useState, useEffect } from 'react';

const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

export const usePomodoro = () => {
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const playSound = () => {
    const audio = new Audio(ALARM_SOUND_URL);
    audio.volume = 0.5; 
    audio.play().catch(err => console.error("Error reproduciendo audio:", err));
  };

  const getDuration = (currentMode: Mode) => {
    switch (currentMode) {
      case 'shortBreak': return 5 * 60;
      case 'longBreak': return 15 * 60;
      default: return 25 * 60;
    }
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(getDuration(newMode));
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  // Efecto 1: Título de la pestaña (Visual)
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    document.title = isRunning ? `(${timeString}) Saylo` : 'Saylo';
  }, [timeLeft, isRunning]);

  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          // Verificamos si ya terminó (o va a terminar ahora)
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsRunning(false); // Detenemos
            playSound();         // Sonamos
            return 0;            // Fijamos en 0
          }
          return prevTime - 1;   // Seguimos contando
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]); 

  return { 
    timeLeft, 
    isRunning, 
    mode, 
    toggleTimer, 
    resetTimer, 
    changeMode,
    setTimeLeft,
    setIsRunning,
    setMode
  };
};