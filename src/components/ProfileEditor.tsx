import { useState, useEffect, useRef } from 'react';
import { updateUserProfile, getUserProfile } from '../services/users';
import { uploadProfileImage } from '../services/storage'; 
import { X, Save, User, Camera, Loader2, ImagePlus } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

export const ProfileEditor = ({ userId, onClose }: Props) => {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(''); 
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      // 🛡️ ESCUDO 1: Si no hay userId, detenemos todo silenciosamente
      if (!userId) {
        console.warn("Esperando a que el usuario cargue...");
        return;
      }

      try {
        const p = await getUserProfile(userId);
        if (p) {
          setDisplayName(p.displayName || '');
          setPhotoURL(p.photoURL || '');
          setBio(p.bio || '');
        }
      } catch (error) {
        console.error("Error cargando el perfil:", error);
      }
    };
    load();
  }, [userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 🛡️ ESCUDO 2: Verificamos que el usuario exista antes de intentar subir
    if (!userId) {
      alert("No se detectó tu sesión. Por favor, recarga la página e intenta de nuevo.");
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
    // 🛡️ ESCUDO 3: Freno de seguridad final
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-saylo-card w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User size={18} className="text-saylo-primary" /> Editar Perfil
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-xl flex items-center justify-center relative">
                {uploading ? (
                   <Loader2 className="animate-spin text-saylo-primary" size={32} />
                ) : photoURL ? (
                  <img src={photoURL} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-600" />
                )}
                
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>

              <div className="absolute bottom-0 right-0 bg-saylo-primary p-2 rounded-full border-2 border-saylo-card shadow-lg group-hover:scale-110 transition-transform">
                <ImagePlus size={16} className="text-white" />
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-3 font-medium">Toca para cambiar foto</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 ml-1 font-bold uppercase">Tu Nombre</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/30 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-saylo-primary transition-colors font-medium"
                placeholder="Ej: Brisa"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1 ml-1 font-bold uppercase">Bio Corta</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-black/30 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-saylo-primary transition-colors resize-none h-24 text-sm"
                placeholder="Estudiante, etc..."
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading || uploading}
            className="w-full bg-saylo-primary hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
          </button>

        </div>
      </div>
    </div>
  );
};