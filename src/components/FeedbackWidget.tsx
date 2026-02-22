import { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { sendFeedback } from '../services/feedback';

export const FeedbackWidget = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    try {
      await sendFeedback(userId, type, message);
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (error) {
        console.error(error);
      setStatus('idle');
      alert("Hubo un error al enviar el reporte. Intenta de nuevo.");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-slate-800 hover:bg-saylo-primary text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-700 transition-all z-50 group"
        title="Reportar un error o sugerencia"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-saylo-card border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bug size={16} className="text-saylo-primary" /> Reportar
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        {status === 'success' ? (
          <div className="text-center py-6 text-green-400 text-sm font-medium animate-in fade-in">
            ¡Gracias por ayudarnos a mejorar Saylo!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'bug' | 'feature' | 'other')}
              className="w-full bg-black/30 border border-slate-700 rounded-lg text-sm text-white p-2 focus:outline-none focus:border-saylo-primary"
            >
              <option value="bug">Reportar un Error (Bug)</option>
              <option value="feature">Sugerir una Mejora</option>
              <option value="other">Otro</option>
            </select>

            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="¿Qué pasó? o ¿Qué te gustaría ver?"
              className="w-full bg-black/30 border border-slate-700 rounded-lg text-sm text-white p-3 min-h-[100px] resize-none focus:outline-none focus:border-saylo-primary"
              required
            />

            <button 
              type="submit"
              disabled={status === 'loading' || !message.trim()}
              className="w-full bg-saylo-primary hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : <><Send size={16} /> Enviar</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};