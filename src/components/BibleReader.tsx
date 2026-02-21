import { useState } from 'react';
import { fetchPassage } from '../services/bible';
import { updateRoomReading } from '../services/rooms';
import { Search, BookOpen } from 'lucide-react';

interface Props {
  roomId: string;
  isHost: boolean;
  readingData?: { reference: string, text: string };
}

export const BibleReader = ({ roomId, isHost, readingData }: Props) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const passage = await fetchPassage(query);
    setLoading(false);

    if (passage) {
      await updateRoomReading(roomId, {
        reference: passage.reference,
        text: passage.text
      });
      setQuery('');
    } else {
      alert('Pasaje no encontrado.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-saylo-card text-saylo-text">
      
      {/* HEADER: Buscador (Host) o Info (Guest) */}
      <div className="p-4 border-b border-slate-700/50 flex-shrink-0 bg-slate-800/30">
        {isHost ? (
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pasaje (ej: Juan 3:16)"
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-saylo-primary transition-all"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-saylo-primary hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Leer'}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 text-sm text-saylo-muted italic">
            <BookOpen size={16} />
            <span>Sigue la lectura del anfitrión</span>
          </div>
        )}
      </div>

      {/* ÁREA DE TEXTO (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        {readingData ? (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
            <h2 className="text-3xl lg:text-4xl font-black text-saylo-primary mb-6 tracking-tight border-b border-slate-800 pb-4">
              {readingData.reference}
            </h2>
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="font-serif text-lg lg:text-xl leading-loose text-slate-200 whitespace-pre-wrap">
                {readingData.text}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
              <BookOpen size={32} opacity={0.5} />
            </div>
            <p className="text-sm">
              {isHost 
                ? 'Busca un pasaje arriba para comenzar.' 
                : 'Esperando al anfitrión...'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};