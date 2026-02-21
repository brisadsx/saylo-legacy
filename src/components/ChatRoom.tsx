import { useState, useEffect, useRef } from 'react';
import { subscribeToMessages, sendMessage } from '../services/chat';
import type { Message } from '../types/Message';
import { Send, MessageSquare } from 'lucide-react'; // Asegúrate de tener lucide-react instalado

interface Props {
  roomId: string;
  userId: string;
  userName: string;
}

export const ChatRoom = ({ roomId, userId, userName }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  // Auto-scroll al fondo cuando llega un mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(roomId, {
        userId,
        userName,
        text: newMessage,
        timestamp: Date.now() // Placeholder, firebase pone el real
      });
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-saylo-card text-saylo-text relative">
      
      {/* HEADER DEL CHAT (Opcional, decorativo) */}
      <div className="absolute top-0 w-full h-12 bg-gradient-to-b from-saylo-card to-transparent z-10 pointer-events-none"></div>

      {/* LISTA DE MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
            <MessageSquare size={40} className="mb-2" />
            <p className="text-sm">Di "Hola" al grupo 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.userId === userId;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className={`
                max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm relative group
                ${isMe 
                  ? 'bg-saylo-primary text-white rounded-tr-sm' // Mis mensajes: Morados
                  : 'bg-slate-700 text-slate-200 rounded-tl-sm' // Otros: Grises
                }
              `}>
                {/* Nombre pequeño para otros */}
                {!isMe && (
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 opacity-70">
                    {msg.userName}
                  </span>
                )}
                
                {msg.text}
                
                {/* Hora (opcional, simulada o real si la tienes) */}
                <span className="text-[9px] opacity-50 ml-2 inline-block">
                   {/* Si tienes timestamp real, úsalo aquí */}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form 
        onSubmit={handleSend} 
        className="p-3 bg-slate-800/50 border-t border-slate-700 flex gap-2"
      >
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-black/40 text-white text-sm px-4 py-3 rounded-xl border border-slate-600 focus:outline-none focus:border-saylo-primary focus:ring-1 focus:ring-saylo-primary transition-all placeholder-slate-500"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="bg-slate-700 hover:bg-saylo-primary text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};