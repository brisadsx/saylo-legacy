import { useState, useEffect, useCallback } from 'react';
import { createPost, getRecentPosts, toggleLike } from '../services/posts';
import { getUserProfile } from '../services/users';
import type { Post } from '../types/Post';
import { Heart, Send, MessageCircle } from 'lucide-react';

interface Props {
  userId: string;
}

export const CommunityFeed = ({ userId }: Props) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecentPosts();
      setPosts(data);
    } catch (error) { 
      console.error("Error al cargar posts:", error); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePublish = async () => {
    if (!newPostText.trim()) return;
    const profile = await getUserProfile(userId);
    const name = profile?.displayName || 'Usuario';
    
    // Si no hay foto, mandamos un string vacío
    const avatar = profile?.photoURL || '';

    await createPost(userId, name, avatar, newPostText);
    setNewPostText('');
    loadPosts();
  };

  const handleLike = async (post: Post) => {
    const isLiked = post.likedBy.includes(userId);
    
    // Actualización optimista de la UI
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likes: isLiked ? p.likes - 1 : p.likes + 1,
          likedBy: isLiked ? p.likedBy.filter(id => id !== userId) : [...p.likedBy, userId]
        };
      }
      return p;
    }));
    
    await toggleLike(post.id, userId, isLiked);
  };

  return (
    <div className="max-w-xl mx-auto">
      
      {/* CAJA DE PUBLICAR */}
      <div className="bg-saylo-card border border-slate-700/50 p-4 rounded-2xl mb-8 shadow-lg">
        <textarea 
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="¿Qué versículo te inspira hoy?"
          className="w-full bg-black/20 text-white p-4 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-saylo-primary transition-all text-sm min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-slate-500 font-medium">Share with the community</span>
          <button 
            onClick={handlePublish} 
            disabled={!newPostText.trim()}
            className="bg-saylo-primary hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Send size={16} /> Post
          </button>
        </div>
      </div>

      {/* LISTA DE POSTS */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const isLiked = post.likedBy.includes(userId);
            const dateStr = post.createdAt?.seconds 
              ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() 
              : 'Reciente';

            return (
              <div key={post.id} className="bg-saylo-card border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors">
                
                {/* Cabecera del Post: Avatar y Nombre */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Contenedor del Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600 overflow-hidden shadow-sm">
                    {post.userAvatar && post.userAvatar.startsWith('http') ? (
                      <img 
                        src={post.userAvatar} 
                        alt={post.userName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      /* Avatar por defecto: Primera letra del nombre */
                      <span className="text-white font-bold text-lg uppercase">
                        {post.userName ? post.userName.charAt(0) : '?'}
                      </span>
                    )}
                  </div>
                  
                  {/* Nombre y Fecha */}
                  <div>
                    <div className="font-bold text-white text-sm">{post.userName}</div>
                    <div className="text-xs text-slate-500">{dateStr}</div>
                  </div>
                </div>

                {/* Contenido del Post */}
                <p className="text-slate-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Botones de Acción */}
                <div className="flex items-center gap-4 border-t border-slate-800 pt-3">
                  <button 
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-saylo-accent' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                    {post.likes || 0}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 cursor-default">
                    <MessageCircle size={16} />
                    Comment
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};