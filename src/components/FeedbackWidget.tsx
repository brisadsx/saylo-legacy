import { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackWidgetProps {
  userId: string;
}

export const FeedbackWidget = ({ userId }: FeedbackWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [sending, setSending] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
  
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId,
        type,
        content: text.trim(),
        status: 'new',
        createdAt: serverTimestamp()
      });
     
      setText('');
      setIsOpen(false);
    } catch (error) {
      console.error("Error enviando feedback:", error);
      alert("Hubo un error al enviar tu reporte. Por favor, intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <Bug size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans text-left">
      
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
        
          <div className="relative bg-[#F2E3D0] w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-normal text-[#000000] tracking-tight">Report</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="bg-white/50 hover:bg-white text-[#000000] rounded-full p-2 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <select 
                value={type} 
                
                onChange={(e) => setType(e.target.value as 'bug' | 'feature' | 'other')}
                className="w-full bg-white border-none p-4 rounded-2xl text-[#000000] text-sm font-medium focus:ring-2 focus:ring-[#B1C7DE] outline-none shadow-sm"
              >
                <option value="bug">Report an error (Bug)</option>
                <option value="feature">Suggest an improvement</option>
                <option value="other">Other Comment</option>
              </select>

              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="What happened? Or what would you like to see?"
                rows={4}
                required
                className="w-full bg-white border-none p-4 rounded-2xl text-[#000000] text-sm font-medium placeholder:text-[#7C7D81]/60 focus:ring-2 focus:ring-[#B1C7DE] outline-none resize-none shadow-sm"
              />

              <button 
                type="submit" 
                disabled={sending || !text.trim()}
                className="w-full bg-[#B1C7DE] hover:brightness-95 text-[#000000] font-medium py-4 rounded-full transition-all flex justify-center items-center gap-2 shadow-sm mt-2 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Report'}
                {!sending && <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};