import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// firebase & agora
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './services/firebase'; 
import { logout } from './services/auth'; 
import { subscribeToRoom, updateTimerState, joinRoomById, toggleRoomPrivacy, endRoom } from './services/rooms';
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

// componentes
import { VideoRoom } from './components/VideoRoom';
import { BibleReader } from './components/BibleReader';
import { Login } from './components/Login';
import { Lobby } from './components/Lobby';
import { ChatRoom } from './components/ChatRoom';
import { ProfileEditor } from './components/ProfileEditor';
import { FeedbackWidget } from './components/FeedbackWidget'; 
import { Intro } from './components/Intro';
import { RoomHeader } from './components/RoomHeader';
import { TimerWidget } from './components/TimerWidget';

// hooks y utilidades
import { usePomodoro } from './hooks/usePomodoro';
import { Loader2, LogOut, User as UserIcon } from 'lucide-react'; 

const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const DEFAULT_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  
  // ESTE ES EL ESTADO QUE CONTROLA LA INTRO 3D
  const [hasPassedIntro, setHasPassedIntro] = useState(false);
  
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  
  // Estados de la Sala
  const [isHost, setIsHost] = useState(false);
  const [isRoomPrivate, setIsRoomPrivate] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentReading, setCurrentReading] = useState<{ reference: string, text: string } | undefined>(undefined);
  const [inCall, setInCall] = useState(false); 
  const [bgUrl, setBgUrl] = useState(DEFAULT_BG);

  const { timeLeft, isRunning, mode, toggleTimer, resetTimer, changeMode, setTimeLeft, setIsRunning, setMode } = usePomodoro();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => { setUser(currentUser); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const syncRoomFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const roomIdFromUrl = params.get('room');
      if (roomIdFromUrl && roomIdFromUrl !== currentRoomId) setCurrentRoomId(roomIdFromUrl);
      else if (!roomIdFromUrl && currentRoomId) setCurrentRoomId(null);
    };
    syncRoomFromUrl();
    window.addEventListener('popstate', syncRoomFromUrl);
    return () => window.removeEventListener('popstate', syncRoomFromUrl);
  }, [user, currentRoomId]);

  useEffect(() => {
    if (user && currentRoomId) joinRoomById(currentRoomId, user.uid).catch(console.error);
  }, [currentRoomId, user]);

  useEffect(() => {
    if (!currentRoomId || !user) return;
    const unsubscribe = subscribeToRoom(currentRoomId, (roomData) => {
      if (!roomData) {
        if (!isHost) alert("The host has ended this session.");
        setInCall(false);
        setCurrentRoomId(null);
        window.history.pushState({ path: '/' }, '', '/');
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
      const timeout = setTimeout(() => updateTimerState(currentRoomId, { timeLeft, isRunning, mode }).catch(console.error), 1000); 
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, isRunning, mode, isHost, currentRoomId]);

  const handleExitRoom = async () => {
    if (isHost && currentRoomId) {
      const confirmClose = window.confirm("You are the host. Do you want to close and delete this room for everyone?");
      if (confirmClose) {
        await endRoom(currentRoomId);
      }
    }
    setInCall(false); 
    setCurrentRoomId(null);
    window.history.pushState({ path: '/' }, '', '/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#E5ECEF] text-black"><Loader2 className="animate-spin" size={48} /></div>;
  
  // ==========================================
  // FLUJO DE NAVEGACIÓN (El Director de Orquesta)
  // ==========================================

  // 1. INTRODUCCIÓN 3D (Si no ha pasado, muestra la Intro)
  if (!hasPassedIntro) return <Intro onFinish={() => setHasPassedIntro(true)} />;
  
  // 2. LOGIN (Si pasó la intro pero no está logueada)
  if (!user) return <Login />;

  // 3. LOBBY (Si está logueada y no está en una sala)
  if (!currentRoomId) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed top-8 right-8 z-[60] flex items-center gap-4">
          <button onClick={() => setViewingProfileId(user.uid)} className="w-12 h-12 rounded-full bg-[#F2E3D0] text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg" title="Profile">
            <UserIcon className="w-5 h-5" />
          </button>
          <button onClick={logout} className="w-12 h-12 rounded-full bg-[#F2E3D0] text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg" title="Log Out">
            <LogOut className="w-5 h-5 translate-x-0.5" />
          </button>
        </div>

        <div className="fixed bottom-8 right-8 z-[60] [&>button]:w-12 [&>button]:h-12 [&>button]:rounded-full [&>button]:bg-[#F2E3D0] [&>button]:text-black [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:hover:scale-105 [&>button]:transition-all [&>button]:shadow-lg">
          <FeedbackWidget userId={user.uid} />
        </div>

        {viewingProfileId && (
          <ProfileEditor currentUserId={user.uid} targetUserId={viewingProfileId} onClose={() => setViewingProfileId(null)} onOpenProfile={setViewingProfileId} />
        )}
        
        <Lobby userId={user.uid} onJoinRoom={(id) => { setCurrentRoomId(id); window.history.pushState({ path: `/?room=${id}` }, '', `/?room=${id}`); }} onOpenProfile={setViewingProfileId} />
      </div>
    );
  }

  // 4. DENTRO DE LA SALA (ROOM)
  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-cover bg-center transition-all duration-700 relative" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex flex-col h-full">
        <RoomHeader 
          currentRoomId={currentRoomId} isRoomPrivate={isRoomPrivate} isHost={isHost} participants={participants} inCall={inCall}
          setInCall={setInCall} setBgUrl={setBgUrl} defaultBg={DEFAULT_BG} 
          handleExitRoom={handleExitRoom}
          handleTogglePrivacy={() => toggleRoomPrivacy(currentRoomId, !isRoomPrivate)}
        />

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1 p-4 w-full h-[calc(100vh-4rem)] max-w-[1600px] mx-auto flex flex-col gap-4 overflow-hidden">
          
          <TimerWidget 
            timeLeft={timeLeft} mode={mode} isHost={isHost} isRunning={isRunning} 
            toggleTimer={toggleTimer} resetTimer={resetTimer} setTimeLeft={setTimeLeft} changeMode={changeMode}
          />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            <div className="lg:col-span-5 flex flex-col h-full bg-[#F2E3D0] rounded-2xl shadow-xl border border-black/5 overflow-hidden">
               <BibleReader roomId={currentRoomId} isHost={isHost} readingData={currentReading} />
            </div>

            <div className="lg:col-span-7 flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
               <AgoraRTCProvider client={agoraClient}>
                  {inCall ? <VideoRoom roomId={currentRoomId} onLeave={() => setInCall(false)} /> : <ChatRoom roomId={currentRoomId} userId={user.uid} userName={user.displayName || 'User'} />}
               </AgoraRTCProvider>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

export default App;