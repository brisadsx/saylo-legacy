import { useState } from 'react';
import { Check, Copy, Globe, Image as ImageIcon, Lock, LogOut, Users, Video as VideoIcon } from 'lucide-react';
import { ParticipantsList } from './ParticipantsList';

interface RoomHeaderProps {
  currentRoomId: string;
  isRoomPrivate: boolean;
  isHost: boolean;
  participants: string[];
  inCall: boolean;
  setInCall: (value: boolean) => void;
  setBgUrl: (url: string) => void;
  handleExitRoom: () => void;
  handleTogglePrivacy: () => void;
  defaultBg: string;
}

export const RoomHeader = ({ 
  currentRoomId, isRoomPrivate, isHost, participants, inCall, setInCall, setBgUrl, handleExitRoom, handleTogglePrivacy, defaultBg 
}: RoomHeaderProps) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingBg, setIsEditingBg] = useState(false);
  const [newBgInput, setNewBgInput] = useState('');

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 bg-white shadow-md px-4 lg:px-6 flex items-center justify-between shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-white ${isRoomPrivate ? 'bg-red-500' : 'bg-green-500'}`}>
          {isRoomPrivate ? 'Private' : 'Public'}
        </span>
        <div className="flex items-center gap-2 text-black">
          <span className="text-sm font-black tracking-widest uppercase flex items-center gap-1"><span className="text-black/30">#</span>{currentRoomId}</span>
          <button onClick={copyRoomId} className="p-1 hover:bg-black/5 rounded-md transition-colors text-black/40 hover:text-black">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <span className="bg-[#F2E3D0] text-black px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider hidden sm:inline-block ml-2 border border-black/10">
            {isHost ? 'Host' : 'Guest'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* BOTÓN CAMBIAR FONDO */}
        <div className="relative">
          <button onClick={() => setIsEditingBg(!isEditingBg)} className="flex items-center gap-2 text-xs font-bold bg-black/5 text-black hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors">
            <ImageIcon size={14} /> <span className="hidden sm:inline">Background</span>
          </button>
          {isEditingBg && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-black/10 rounded-xl shadow-2xl p-3 z-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-2">Image URL</p>
              <input type="text" value={newBgInput} onChange={(e) => setNewBgInput(e.target.value)} placeholder="Paste image URL..." className="w-full text-xs p-2 rounded bg-black/5 border-none outline-none mb-2 text-black" />
              <button onClick={() => { setBgUrl(newBgInput || defaultBg); setIsEditingBg(false); }} className="w-full bg-black text-[#F2E3D0] text-xs py-1.5 rounded font-bold uppercase tracking-wider transition-transform hover:scale-105">Apply</button>
            </div>
          )}
        </div>

        {/* PARTICIPANTES CON Z-INDEX ARREGLADO */}
        <div className="relative">
          <button onClick={() => setShowParticipants(!showParticipants)} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border bg-white border-black/10 text-black hover:bg-black/5 transition-all">
            <Users size={14} /> {participants.length}
          </button>
          {showParticipants && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-2xl p-3 z-[9999] animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[10px] uppercase tracking-widest text-black/50 font-bold mb-2 px-1">In Room</h3>
              <div className="max-h-60 overflow-y-auto custom-scrollbar"><ParticipantsList participantIds={participants} /></div>
            </div>
          )}
        </div>

        {!inCall && <button onClick={() => setInCall(true)} className="flex items-center gap-2 text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] px-3 py-1.5 rounded-lg transition-colors border border-[#2E7D32]/20"><VideoIcon size={14} /> <span className="hidden sm:inline">Join Video</span></button>}
        {isHost && <button onClick={handleTogglePrivacy} className="hidden sm:flex items-center gap-2 text-xs font-bold bg-black/5 text-black hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors">{isRoomPrivate ? <Globe size={14} /> : <Lock size={14} />} <span className="hidden sm:inline">{isRoomPrivate ? 'Make Public' : 'Make Private'}</span></button>}
        <button onClick={handleExitRoom} className="flex items-center gap-2 text-xs font-bold bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] px-4 py-1.5 rounded-lg transition-colors border border-[#C62828]/20"><LogOut size={14} /> <span className="hidden sm:inline">Leave</span></button>
      </div>
    </header>
  );
};