import { useState, useEffect } from 'react';

// firebase
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './services/firebase'; 
import { logout } from './services/auth';
import { subscribeToRoom, updateTimerState, joinRoomById, toggleRoomPrivacy, endRoom } from './services/rooms';

// agora
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

// componentes
import { VideoRoom } from './components/VideoRoom';
import { BibleReader } from './components/BibleReader';
import { Login } from './components/Login';
import { Lobby } from './components/Lobby';
import { ChatRoom } from './components/ChatRoom';
import { ParticipantsList } from './components/ParticipantsList';
import { ProfileEditor } from './components/ProfileEditor';
import { FeedbackWidget } from './components/FeedbackWidget';

// hooks y utilidades
import { usePomodoro } from './hooks/usePomodoro';
import { Video as VideoIcon, LogOut, User as UserIcon, Lock, Globe, Clock, Pause, Play, RotateCcw, Loader2, Users } from 'lucide-react';

const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// ==========================================
// TUS FONDOS DE PANTALLA ROTATIVOS
// Puedes reemplazar estos links por los de tus propias fotos
// ==========================================
const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop', // Playa / Relax
  'https://images.unsplash.com/photo-1444464666168-49b626f8a1b1?q=80&w=2069&auto=format&fit=crop', // Bosque / Lofi
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop', // Montañas / Noche
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  
  const [isHost, setIsHost] = useState(false);
  const [isRoomPrivate, setIsRoomPrivate] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentReading, setCurrentReading] = useState<{ reference: string, text: string } | undefined>(undefined);

  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false); 

  // Estados para el fondo y menú de participantes
  const [bgIndex, setBgIndex] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);

  // Rotador de Fondos (Cambia cada 60 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 60000); // 60000 ms = 1 minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const syncRoomFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const roomIdFromUrl = params.get('room');
      if (roomIdFromUrl && roomIdFromUrl !== currentRoomId) {
        setCurrentRoomId(roomIdFromUrl);
      } else if (!roomIdFromUrl && currentRoomId) {
        setCurrentRoomId(null);
      }
    };
    syncRoomFromUrl();
    window.addEventListener('popstate', syncRoomFromUrl);
    return () => window.removeEventListener('popstate', syncRoomFromUrl);
  }, [user, currentRoomId]);

  useEffect(() => {
    if (user && currentRoomId) {
      joinRoomById(currentRoomId, user.uid).catch((err) => console.error("Error join:", err));
    }
  }, [currentRoomId, user]);

  const updateUrl = (roomId: string | null) => {
    const newUrl = roomId ? `${window.location.pathname}?room=${roomId}` : window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const { 
    timeLeft, isRunning, mode, 
    toggleTimer, resetTimer, changeMode,
    setTimeLeft, setIsRunning, setMode 
  } = usePomodoro();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (!currentRoomId || !user) return;
    const unsubscribe = subscribeToRoom(currentRoomId, (roomData) => {
      if (!roomData) {
        if (!isHost) alert("The host has ended this session.");
        setInCall(false);
        setCurrentRoomId(null);
        window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
        return;
      }
      const amIHost = roomData.hostId === user.uid;
      setIsHost(amIHost);
      setIsRoomPrivate(roomData.isPrivate || false);
      setParticipants(roomData.participants || []);
      setCurrentReading(roomData.currentReading); 

      if (!amIHost && roomData.timer) {
        setTimeLeft(roomData.timer.timeLeft);
        setIsRunning(roomData.timer.isRunning);
        setMode(roomData.timer.mode);
      }
    });
    return () => unsubscribe();
  }, [currentRoomId, user, setTimeLeft, setIsRunning, setMode, isHost]); 

  useEffect(() => {
    if (isHost && currentRoomId) {
      const timeout = setTimeout(() => {
        updateTimerState(currentRoomId, { timeLeft, isRunning, mode }).catch(console.error);
      }, 1000); 
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, isRunning, mode, isHost, currentRoomId]);

  const handleEnterRoom = (id: string) => {
    setCurrentRoomId(id);
    updateUrl(id);
  };

  const handleExitRoom = async () => {
    if (isHost && currentRoomId) {
      const confirmClose = window.confirm("You are the host. Do you want to close and delete this room for everyone?");
      if (confirmClose) {
        await endRoom(currentRoomId);
      }
    }
    setInCall(false); 
    setCurrentRoomId(null);
    updateUrl(null);
  };

  const handleTogglePrivacy = async () => {
    if (!currentRoomId || !isHost) return;
    await toggleRoomPrivacy(currentRoomId, !isRoomPrivate);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-[#F2E3D0]">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );

  if (!user) return <Login />;

  // ==========================================
  // VISTA 1: LOBBY
  // ==========================================
  if (!currentRoomId) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center transition-all duration-1000 ease-in-out relative"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
      >
        {/* Overlay oscuro para que se lea la UI */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <div className="relative z-10">
            <div className="fixed top-8 right-8 z-[60] flex items-center gap-4">
              <button onClick={() => setViewingProfileId(user.uid)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F2E3D0] flex items-center justify-center hover:bg-white/20 transition-all shadow-md">
                <UserIcon className="w-5 h-5" />
              </button>
              <button onClick={logout} className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all shadow-sm">
                <LogOut className="w-5 h-5 translate-x-0.5" />
              </button>
            </div>

            <div className="fixed bottom-8 right-8 z-[60] [&>button]:w-12 [&>button]:h-12 [&>button]:rounded-full [&>button]:bg-white/10 [&>button]:backdrop-blur-md [&>button]:border [&>button]:border-white/20 [&>button]:text-[#F2E3D0] [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:hover:bg-white/20 [&>button]:transition-all [&>button]:shadow-sm">
              <FeedbackWidget userId={user.uid} />
            </div>

            {viewingProfileId && (
                <ProfileEditor currentUserId={user.uid} targetUserId={viewingProfileId} onClose={() => setViewingProfileId(null)} onOpenProfile={(id: string) => setViewingProfileId(id)} />
            )}
            
            <Lobby userId={user.uid} onJoinRoom={handleEnterRoom} onOpenProfile={(id: string) => setViewingProfileId(id)} />
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: DENTRO DE LA SALA (ROOM) - GLASSMORPHISM
  // ==========================================
  return (
    <div 
      className="h-screen flex flex-col font-sans overflow-hidden bg-cover bg-center transition-all duration-1000 relative"
      style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
    >
      {/* Capa oscura para no perder contraste con el texto */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* CONTENIDO PRINCIPAL SOBRE EL FONDO */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* 1. TOP BAR (Glassmorphism) */}
        <header className="h-16 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F2E3D0]/60 bg-white/5 px-2 py-1 rounded">
              {isRoomPrivate ? 'Private' : 'Public'}
            </span>
            <div className="flex items-center gap-2 text-[#F2E3D0]">
              <span className="text-sm font-black tracking-widest uppercase">
                <span className="text-[#F2E3D0]/30 mr-1">#</span>{currentRoomId}
              </span>
              <span className="bg-[#F2E3D0] text-black px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider hidden sm:inline-block ml-2">
                {isHost ? 'Host' : 'Guest'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* BOTÓN DESPLEGABLE DE PARTICIPANTES (MINI) */}
            <div className="relative">
              <button 
                onClick={() => setShowParticipants(!showParticipants)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${showParticipants ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
              >
                <Users size={14} /> {participants.length}
              </button>
              
              {/* Panel Flotante de Participantes */}
              {showParticipants && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2 px-1">In Room</h3>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                     <ParticipantsList participantIds={participants} />
                  </div>
                </div>
              )}
            </div>

            {!inCall && (
              <button onClick={() => setInCall(true)} className="flex items-center gap-2 text-xs font-bold bg-[#E8F5E9]/20 text-[#81C784] hover:bg-[#E8F5E9]/30 px-3 py-1.5 rounded-lg transition-colors border border-[#81C784]/30 backdrop-blur-sm">
                <VideoIcon size={14} /> <span className="hidden sm:inline">Join Video</span>
              </button>
            )}

            {isHost && (
              <button onClick={handleTogglePrivacy} className="hidden sm:flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                {isRoomPrivate ? <Globe size={14} /> : <Lock size={14} />}
                <span className="hidden sm:inline">{isRoomPrivate ? 'Make Public' : 'Make Private'}</span>
              </button>
            )}
            
            <button onClick={handleExitRoom} className="flex items-center gap-2 text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 px-4 py-1.5 rounded-lg transition-colors border border-red-500/30 backdrop-blur-sm">
              <LogOut size={14} /> <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </header>

        {/* 2. GRID PRINCIPAL INVERTIDO */}
        {/* Ahora la columna izquierda es más pequeña (4) y la derecha más grande (8) */}
        <main className="flex-1 p-4 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4rem)] max-w-[1800px] mx-auto overflow-hidden">
          
          {/* COLUMNA IZQUIERDA (Chica): TIMER Y BIBLIA */}
          <div className="lg:col-span-3 flex flex-col gap-4 h-full max-h-full overflow-hidden shrink-0">
            
            {/* TIMER WIDGET (Glassmorphism) */}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center shrink-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <Clock size={12} className="text-[#F2E3D0]/50" />
                 <h2 className="text-[10px] uppercase tracking-widest text-[#F2E3D0]/60 font-black">
                   {mode === 'focus' ? 'Focus Mode' : 'Break Time'}
                 </h2>
              </div>

              <div className="text-5xl font-mono font-black text-white tracking-tighter my-2 drop-shadow-md">
                {formatTime(timeLeft)}
              </div>

              {isHost ? (
                <div className="flex flex-col w-full gap-2 mt-1">
                   <div className="flex items-center gap-2 w-full">
                      <button onClick={toggleTimer} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isRunning ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-[#F2E3D0] text-black hover:bg-white'}`}>
                        {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />} {isRunning ? 'Pause' : 'Start'}
                      </button>
                      <button onClick={resetTimer} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white transition-colors"><RotateCcw size={16} /></button>
                   </div>
                   
                   <div className="flex bg-white/5 rounded-lg p-1 w-full border border-white/5">
                      {['focus', 'shortBreak', 'longBreak'].map(m => (
                        <button key={m} onClick={() => changeMode(m as 'focus' | 'shortBreak' | 'longBreak')} className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === m ? 'bg-white/20 shadow-sm text-white' : 'text-white/40 hover:text-white'}`}>
                          {m === 'shortBreak' ? 'Short' : m === 'longBreak' ? 'Long' : 'Focus'}
                        </button>
                      ))}
                   </div>
                </div>
              ) : (
                <p className="text-[#F2E3D0]/50 text-[9px] font-bold uppercase tracking-widest animate-pulse flex justify-center items-center gap-2 mt-2">
                  <span className="w-1.5 h-1.5 bg-[#F2E3D0] rounded-full"></span> Synchronized
                </p>
              )}
            </div>

            {/* BIBLE READER WIDGET (Más chico, Glassmorphism) */}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
               {/* IMPORTANTE: Tu componente BibleReader internamente puede tener colores blancos. 
                   Si se ve raro aquí, tendrás que adaptar BibleReader.tsx para que use fondos transparentes. */}
               <BibleReader roomId={currentRoomId} isHost={isHost} readingData={currentReading} />
            </div>

          </div>

          {/* COLUMNA DERECHA (Grande): CHAT Y VIDEOCALL */}
          <div className="lg:col-span-9 flex flex-col h-full max-h-full overflow-hidden">
            <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden relative flex flex-col shadow-2xl">
               <AgoraRTCProvider client={agoraClient}>
                  {inCall ? (
                     <VideoRoom roomId={currentRoomId} onLeave={() => setInCall(false)} />
                  ) : (
                     <ChatRoom roomId={currentRoomId} userId={user.uid} userName={user.displayName || 'User'} />
                  )}
               </AgoraRTCProvider>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;