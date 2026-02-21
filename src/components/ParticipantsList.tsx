import { useState, useEffect } from 'react';
import { getUsersByIds } from '../services/users';
import type { UserProfile } from '../types/User';

interface Props {
  participantIds: string[];
}

export const ParticipantsList = ({ participantIds }: Props) => {
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      
      if (!participantIds || participantIds.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const users = await getUsersByIds(participantIds);
        setParticipants(users);
      } catch (error) {
        console.error("Error obteniendo participantes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [participantIds]);

  // Skeleton loader (animación de carga)
  if (loading && participants.length === 0) {
    return <div className="h-12 w-full animate-pulse bg-slate-800/50 rounded-xl"></div>;
  }

  return (
    <div className="bg-saylo-card border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 text-center">
        En la sala ({participants.length})
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3">
        {participants.map((user) => (
          <div key={user.uid} className="group relative flex flex-col items-center">
            
            {/* Avatar con Anillo de Estado */}
            <div className="relative">
              
              {/* Contenedor circular de la foto */}
              <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-saylo-secondary flex items-center justify-center text-xl shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-110 cursor-help overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "Usuario"} 
                    className="w-full h-full object-cover" 
                  />
                ) : null}
              </div>
              
              {/* Puntito verde extra */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-saylo-secondary border-2 border-saylo-card rounded-full"></div>
            </div>
            
            {/* Tooltip de Nombre */}
            <div className="absolute -bottom-8 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {user.displayName || "Usuario anónimo"}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};