import { useState, useEffect, useRef } from 'react';
import { updateUserProfile, getUserProfile } from '../services/users';
import { uploadProfileImage } from '../services/storage'; 
import type { UserProfile } from '../types/User';
import { X, Save, User, Camera, Loader2, BookOpen, Music, Heart } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

export const ProfileEditor = ({ userId, onClose }: Props) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(''); 
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [initialLoad, setInitialLoad] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos "dummy" para simular el diseño de las referencias (luego los conectaremos a datos reales)
  const stats = { posts: 12, followers: 248, following: 180 };
  const favorites = [
    { icon: BookOpen, label: "Reading", value: "Salmos & Proverbs" },
    { icon: Music, label: "Vibe", value: "Lo-Fi Worship Beats" },
  ];

  useEffect(() => {
    const load = async () => {
      // 🛡️ ESCUDO 1: Si no hay userId, detenemos todo
      if (!userId) {
        console.warn("Esperando a que el usuario cargue...");
        return;
      }

      try {
        const p = await getUserProfile(userId);
        if (p) {
          setProfile(p);
          setDisplayName(p.displayName || '');
          setPhotoURL(p.photoURL || '');
          setBio(p.bio || '');
        }
      } catch (error) {
        console.error("Error cargando el perfil:", error);
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 🛡️ ESCUDO 2: Verificamos que el usuario exista
    if (!userId) {
      alert("No se detectó tu sesión. Por favor, recarga e intenta de nuevo.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es muy pesada. Máximo 2MB.");
      return;
    }

    try {
      setUploading(true);
      const url = await uploadProfileImage(file, userId);
      setPhotoURL(url); 
    } catch (error) {
      console.error(error);
      alert("Error subiendo la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // 🛡️ ESCUDO 3: Freno de seguridad
    if (!userId) return;

    try {
      setLoading(true);
      await updateUserProfile(userId, { 
        displayName, 
        photoURL, 
        bio 
      });
      onClose();
      window.location.reload(); 
    } catch (error) {
      console.error("Error guardando cambios:", error);
      alert("Hubo un problema al guardar tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="relative bg-[#B1C7DE] w-full max-w-md rounded-3xl border-2 border-[#000000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-[#000000]" size={32} />
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Estilo Tarjeta Retro Azul
    <div className="relative bg-[#B1C7DE] w-full max-w-md rounded-3xl border-2 border-[#000000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300 font-sans text-left">
      
      {/* HEADER: Botón cerrar estilo retro */}
      <div className="flex justify-between items-center p-4 pb-0">
        <h2 className="text-xl font-bold text-[#000000] tracking-tight ml-2">Mi Perfil</h2>
        <button onClick={onClose} className="bg-[#F2E3D0] text-[#000000] border-2 border-[#000000] rounded-full p-1 hover:brightness-95 transition-all active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 pt-4 flex flex-col gap-6">
        
        {/* SECCIÓN 1: Avatar Interactivo y Nombre */}
        <div className="flex items-center gap-4 bg-[#F2E3D0]/80 p-4 rounded-2xl border-2 border-[#000000]">
          
          {/* Círculo de la foto clickeable */}
          <div 
            className="relative group cursor-pointer w-20 h-20 bg-[#F2E3D0] border-2 border-[#000000] rounded-2xl flex items-center justify-center overflow-hidden shadow-sm shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
               <Loader2 className="animate-spin text-[#000000]" size={24} />
            ) : photoURL ? (
              <img src={photoURL} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-[#000000]/50" />
            )}
            
            {/* Overlay hover para indicar que se puede cambiar */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Input de Nombre (En lugar de solo texto, es un campo editable) */}
          <div className="flex-1 min-w-0">
             <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu Nombre"
                className="w-full bg-transparent border-b-2 border-[#000000]/20 focus:border-[#000000] text-xl font-bold text-[#000000] placeholder:text-[#000000]/40 outline-none pb-1 mb-1 truncate"
              />
            <p className="text-[#000000]/70 text-xs font-bold uppercase tracking-wider truncate">
               @{profile?.displayName?.replace(/\s+/g, '').toLowerCase() || 'usuario'}
            </p>
          </div>
        </div>

        {/* SECCIÓN 2: Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Posts', value: stats.posts },
            { label: 'Followers', value: stats.followers },
            { label: 'Following', value: stats.following }
          ].map((stat) => (
            <div key={stat.label} className="bg-[#F2E3D0] border-2 border-[#000000] rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="block text-xl font-black text-[#000000]">{stat.value}</span>
              <span className="text-[10px] font-bold text-[#7C7D81] uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* SECCIÓN 3: Top Favorites */}
        <div className="bg-[#F2E3D0] border-2 border-[#000000] rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#000000]/10">
            <Heart className="text-[#000000] w-5 h-5" fill="currentColor" />
            <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wide">Top Favorites</h3>
          </div>
          <div className="flex flex-col gap-3">
            {favorites.map((fav, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-[#B1C7DE] border-2 border-[#000000] p-2 rounded-lg text-[#000000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <fav.icon size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-[#7C7D81] uppercase">{fav.label}</p>
                   <p className="text-sm font-bold text-[#000000]">{fav.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 4: Formulario de Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#000000] ml-1 uppercase tracking-wide">Bio / About me</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Escribe algo sobre ti..."
            rows={2}
            className="w-full bg-[#F2E3D0] border-2 border-[#000000] rounded-2xl p-3 text-[#000000] placeholder:text-[#7C7D81]/70 focus:outline-none focus:ring-2 focus:ring-[#000000]/20 font-medium resize-none shadow-inner text-sm"
          />
        </div>

        {/* BOTÓN GUARDAR (Estilo Retro) */}
        <button 
          onClick={handleSave}
          disabled={loading || uploading}
          className="w-full bg-[#000000] text-[#F2E3D0] border-2 border-[#000000] py-4 rounded-2xl font-bold text-lg hover:bg-[#7C7D81] transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(242,227,208,1)] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'} {!loading && <Save size={20} />}
        </button>

      </div>
    </div>
  );
};