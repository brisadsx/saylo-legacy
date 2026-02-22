import { useState, useEffect } from 'react';
import { searchPublicRooms, createNewRoom, joinRoomById, createPrivateRoom } from '../services/rooms';
import { getUserProfile, updateUserProfile } from '../services/users'; // Añadimos esto
import type { Room } from '../types/Room';
import { CommunityFeed } from './CommunityFeed';
import { Search, Plus, Globe, Lock, Users, ArrowRight, MessageCircle } from 'lucide-react';

interface LobbyProps {
  userId: string;
  onJoinRoom: (id: string) => void;
}

export const Lobby = ({ userId, onJoinRoom }: LobbyProps) => {
  const [activeTab, setActiveTab] = useState<'match' | 'private' | 'community'>('match');
  const [searchInput, setSearchInput] = useState('');
  const [roomsFound, setRoomsFound] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [joinPrivateId, setJoinPrivateId] = useState('');

  // --- ESTADOS DE FORCE NAMING ---
  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // --- COMPROBAR SI EL USUARIO TIENE NOMBRE ---
  useEffect(() => {
    const checkName = async () => {
      try {
        const profile = await getUserProfile(userId);
        // Si no tiene perfil o no tiene nombre, activamos el bloqueo
        if (!profile || !profile.displayName) {
          setNeedsName(true);
        }
      } catch (error) {
        console.error("Error al comprobar perfil:", error);
      }
    };
    checkName();
  }, [userId]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    setIsSavingName(true);
    try {
      await updateUserProfile(userId, { displayName: tempName.trim() });
      setNeedsName(false); // Desbloqueamos la app
    } catch (error) {
      console.error("Error guardando nombre:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  // --- LÓGICA DE BÚSQUEDA ---
  useEffect(() => {
    // Si necesita nombre, no buscamos salas aún
    if (activeTab !== 'match' || needsName) return; 

    const doSearch = async () => {
      setLoading(true);
      try {
        const results = await searchPublicRooms(searchInput);
        setRoomsFound(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(doSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, activeTab, needsName]);

  const handleCreatePublic = async () => {
    if (!searchInput.trim()) return alert("Escribe un tema primero");
    setIsCreating(true);
    try {
      const roomId = await createNewRoom(userId, searchInput);
      onJoinRoom(roomId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinExisting = async (roomId: string) => {
    setLoading(true);
    try {
      const success = await joinRoomById(roomId, userId);
      if (success) onJoinRoom(roomId);
    } catch (error) {
      console.error(error);
      alert("Error al entrar"); 
    } 
    finally { setLoading(false); }
  };

  const handleCreatePrivate = async () => {
    setLoading(true);
    try {
      const roomId = await createPrivateRoom(userId);
      onJoinRoom(roomId);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleJoinPrivate = async () => {
    if (!joinPrivateId) return;
    setLoading(true);
    try {
      const success = await joinRoomById(joinPrivateId, userId);
      if (success) onJoinRoom(joinPrivateId);
      else alert("Sala no encontrada");
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- RENDER VISUAL ---
  return (
    <div className="w-full max-w-2xl mx-auto relative">
      
      {/* PANTALLA DE FORCE NAMING (Bloqueo absoluto) */}
      {needsName && (
        <div className="absolute inset-0 z-50 bg-saylo-bg/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 border border-slate-800">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">¿Cómo te llamas?</h2>
          <p className="text-slate-400 mb-8 max-w-xs text-sm">
            Para unirte a la comunidad Saylo, necesitamos saber cómo decirte.
          </p>
          
          <form onSubmit={handleSaveName} className="w-full max-w-sm flex flex-col gap-4">
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Tu nombre o apodo"
              className="w-full bg-black/50 text-white px-6 py-4 rounded-2xl border border-slate-700 text-center text-xl focus:outline-none focus:border-saylo-primary focus:ring-1 focus:ring-saylo-primary transition-all shadow-inner"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!tempName.trim() || isSavingName}
              className="w-full bg-saylo-primary hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingName ? 'Guardando...' : 'Comenzar'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* CONTENIDO NORMAL DEL LOBBY (Queda debajo del bloqueo si needsName es true) */}
      <div className={`bg-saylo-card border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${needsName ? 'opacity-30 blur-sm pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
        
        {/* HEADER DE PESTAÑAS */}
        <div className="flex border-b border-slate-800 bg-black/20">
          <button 
            onClick={() => setActiveTab('match')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'match' ? 'bg-saylo-card text-saylo-primary border-b-2 border-saylo-primary' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <Globe size={16} /> Explorar
          </button>
          <button 
            onClick={() => setActiveTab('private')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'private' ? 'bg-saylo-card text-saylo-accent border-b-2 border-saylo-accent' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <Lock size={16} /> Privado
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'community' ? 'bg-saylo-card text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <MessageCircle size={16} /> Comunidad
          </button>
        </div>

        <div className="p-6 min-h-[400px]">
          
          {/* === PESTAÑA 1: EXPLORAR === */}
          {activeTab === 'match' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Salas de Estudio</h2>
                <p className="text-slate-400">Únete a otros o crea un tema nuevo.</p>
              </div>

              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ej: Salmos, Mateo, Ansiedad..." 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-saylo-primary focus:ring-1 focus:ring-saylo-primary transition-all"
                  />
                </div>
                <button 
                  onClick={handleCreatePublic} 
                  disabled={isCreating || loading}
                  className="bg-saylo-primary hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Crear
                </button>
              </div>

              <div className="space-y-3">
                {loading && <div className="text-center py-10 text-slate-500 animate-pulse">Buscando salas...</div>}
                
                {!loading && roomsFound.length === 0 && searchInput && (
                   <div className="text-center py-8 text-slate-500">
                      <p>No hay salas sobre "{searchInput}".</p>
                      <p className="text-sm mt-2">¡Dale al botón Crear!</p>
                   </div>
                )}

                {!loading && roomsFound.map(room => (
                  <div key={room.id} className="group flex justify-between items-center bg-black/20 hover:bg-slate-800/50 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-saylo-primary font-bold">#</span>
                        <strong className="text-lg text-white group-hover:text-saylo-primary transition-colors">{room.topicId}</strong>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Users size={12} /> {room.participants.length} estudiando
                      </div>
                    </div>
                    <button 
                      onClick={() => handleJoinExisting(room.id)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-saylo-primary text-slate-300 hover:text-white text-sm font-medium transition-colors"
                    >
                      Unirse
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === PESTAÑA 2: PRIVADO === */}
          {activeTab === 'private' && (
            <div className="flex flex-col items-center justify-center h-full py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-saylo-accent/10 text-saylo-accent rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sala Privada</h2>
              <p className="text-slate-400 text-center max-w-xs mb-8">
                Espacio exclusivo con invitación. Ideal para grupos cerrados.
              </p>
              
              <button 
                onClick={handleCreatePrivate} 
                disabled={loading} 
                className="w-full max-w-xs bg-saylo-accent hover:bg-rose-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-900/20 transition-all mb-8 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Crear Sala Privada
              </button>
              
              <div className="w-full max-w-xs border-t border-slate-700 pt-6">
                <p className="text-sm text-slate-500 mb-3 text-center">O ingresa con un código</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="ID de Sala..." 
                    value={joinPrivateId}
                    onChange={(e) => setJoinPrivateId(e.target.value)}
                    className="flex-1 px-4 py-2 bg-black/30 border border-slate-700 rounded-lg text-white focus:border-saylo-accent focus:outline-none text-sm"
                  />
                  <button 
                    onClick={handleJoinPrivate} 
                    disabled={!joinPrivateId}
                    className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === PESTAÑA 3: COMUNIDAD === */}
          {activeTab === 'community' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <CommunityFeed userId={userId} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};