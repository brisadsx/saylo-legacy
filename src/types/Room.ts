export interface Room {
  id: string;
  hostId: string;
  topicId: string;
  isPrivate: boolean;
  language?: string;
  createdAt: number;
  participants: string[];
  status: 'waiting' | 'active' | 'full';
  
  currentReading?: {
    reference: string;
    text: string;
  };

  timer: {
    mode: 'focus' | 'shortBreak' | 'longBreak'; 
    timeLeft: number;
    isRunning: boolean;
  };
}