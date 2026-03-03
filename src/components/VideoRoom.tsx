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
import { AudioSettings } from '../components/AudioSettings'; 

interface Props {
  roomId: string;
  onLeave: () => void;
}

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "761bc537f2a84810af4a5a4363ccd7e6"; 

export const VideoRoom = ({ roomId, onLeave }: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const [audioConfig, setAudioConfig] = useState({
    ans: true,      
    aec: true,      
    musicMode: false 
  });

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn, {
    ANS: audioConfig.musicMode ? false : audioConfig.ans, 
    AEC: audioConfig.aec,
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
    // Contenedor Principal: Fondo blanco, borde sutil, sin sombras fuertes
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-black/10 relative shadow-sm font-sans">
      
      <AudioSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={audioConfig}
        onConfigChange={setAudioConfig}
      />

      {/* GRID DE VIDEOS */}
      <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto bg-black/[0.02]">
        
        {/* MI VIDEO (LOCAL) */}
        <div className="relative rounded-xl overflow-hidden bg-black/5 aspect-video border border-black/10 flex items-center justify-center">
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraOn={cameraOn}
            micOn={micOn}
            videoTrack={localCameraTrack}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-wider uppercase flex gap-2">
              <span>You {micOn ? '' : '(Muted)'}</span>
              {audioConfig.musicMode && <span className="text-purple-300">♫ Music</span>}
            </div>
          </LocalUser>
        </div>

        {/* USUARIOS REMOTOS */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative rounded-xl overflow-hidden bg-black/5 aspect-video border border-black/10 flex items-center justify-center">
            <RemoteUser user={user}>
               <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-wider uppercase">
                 User {user.uid}
               </div>
            </RemoteUser>
          </div>
        ))}

        {isConnected && remoteUsers.length === 0 && (
          <div className="flex items-center justify-center text-black/40 text-xs font-bold uppercase tracking-widest col-span-full h-32">
            Waiting for others to join...
          </div>
        )}
      </div>

      {/* BARRA DE CONTROLES (Limpia y Minimalista) */}
      <div className="h-20 bg-white border-t border-black/10 flex items-center justify-center gap-6 shrink-0">
        
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3.5 rounded-full bg-black/5 hover:bg-black/10 text-black/60 hover:text-black transition-colors"
          title="Audio Settings"
        >
          <Settings size={20} />
        </button>

        <div className="w-px h-8 bg-black/10 mx-2"></div>

        <button 
          onClick={() => setMicOn(prev => !prev)}
          className={`p-4 rounded-full transition-colors ${micOn ? 'bg-black text-[#F2E3D0] hover:bg-black/80' : 'bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border border-[#C62828]/20'}`}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        <button 
          onClick={() => setCameraOn(prev => !prev)}
          className={`p-4 rounded-full transition-colors ${cameraOn ? 'bg-black text-[#F2E3D0] hover:bg-black/80' : 'bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border border-[#C62828]/20'}`}
        >
          {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>

        <div className="w-px h-8 bg-black/10 mx-2"></div>

        <button 
          onClick={onLeave}
          className="px-6 py-3.5 rounded-full bg-[#FFEBEE] border border-[#C62828]/20 hover:bg-[#FFCDD2] text-[#C62828] text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <PhoneOff size={18} /> Leave
        </button>
      </div>
    </div>
  );
};