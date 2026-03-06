import { useState } from 'react';
import { Clock, Edit2, Pause, Play, RotateCcw } from 'lucide-react';

interface TimerWidgetProps {
  timeLeft: number;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  isHost: boolean;
  isRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  setTimeLeft: (time: number) => void;
  changeMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
}

export const TimerWidget = ({ 
  timeLeft, mode, isHost, isRunning, toggleTimer, resetTimer, setTimeLeft, changeMode 
}: TimerWidgetProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customMins, setCustomMins] = useState(25);

  const format = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg border border-black/10 p-4 flex flex-col items-center shrink-0">
       <div className="flex items-center justify-center gap-2 mb-1 w-full relative">
          <Clock size={14} className="text-black/40" />
          <h2 className="text-[10px] uppercase tracking-widest text-black/60 font-black">
            {mode === 'focus' ? 'Focus Mode' : 'Break Time'}
          </h2>
          {isHost && (
            <button onClick={() => setIsEditing(!isEditing)} className="absolute right-0 text-black/40 hover:text-black transition-colors">
              <Edit2 size={12} />
            </button>
          )}
       </div>

       {isEditing && isHost ? (
          <div className="flex items-center gap-2 my-2">
            <input type="number" min="1" value={customMins} onChange={(e) => setCustomMins(Number(e.target.value))} className="w-16 text-center text-xl font-mono font-black border border-black/20 rounded p-1 outline-none" />
            <span className="text-xs font-bold text-black/50">min</span>
            <button onClick={() => { setTimeLeft(customMins * 60); setIsEditing(false); }} className="bg-black text-[#F2E3D0] px-3 py-1 rounded text-xs font-bold ml-2 transition-transform hover:scale-105">Save</button>
          </div>
       ) : (
          <div className="text-5xl font-mono font-black text-black tracking-tighter my-2 drop-shadow-sm">{format(timeLeft)}</div>
       )}

       {isHost ? (
         <div className="flex flex-col gap-2 w-full mt-2">
           <div className="flex items-center gap-2 w-full">
              <button onClick={toggleTimer} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isRunning ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-black text-[#F2E3D0] hover:bg-black/80'}`}>
                {isRunning ? <Pause size={14} /> : <Play size={14} />} {isRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={resetTimer} className="p-2 bg-black/5 hover:bg-black/10 rounded-xl text-black transition-colors"><RotateCcw size={16} /></button>
           </div>
           
           <div className="flex bg-black/5 rounded-lg p-1 w-full border border-black/5">
              {['focus', 'shortBreak', 'longBreak'].map(m => (
                <button key={m} onClick={() => changeMode(m as 'focus' | 'shortBreak' | 'longBreak')} className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === m ? 'bg-white shadow-sm text-black' : 'text-black/50 hover:text-black'}`}>
                  {m === 'shortBreak' ? 'Short' : m === 'longBreak' ? 'Long' : 'Focus'}
                </button>
              ))}
           </div>
         </div>
       ) : (
         <p className="text-black/40 text-[9px] font-bold uppercase tracking-widest animate-pulse flex justify-center items-center gap-2 mt-2">
           <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Synchronized
         </p>
       )}
    </div>
  );
};