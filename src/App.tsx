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
import { Video as VideoIcon, LogOut, User as UserIcon, Lock, Globe, Clock, Pause, Play, RotateCcw, Loader2 } from 'lucide-react';

const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

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
        if (!isHost) alert("El anfitrión ha finalizado esta sesión.");
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
      const confirmClose = window.confirm("Eres el anfitrión. ¿Deseas cerrar y eliminar la sala para todos?");
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
    <div className="min-h-screen flex items-center justify-center bg-saylo-bg text-saylo-muted">
      <Loader2 className="animate-spin text-saylo-primary" size={48} />
    </div>
  );

  if (!user) return <Login />;

  if (!currentRoomId) {
    return (
      <>
        {/* BOTONES SUPERIORES DERECHOS (Perfil y Salir) */}
        <div className="fixed top-8 right-8 z-[60] flex items-center gap-4">
          
          {/* Botón de Perfil */}
          <button 
            onClick={() => setViewingProfileId(user.uid)}
            className="w-12 h-12 rounded-full bg-saylo-cream text-saylo-black flex items-center justify-center hover:brightness-95 transition-all shadow-md"
          >
            <UserIcon className="w-5 h-5" />
          </button>

          {/* Botón de Salir (AQUÍ USAMOS LOGOUT PARA ARREGLAR EL ERROR) */}
          <button 
            onClick={logout}
            className="w-12 h-12 rounded-full bg-saylo-cream text-saylo-black flex items-center justify-center hover:brightness-95 transition-all shadow-md"
          >
            <LogOut className="w-5 h-5 translate-x-0.5" />
          </button>
        </div>

        <div className="fixed bottom-8 right-8 z-[60] [&>button]:w-12 [&>button]:h-12 [&>button]:rounded-full [&>button]:bg-saylo-cream [&>button]:text-saylo-black [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:hover:brightness-95 [&>button]:transition-all [&>button]:shadow-lg [&>button]:border-none">
           <FeedbackWidget userId={user.uid} />
        </div>

        {/* MODAL DE PERFIL */}
          {viewingProfileId && (
                      <ProfileEditor 
                        currentUserId={user.uid} 
                        targetUserId={viewingProfileId} 
                        onClose={() => setViewingProfileId(null)} 
                        onOpenProfile={(id) => setViewingProfileId(id)} 
                      />
                  )}
        
        {/* EL LOBBY */}
        <Lobby userId={user.uid} onJoinRoom={handleEnterRoom} onOpenProfile={(id) => setViewingProfileId(id)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-saylo-bg text-saylo-text flex flex-col font-sans">
      
      <header className="h-16 border-b border-slate-800 bg-saylo-bg/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 lg:px-8 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-saylo-muted uppercase mb-1">
            <span className={`w-2 h-2 rounded-full shadow-lg ${isRoomPrivate ? 'bg-saylo-accent shadow-red-500/50' : 'bg-saylo-secondary shadow-green-500/50'}`}></span>
            {isRoomPrivate ? 'Privada' : 'Pública'}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-saylo-primary">#</span>{currentRoomId}
            </h1>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${isHost ? 'border-saylo-primary text-saylo-primary bg-saylo-primary/10' : 'border-slate-600 text-slate-400'}`}>
              {isHost ? 'Anfitrión' : 'Invitado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!inCall && (
            <button 
              onClick={() => setInCall(true)}
              className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/20 transition-all animate-in fade-in"
            >
              <VideoIcon size={14} /> <span className="hidden sm:inline">Unirse a Sala</span>
            </button>
          )}

          {isHost && (
            <button 
              onClick={handleTogglePrivacy}
              className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              {isRoomPrivate ? <Globe size={14} /> : <Lock size={14} />}
              {isRoomPrivate ? 'Hacer Pública' : 'Hacer Privada'}
            </button>
          )}
          
          <button 
            onClick={handleExitRoom} 
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-105"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-64px)]">
        
        <div className="lg:col-span-8 flex flex-col h-full max-h-full overflow-hidden">
           <div className="bg-saylo-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex-1 flex flex-col relative h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-saylo-primary opacity-50"></div>
              <div className="p-1 h-full overflow-hidden">
                <BibleReader roomId={currentRoomId} isHost={isHost} readingData={currentReading} />
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 h-full max-h-full overflow-hidden">
          
          <div className="bg-saylo-card p-6 rounded-2xl border border-slate-800 shadow-xl text-center relative overflow-hidden shrink-0">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saylo-primary to-purple-500 transition-opacity duration-500 ${isRunning ? 'opacity-100' : 'opacity-30'}`}></div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
               <Clock size={14} className="text-saylo-muted" />
               <h2 className="text-xs uppercase tracking-[0.2em] text-saylo-muted font-semibold">
                 {mode === 'focus' ? 'Modo Enfoque' : 'Descanso'}
               </h2>
            </div>

            <div className="text-6xl lg:text-7xl font-mono font-bold text-white mb-6 tabular-nums tracking-tighter drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>

            {isHost ? (
              <div className="flex flex-col gap-3">
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={toggleTimer} 
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-saylo-primary text-white hover:bg-indigo-500'}`}
                    >
                      {isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      {isRunning ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button onClick={resetTimer} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">
                      <RotateCcw size={16} /> Reset
                    </button>
                 </div>
                 
                 <div className="flex justify-center gap-1 p-1 bg-black/20 rounded-full w-fit mx-auto">
                    {['focus', 'shortBreak', 'longBreak'].map(m => (
                      <button 
                        key={m}
                        onClick={() => changeMode(m as 'focus' | 'shortBreak' | 'longBreak')}
                        className={`text-[10px] px-3 py-1 rounded-full uppercase tracking-wide transition-all ${mode === m ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {m === 'shortBreak' ? 'Corto' : m === 'longBreak' ? 'Largo' : 'Focus'}
                      </button>
                    ))}
                 </div>
              </div>
            ) : (
              <p className="text-saylo-muted italic text-sm animate-pulse flex justify-center items-center gap-2">
                <span className="w-2 h-2 bg-saylo-primary rounded-full"></span> Sincronizado
              </p>
            )}
          </div>

          <ParticipantsList participantIds={participants} />

          <div className="flex-1 min-h-0 bg-saylo-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl relative flex flex-col">
             <AgoraRTCProvider client={agoraClient}>
                {inCall ? (
                   <VideoRoom roomId={currentRoomId} onLeave={() => setInCall(false)} />
                ) : (
                   <ChatRoom roomId={currentRoomId} userId={user.uid} userName={user.displayName || 'Usuario'} />
                )}
             </AgoraRTCProvider>
          </div>

        </div>
      </main>

      <FeedbackWidget userId={user.uid} />
    </div>
  );
}

export default App;