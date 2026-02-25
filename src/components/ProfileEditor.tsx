import { useState, useEffect, useRef } from 'react';
import { updateUserProfile, getUserProfile } from '../services/users';
import { uploadProfileImage } from '../services/storage'; 
import type { UserProfile } from '../types/User';
import { X, Save, User, Camera, Loader2, BookOpen, Music, Heart, Palette } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

// Opciones de temas para el perfil
type ProfileTheme = 'cream' | 'white' | 'black';

export const ProfileEditor = ({ userId, onClose }: Props) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(''); 
  const [bio, setBio] = useState('');
  
  // --- NUEVOS ESTADOS REALES ---
  const [theme, setTheme] = useState<ProfileTheme>('cream');
  const [favReading, setFavReading] = useState('');
  const [favMusic, setFavMusic] = useState('');
  // Los contadores (En un futuro, los sacarás de la base de datos)
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [initialLoad, setInitialLoad] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      try {
        const p = await getUserProfile(userId);
        if (p) {
          setProfile(p);
          setDisplayName(p.displayName || '');
          setPhotoURL(p.photoURL || '');
          setBio(p.bio || '');
          // Si ya tenía tema o favoritos guardados, los cargamos (esto requerirá actualizar tu UserProfile)
          // setTheme(p.theme || 'cream');
          // setFavReading(p.favReading || '');
          // setFavMusic(p.favMusic || '');
          // setStats({ posts: p.posts || 0, followers: p.followers || 0, following: p.following || 0 });
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
    if (!userId) return;
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
    if (!userId) return;

    try {
      setLoading(true);
      await updateUserProfile(userId, { 
        displayName, 
        photoURL, 
        bio,
        // Aquí guardarías el tema y los favoritos en un futuro
        // theme,
        // favReading,
        // favMusic
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

  // Configuración de colores según el tema elegido
  const themeColors = {
    cream: { bg: 'bg-[#F2E3D0]', text: 'text-[#000000]', border: 'border-[#000000]', inputBg: 'bg-white', accent: 'bg-[#B1C7DE]' },
    white: { bg: 'bg-white', text: 'text-[#000000]', border: 'border-[#000000]', inputBg: 'bg-[#F4F4F4]', accent: 'bg-[#F2E3D0]' },
    black: { bg: 'bg-[#000000]', text: 'text-white', border: 'border-white/20', inputBg: 'bg-[#111111]', accent: 'bg-[#333333]' },
  };
  const currentTheme = themeColors[theme];

  if (initialLoad) {
    return (
      <div className={`relative ${currentTheme.bg} w-full max-w-md rounded-3xl border-2 ${currentTheme.border} p-12 flex justify-center items-center`}>
        <Loader2 className={`animate-spin ${currentTheme.text}`} size={32} />
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Altura máxima controlada (max-h-[90vh]) y scroll interno
    <div className={`relative ${currentTheme.bg} w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border-2 ${currentTheme.border} overflow-hidden animate-in zoom-in-95 duration-300 font-sans text-left transition-colors`}>
      
      {/* HEADER: Botones de cerrar y selector de tema */}
      <div className="flex justify-between items-center p-4 border-b-2 border-inherit">
        <div className="flex items-center gap-3">
           <h2 className={`text-xl font-bold ${currentTheme.text} tracking-tight ml-2`}>Mi Perfil</h2>
           
           {/* Mini selector de tema */}
           <div className={`flex items-center gap-1 ${currentTheme.inputBg} rounded-full p-1 border border-inherit/30`}>
              <button onClick={() => setTheme('cream')} className={`w-5 h-5 rounded-full bg-[#F2E3D0] ${theme === 'cream' ? 'ring-2 ring-offset-1 ring-black' : ''}`} title="Crema" />
              <button onClick={() => setTheme('white')} className={`w-5 h-5 rounded-full bg-white border border-gray-300 ${theme === 'white' ? 'ring-2 ring-offset-1 ring-black' : ''}`} title="Blanco" />
              <button onClick={() => setTheme('black')} className={`w-5 h-5 rounded-full bg-black ${theme === 'black' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} title="Negro" />
           </div>
        </div>

        <button onClick={onClose} className={`${currentTheme.inputBg} ${currentTheme.text} border-2 ${currentTheme.border} rounded-full p-1 hover:brightness-95 transition-all`}>
          <X size={20} />
        </button>
      </div>

      {/* ÁREA SCROLLEABLE: Si el contenido es muy largo, solo esta parte hará scroll */}
      <div className="overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        
        {/* SECCIÓN 1: Avatar y Nombre */}
        <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 ${currentTheme.inputBg} p-4 rounded-2xl border-2 ${currentTheme.border}`}>
          
          <div 
            className={`relative group cursor-pointer w-24 h-24 ${currentTheme.bg} border-2 ${currentTheme.border} rounded-2xl flex items-center justify-center overflow-hidden shrink-0`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
               <Loader2 className={`animate-spin ${currentTheme.text}`} size={24} />
            ) : photoURL ? (
              <img src={photoURL} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className={`${currentTheme.text} opacity-50`} />
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="flex-1 w-full mt-2 sm:mt-0">
             <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu Nombre"
                className={`w-full bg-transparent border-b-2 border-inherit/30 focus:border-inherit text-2xl font-bold ${currentTheme.text} placeholder:opacity-40 outline-none pb-1 mb-1 truncate text-center sm:text-left`}
              />
            <p className={`${currentTheme.text} opacity-70 text-xs font-bold uppercase tracking-wider truncate text-center sm:text-left`}>
               @{profile?.displayName?.replace(/\s+/g, '').toLowerCase() || 'usuario'}
            </p>
          </div>
        </div>

        {/* SECCIÓN 2: Estadísticas Reales (Conectadas al estado) */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Posts', value: stats.posts },
            { label: 'Followers', value: stats.followers },
            { label: 'Following', value: stats.following }
          ].map((stat) => (
            <div key={stat.label} className={`${currentTheme.inputBg} border-2 ${currentTheme.border} rounded-xl p-3 text-center`}>
              <span className={`block text-xl font-black ${currentTheme.text}`}>{stat.value}</span>
              <span className={`text-[10px] font-bold ${currentTheme.text} opacity-60 uppercase tracking-wider`}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* SECCIÓN 3: Top Favorites (Editables) */}
        <div className={`${currentTheme.inputBg} border-2 ${currentTheme.border} rounded-2xl p-4`}>
          <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 border-inherit/10`}>
            <Heart className={`${currentTheme.text}`} w-5 h-5 fill="currentColor" />
            <h3 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wide`}>Top Favorites</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Input Libro/Lectura */}
            <div className="flex items-start gap-3">
              <div className={`${currentTheme.accent} border-2 ${currentTheme.border} p-2 rounded-lg ${currentTheme.text} shrink-0`}>
                <BookOpen size={16} />
              </div>
              <div className="flex-1 w-full">
                 <p className={`text-[10px] font-bold ${currentTheme.text} opacity-60 uppercase mb-1`}>Reading</p>
                 <input 
                    type="text"
                    value={favReading}
                    onChange={(e) => setFavReading(e.target.value)}
                    placeholder="Ej: Salmos & Proverbs..."
                    className={`w-full bg-transparent border-b border-inherit/30 focus:border-inherit text-sm font-bold ${currentTheme.text} placeholder:opacity-30 outline-none pb-1`}
                 />
              </div>
            </div>

            {/* Input Música/Vibe */}
            <div className="flex items-start gap-3">
              <div className={`${currentTheme.accent} border-2 ${currentTheme.border} p-2 rounded-lg ${currentTheme.text} shrink-0`}>
                <Music size={16} />
              </div>
              <div className="flex-1 w-full">
                 <p className={`text-[10px] font-bold ${currentTheme.text} opacity-60 uppercase mb-1`}>Vibe / Music</p>
                 <input 
                    type="text"
                    value={favMusic}
                    onChange={(e) => setFavMusic(e.target.value)}
                    placeholder="Ej: Lo-Fi Worship Beats..."
                    className={`w-full bg-transparent border-b border-inherit/30 focus:border-inherit text-sm font-bold ${currentTheme.text} placeholder:opacity-30 outline-none pb-1`}
                 />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Bio */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-bold ${currentTheme.text} ml-1 uppercase tracking-wide`}>Bio / About me</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Escribe algo sobre ti..."
            rows={3}
            className={`w-full ${currentTheme.inputBg} border-2 ${currentTheme.border} rounded-2xl p-3 ${currentTheme.text} placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-inherit/20 font-medium resize-none text-sm`}
          />
        </div>

      </div>

      {/* FOOTER FIJO: Botón Guardar */}
      <div className={`p-4 border-t-2 border-inherit ${currentTheme.bg}`}>
         <button 
           onClick={handleSave}
           disabled={loading || uploading}
           className={`w-full ${theme === 'black' ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#000000] text-[#F2E3D0] hover:bg-gray-800'} py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
         >
           {loading ? 'Guardando...' : 'Guardar Cambios'} {!loading && <Save size={20} />}
         </button>
      </div>

    </div>
  );
};