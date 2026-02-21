import { useState } from 'react';
import { 
  LocalUser, 
  RemoteUser, 
  useIsConnected, 
  useJoin, 
  useLocalMicrophoneTrack, 
  useLocalCameraTrack, 
  usePublish, 
  useRemoteUsers,
} from "agora-rtc-react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings } from 'lucide-react';
import { AudioSettings } from '../components/AudioSettings'; // Asegúrate que la ruta sea correcta

interface Props {
  roomId: string;
  onLeave: () => void;
}

// Usamos variable de entorno por seguridad
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "761bc537f2a84810af4a5a4363ccd7e6"; 

export const VideoRoom = ({ roomId, onLeave }: Props) => {
  // 1. Estado para el menú de configuración
  const [showSettings, setShowSettings] = useState(false);
  
  // 2. Estado para la configuración de audio (Valores por defecto)
  const [audioConfig, setAudioConfig] = useState({
    ans: true,      // Reducción de ruido activada por defecto
    aec: true,      // Anti-eco activado
    musicMode: false // Modo música desactivado (mejor para voz normal)
  });

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // 3. Hooks de Agora CON la configuración dinámica
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn, {
    // Si está en modo música, apagamos la reducción de ruido agresiva
    ANS: audioConfig.musicMode ? false : audioConfig.ans, 
    AEC: audioConfig.aec,
    // Si es modo música usamos alta calidad, si no, estándar para voz
    encoderConfig: audioConfig.musicMode ? "high_quality_stereo" : "speech_standard",
  });

  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();
  const isConnected = useIsConnected();

  useJoin({
    appid: AGORA_APP_ID,
    channel: roomId,
    token: null,
  }, true);

  usePublish([localMicrophoneTrack, localCameraTrack]);

  return (
    <div className="flex flex-col h-full bg-black/90 rounded-2xl overflow-hidden border border-slate-800 relative">
      
      {/* 4. Renderizar el menú de configuración si está abierto */}
      <AudioSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={audioConfig}
        onConfigChange={setAudioConfig}
      />

      {/* GRID DE VIDEOS */}
      <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
        
        {/* MI VIDEO (LOCAL) */}
        <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video shadow-lg border border-saylo-primary/50">
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraOn={cameraOn}
            micOn={micOn}
            videoTrack={localCameraTrack}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-bold flex gap-2">
              <span>Tú {micOn ? '' : '(Muted)'}</span>
              {/* Indicador visual si el modo música está activo */}
              {audioConfig.musicMode && <span className="text-purple-400">♫ Music</span>}
            </div>
          </LocalUser>
        </div>

        {/* USUARIOS REMOTOS */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video shadow-lg border border-slate-700">
            <RemoteUser user={user}>
               <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-bold">
                 Usuario {user.uid}
               </div>
            </RemoteUser>
          </div>
        ))}

        {isConnected && remoteUsers.length === 0 && (
          <div className="flex items-center justify-center text-slate-500 text-sm col-span-full h-32">
            Esperando a que otros se unan a la llamada...
          </div>
        )}
      </div>

      {/* BARRA DE CONTROLES */}
      <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 md:gap-6">
        
        {/* Botón de Configuración (NUEVO) */}
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          title="Configuración de Audio"
        >
          <Settings size={20} />
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2"></div>

        <button 
          onClick={() => setMicOn(prev => !prev)}
          className={`p-3 rounded-full transition-all ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button 
          onClick={() => setCameraOn(prev => !prev)}
          className={`p-3 rounded-full transition-all ${cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2"></div>

        <button 
          onClick={onLeave}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transform hover:scale-105 transition-all"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
};