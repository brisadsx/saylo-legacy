import { useState, useEffect } from 'react';
import { searchPublicRooms, createNewRoom, joinRoomById, createPrivateRoom } from '../services/rooms';
import { getUserProfile, updateUserProfile } from '../services/users';
import type { Room } from '../types/Room';
import { CommunityFeed } from './CommunityFeed';
import { Search, Plus, Lock, Users, ArrowRight, LogOut } from 'lucide-react';

interface LobbyProps {
  userId: string;
  onJoinRoom: (id: string) => void;
}

export const Lobby = ({ userId, onJoinRoom }: LobbyProps) => {
  // === cerebro ===
  const [activeTab, setActiveTab] = useState<'explore' | 'private' | 'community'>('explore');
  const [searchInput, setSearchInput] = useState('');
  const [roomsFound, setRoomsFound] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [joinPrivateId, setJoinPrivateId] = useState('');

  // estados para forzar naming
  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const checkName = async () => {
      try {
        const profile = await getUserProfile(userId);
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
      setNeedsName(false);
    } catch (error) {
      console.error("Error guardando nombre:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  useEffect(() => {
    
    if (activeTab !== 'explore' || needsName || !searchInput.trim()) {
        setRoomsFound([]);
        return;
    }

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
    } finally { 
      setLoading(false); 
    }
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

  return (
    <div className="min-h-screen w-full bg-[url('/bg-lobby.jpg.jpg')] bg-cover bg-center bg-no-repeat fixed top-0 left-0 flex items-center justify-center font-sans">
      
      {/* boton salir */}
      <button 
        onClick={() => {  }}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-saylo-cream text-saylo-black flex items-center justify-center hover:brightness-95 transition-all shadow-md z-40"
      >
        <LogOut className="w-5 h-5 translate-x-0.5" />
      </button>

      {/* force naming */}
      {needsName && (
        <div className="absolute inset-0 z-50 bg-saylo-cream/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <h2 className="text-4xl font-light text-saylo-black mb-2 tracking-tight">What's your name?</h2>
          <p className="text-saylo-gray mb-8 max-w-xs text-sm font-medium">
            To join the Saylo community, we need to know how to address you.
          </p>
          
          <form onSubmit={handleSaveName} className="w-full max-w-sm flex flex-col gap-4">
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your name or nickname"
              className="w-full bg-white text-saylo-black px-6 py-4 rounded-full border-2 border-saylo-blue text-center text-xl focus:outline-none focus:border-saylo-black transition-all shadow-sm"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!tempName.trim() || isSavingName}
              className="w-full bg-saylo-blue hover:brightness-95 text-saylo-black font-medium py-4 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isSavingName ? 'Looking...' : 'Begin'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* panel central */}
      <div className={`bg-saylo-blue w-full max-w-[500px] rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 relative transition-all duration-500 ${needsName ? 'opacity-30 blur-sm pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
        
        {/* (Tabs) */}
        <div className="flex justify-center gap-2 -mt-12 z-10">
          {['Explore', 'Private', 'Community'].map((tab) => {
            const tabKey = tab.toLowerCase() as 'explore' | 'private' | 'community';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tabKey 
                    ? 'bg-saylo-gray text-white shadow-md' 
                    : 'bg-black/20 text-saylo-black hover:bg-black/30'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Títulos */}
        <div className="text-center mt-2">
          {activeTab === 'explore' && (
            <>
              <h2 className="text-2xl font-normal text-saylo-black tracking-tight">Active rooms</h2>
              <p className="text-saylo-black/70 text-xs tracking-wide mt-1">Join others or create a new room</p>
            </>
          )}
          {activeTab === 'private' && (
            <>
              <h2 className="text-2xl font-normal text-saylo-black tracking-tight">Private rooms</h2>
              <p className="text-saylo-black/70 text-xs tracking-wide mt-1">Secure spaces for closed groups</p>
            </>
          )}
          {activeTab === 'community' && (
            <>
              <h2 className="text-2xl font-normal text-saylo-black tracking-tight">Community Feed</h2>
              <p className="text-saylo-black/70 text-xs tracking-wide mt-1">See what others are doing</p>
            </>
          )}
        </div>

        {/* explorar:contenido */}
        {activeTab === 'explore' && (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
            {/* buscador y boton crear */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-saylo-cream rounded-full flex items-center px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-saylo-gray transition-all">
                <Search className="text-saylo-gray w-4 h-4 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search topic..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm text-saylo-black placeholder:text-saylo-gray/70 font-medium"
                />
              </div>
              <button 
                onClick={handleCreatePublic} 
                disabled={isCreating || loading}
                className="bg-saylo-cream text-saylo-black px-5 h-12 rounded-full flex items-center gap-2 text-sm font-medium hover:brightness-95 transition-all shadow-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {/* Lista de Salas */}
            <div className="h-[250px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
              {loading && <div className="text-center py-10 text-saylo-black/50 text-sm animate-pulse">Searching for rooms...</div>}
              
              {/* Estado cuando no se ha buscado nada */}
              {!loading && !searchInput && roomsFound.length === 0 && (
                 <div className="text-center py-8 text-saylo-black/60 text-sm font-medium flex flex-col items-center">
                    <Search className="w-8 h-8 mb-2 opacity-50" />
                    <p>Enter a topic to search for rooms</p>
                 </div>
              )}

              {/* Estado cuando se buscó y no hubo resultados */}
              {!loading && searchInput && roomsFound.length === 0 && (
                 <div className="text-center py-8 text-saylo-black/60 text-sm font-medium">
                    <p>There are no rooms about "{searchInput}".</p>
                 </div>
              )}

              {!loading && roomsFound.map(room => (
                <div key={room.id} className="flex justify-between items-center bg-white/40 hover:bg-white/60 p-4 rounded-2xl border border-saylo-gray/20 transition-all shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-lg text-saylo-black font-medium">{room.topicId}</strong>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-saylo-gray font-medium mt-1">
                      <Users size={12} /> {room.participants.length} studying
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinExisting(room.id)}
                    className="px-4 py-2 rounded-full bg-saylo-black text-saylo-cream text-sm font-medium hover:bg-saylo-gray transition-colors shadow-sm"
                  >
                    Unirse
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTENIDO: PRIVADO */}
        {activeTab === 'private' && (
          <div className="flex flex-col items-center justify-center h-[250px] animate-in fade-in duration-500">
            <button 
              onClick={handleCreatePrivate} 
              disabled={loading} 
              className="w-full max-w-xs bg-saylo-black hover:bg-saylo-gray text-saylo-cream py-3 rounded-full font-medium shadow-md transition-all mb-8 flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Create private room
            </button>
            
            <div className="w-full max-w-xs border-t border-saylo-black/10 pt-6">
              <p className="text-xs text-saylo-gray mb-3 text-center font-medium">Or join with a code</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Room ID..." 
                  value={joinPrivateId}
                  onChange={(e) => setJoinPrivateId(e.target.value)}
                  className="flex-1 px-4 h-12 bg-saylo-cream border-none rounded-full text-saylo-black focus:ring-2 focus:ring-saylo-gray focus:outline-none text-sm font-medium shadow-sm"
                />
                <button 
                  onClick={handleJoinPrivate} 
                  disabled={!joinPrivateId || loading}
                  className="bg-saylo-black hover:bg-saylo-gray text-saylo-cream w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO: COMUNIDAD */}
        {activeTab === 'community' && (
          <div className="h-[250px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-500">
             <CommunityFeed userId={userId} />
          </div>
        )}

      </div>
    </div>
  );
};