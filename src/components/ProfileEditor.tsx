import { useState, useEffect, useRef } from 'react';
import { updateUserProfile, getUserProfile } from '../services/users';
import { uploadProfileImage } from '../services/storage'; 
import type { UserProfile, FavoriteItem } from '../types/User'; 
import { X, User, Camera, Loader2, Settings, Instagram, Twitter, Plus, Search, Film, Book } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

const getStreakColor = (streak: number) => {
  if (streak === 0) return '#F2E3D0'; 
  
  const colors = [
    '#00E5FF', 
    '#39FF14',
    '#FFEA00', 
    '#FF5E00', 
    '#FF00FF', 
    '#B026FF', 
    '#FF3131', 
  ];
  // el ciclo se repite
  return colors[(streak - 1) % colors.length];
};

export const ProfileEditor = ({ userId, onClose }: Props) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(''); 
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Redes Sociales
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');

  // Stats Reales
  const [stats, setStats] = useState({ posts: 0, followers: 0 });
  const [totalSeconds, setTotalSeconds] = useState(0); 
  
  // Favoritos
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Buscador de APIs
  const [showFavSearch, setShowFavSearch] = useState(false);
  const [favSearchType, setFavSearchType] = useState<'movie' | 'book'>('movie');
  const [favQuery, setFavQuery] = useState('');
  const [favResults, setFavResults] = useState<FavoriteItem[]>([]);
  const [isSearchingFavs, setIsSearchingFavs] = useState(false);

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
          setDisplayName(p.displayName || p.username || '');
          setPhotoURL(p.photoURL || '');
          setBio(p.bio || '');
          setInstagram(p.instagram || '');
          setTwitter(p.twitter || '');
          setFavorites(p.favorites || []);
          setStats({ posts: p.posts || 0, followers: p.followers || 0 });
          setTotalSeconds(p.totalAppTime || 0);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) return alert("Max file size is 2MB.");
    try {
      setUploading(true);
      const url = await uploadProfileImage(file, userId);
      setPhotoURL(url); 
    } catch (error) { console.error(error); alert("Error uploading image"); } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await updateUserProfile(userId, { 
          displayName, photoURL, bio, instagram, twitter, favorites 
      });
      setIsEditing(false);
    } catch (error) { console.error(error); alert("Error saving profile."); } 
    finally { setLoading(false); }
  };

  const searchFavorites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favQuery.trim()) return;
    setIsSearchingFavs(true);
    setFavResults([]); 
    try {
      if (favSearchType === 'movie') {
        const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY; 
        if (!TMDB_API_KEY || TMDB_API_KEY === "VITE_TMDB_API_KEY") {
            alert("Missing TMDB API Key in .env file!");
            setIsSearchingFavs(false); return;
        }
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(favQuery)}&language=en-US`);
        const data = await res.json();
        const movies: FavoriteItem[] = (data.results || []).slice(0, 8).map((m: TMDBMovie) => ({
          id: `tmdb-${m.id}`, type: 'movie', title: m.title,
          coverUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://placehold.co/100x150/111/F2E3D0?text=No+Cover'
        }));
        setFavResults(movies);
      } else {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(favQuery)}&langRestrict=en&maxResults=8`);
        const data = await res.json();
        const books: FavoriteItem[] = (data.items || []).map((b: GoogleBook) => ({
          id: `book-${b.id}`, type: 'book', title: b.volumeInfo.title,
          coverUrl: b.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://placehold.co/100x150/111/F2E3D0?text=No+Cover'
        }));
        setFavResults(books);
      }
    } catch (error) {
      console.error(error); alert("Error searching. Please try again.");
    } finally { setIsSearchingFavs(false); }
  };

  const handleAddFavorite = (item: FavoriteItem) => {
    if (favorites.some(f => f.id === item.id)) return alert("Already in your shelf!");
    if (favorites.length >= 4) return alert("You can only have a maximum of 4 favorites.");
    setFavorites([...favorites, item]); setShowFavSearch(false); setFavQuery(''); 
  };
  const handleRemoveFavorite = (id: string) => setFavorites(favorites.filter(f => f.id !== id));

  // CÁLCULO DEL STREAK Y EL COLOR
  const currentStreak = Math.floor(totalSeconds / 3600);
  const activeColor = getStreakColor(currentStreak);

  if (initialLoad) return <div className="fixed inset-0 z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-[#F2E3D0]" /></div>;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* PROFILE CARD */}
      <div className="relative bg-black w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl animate-in zoom-in-95 duration-300 text-center overflow-hidden text-[#F2E3D0] border border-white/10 shadow-lg">
        
        {/* HEADER */}
        <button className="absolute top-3 left-3 text-[#F2E3D0]/60 hover:text-[#F2E3D0] p-1.5 transition-colors z-10">
            <Settings size={18} />
        </button>
        <button onClick={onClose} className="absolute top-3 right-3 text-[#F2E3D0]/60 hover:text-[#F2E3D0] p-1.5 transition-colors z-10">
            <X size={18} />
        </button>

        {/* ÁREA SCROLLEABLE */}
        <div className="overflow-y-auto p-5 pt-9 custom-scrollbar flex-1 flex flex-col gap-3">
            
            {/* 1. IDENTIDAD */}
            <div className="flex flex-col items-center gap-2 mb-2">
                <div 
                className={`relative group w-20 h-20 rounded-full overflow-hidden shrink-0 ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
                >
                {uploading ? <Loader2 className="animate-spin m-auto mt-7 text-[#F2E3D0]" /> : 
                photoURL ? <img src={photoURL} alt="Profile" className="w-full h-full object-cover" /> : 
                <User size={40} className="m-auto mt-5 text-[#F2E3D0]/30" />}
                {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-[#F2E3D0]" size={20} />
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={!isEditing} />
                </div>

                <div className="flex flex-col items-center w-full">
                {isEditing ? (
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="text-lg font-black text-[#F2E3D0] bg-transparent border-b border-[#F2E3D0]/20 text-center focus:outline-none pb-0.5 w-full max-w-[180px]" autoFocus placeholder="Your @username" />
                ) : (
                    <h2 className="text-xl font-black text-[#F2E3D0] tracking-tight">{displayName || profile?.username || 'User'}</h2>
                )}
                </div>

                <div className="w-full max-w-xs px-1 min-h-[1.5rem]">
                    {isEditing ? (
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Your bio..." rows={1} className="w-full bg-[#F2E3D0]/10 rounded-xl p-2 text-xs font-medium text-center focus:outline-none resize-none text-[#F2E3D0] placeholder:text-[#F2E3D0]/40" />
                    ) : (
                    <p className="text-sm font-medium text-[#F2E3D0]/80 leading-snug">{bio || 'No bio yet.'}</p>
                    )}
                </div>
            </div>

            {/* 2. STATS COMPACTOS Y DINÁMICOS */}
            <div className="flex justify-center gap-4 w-full py-1.5 my-1.5">
                <div className="flex flex-col items-center">
                    <span className="text-base font-black text-[#F2E3D0]">{stats.posts}</span>
                    <span className="text-[10px] text-[#F2E3D0]/60 font-bold tracking-wider">Posts</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-base font-black text-[#F2E3D0]">{stats.followers.toLocaleString()}</span>
                    <span className="text-[10px] text-[#F2E3D0]/60 font-bold tracking-wider">Followers</span>
                </div>
                
                {/* STREAK DINÁMICO SIN EMOJI */}
                <div className="flex flex-col items-center relative transition-colors duration-500" style={{ color: activeColor }}>
                    <span className="text-base font-black flex items-center drop-shadow-[0_0_10px_rgba(currentcolor,0.5)]">
                        {currentStreak}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider opacity-80">Streak</span>
                </div>
            </div>

            {/* 3. REDES SOCIALES */}
            <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-xs mx-auto">
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2 bg-[#F2E3D0]/10 rounded-xl px-3 py-1.5 border border-white/5">
                            <Instagram size={14} className="text-[#F2E3D0]/60 shrink-0" />
                            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Your Instagram @" className="bg-transparent border-none text-xs text-[#F2E3D0] focus:outline-none w-full placeholder:text-[#F2E3D0]/40" />
                        </div>
                        <div className="flex items-center gap-2 bg-[#F2E3D0]/10 rounded-xl px-3 py-1.5 border border-white/5">
                            <Twitter size={14} className="text-[#F2E3D0]/60 shrink-0" />
                            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="Your Twitter/X @" className="bg-transparent border-none text-xs text-[#F2E3D0] focus:outline-none w-full placeholder:text-[#F2E3D0]/40" />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center gap-3">
                        {instagram ? <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-[#F2E3D0] opacity-80 hover:opacity-100 transition-all hover:scale-110"><Instagram size={18} /></a> : null}
                        {twitter ? <a href={`https://twitter.com/${twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-[#F2E3D0] opacity-80 hover:opacity-100 transition-all hover:scale-110"><Twitter size={18} /></a> : null}
                        {!instagram && !twitter && <span className="text-[10px] text-[#F2E3D0]/40 font-bold uppercase tracking-wider">No links yet</span>}
                    </div>
                )}
            </div>

            {/* 4. BOTONES DE ACCIÓN (Limpio) */}
            <div className="flex flex-col items-center gap-2 mb-4">
                {isEditing ? (
                    <button onClick={handleSave} disabled={loading || uploading} className="bg-[#F2E3D0] text-black px-5 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#F2E3D0]/90 transition-all disabled:opacity-50">
                        {loading ? '...' : 'Save'}
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-[#F2E3D0] uppercase text-black px-5 py-1.5 rounded-full font-bold text-xs tracking-widest hover:bg-[#F2E3D0]/90 transition-all">
                        Edit Profile
                    </button>
                )}
            </div>

            {/* 5. SECCIÓN FAVORITES */}
            <div className="w-full text-left">
                <h3 className="text-xs font-black text-[#F2E3D0] uppercase tracking-wider mb-2 px-1 opacity-90">Favorites</h3>
                <div className="grid grid-cols-4 gap-2 w-full px-1">
                    {favorites.map(fav => (
                        <div key={fav.id} className="relative group cursor-pointer aspect-[2/3] w-full">
                            <img src={fav.coverUrl} alt={fav.title} className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all border border-white/10" />
                            {isEditing && (
                                <div onClick={() => handleRemoveFavorite(fav.id)} className="absolute inset-0 bg-red-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <X size={20} /><span className="text-[8px] font-bold mt-1 uppercase">Remove</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {isEditing && favorites.length < 4 && (
                        <button onClick={() => setShowFavSearch(true)} className="relative flex flex-col items-center justify-center aspect-[2/3] w-full bg-[#F2E3D0]/5 rounded-lg text-[#F2E3D0]/40 transition-all border border-dashed border-[#F2E3D0]/20 group hover:bg-[#F2E3D0]/10 hover:text-[#F2E3D0] cursor-pointer">
                            <Plus size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
                {!isEditing && favorites.length === 0 && <p className="text-xs text-[#F2E3D0]/40 italic px-1 mt-2">No favorites added.</p>}
            </div>

        </div>
      </div>
    </div>

    {/* =========================================================
        FAVORITES SEARCH MODAL
        ========================================================= */}
    {showFavSearch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-sans text-[#F2E3D0]">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowFavSearch(false)}></div>
            
            <div className="relative bg-[#050505] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh] animate-in slide-in-from-bottom-10 duration-300">
                
                {/* Search Header */}
                <div className="p-4 border-b border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black">Add to Shelf</h3>
                        <button onClick={() => setShowFavSearch(false)} className="text-white/50 hover:text-white p-1"><X size={18}/></button>
                    </div>

                    {/* Movie or Book Toggle */}
                    <div className="flex bg-black rounded-lg p-0.5 border border-white/5">
                        <button onClick={() => { setFavSearchType('movie'); setFavResults([]); setFavQuery(''); }} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-bold transition-colors ${favSearchType === 'movie' ? 'bg-[#F2E3D0] text-black' : 'text-white/50 hover:text-white'}`}>
                            <Film size={14}/> Movie
                        </button>
                        <button onClick={() => { setFavSearchType('book'); setFavResults([]); setFavQuery(''); }} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-bold transition-colors ${favSearchType === 'book' ? 'bg-[#F2E3D0] text-black' : 'text-white/50 hover:text-white'}`}>
                            <Book size={14}/> Book
                        </button>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={searchFavorites} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3.5 top-3.5 text-white/40" size={16} />
                            <input type="text" value={favQuery} onChange={(e) => setFavQuery(e.target.value)} placeholder={`Search ${favSearchType === 'movie' ? 'e.g., Dune' : 'e.g., Bible'}...`} className="w-full bg-black rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F2E3D0] border border-white/5 placeholder:text-[#F2E3D0]/30" autoFocus />
                        </div>
                        <button type="submit" disabled={isSearchingFavs || !favQuery.trim()} className="bg-[#F2E3D0] text-black px-4 rounded-xl font-bold disabled:opacity-50 text-sm">Search</button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isSearchingFavs ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50"><Loader2 className="animate-spin mb-2" size={24} /><p className="text-xs font-bold uppercase">Searching...</p></div>
                    ) : favResults.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {favResults.map(res => (
                                <div key={res.id} onClick={() => handleAddFavorite(res)} className="group cursor-pointer flex flex-col">
                                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg border-2 border-transparent group-hover:border-[#F2E3D0] transition-colors">
                                        <img src={res.coverUrl} alt={res.title} className="w-full h-full object-cover border border-white/10" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                            <Plus className="text-[#F2E3D0]" size={28} /><span className="text-[9px] font-bold text-[#F2E3D0] uppercase mt-1">Add</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold mt-1.5 truncate text-center opacity-80 group-hover:opacity-100">{res.title}</p>
                                </div>
                            ))}
                        </div>
                    ) : favQuery && !isSearchingFavs ? (
                        <p className="text-center text-white/40 mt-8 text-xs font-bold uppercase tracking-wider">No results found.</p>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 p-8">
                            {favSearchType === 'movie' ? <Film size={40} className="mb-3" /> : <Book size={40} className="mb-3" />}
                            <p className="text-xs font-bold uppercase tracking-wider text-center px-4 leading-relaxed">Search to add favorites to your shelf.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )}
    </>
  );
};