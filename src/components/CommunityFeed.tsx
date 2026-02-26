import { useState, useEffect, useCallback } from 'react';
import { createPost, getRecentPosts, toggleLike } from '../services/posts';
import { getUserProfile } from '../services/users';
import type { Post } from '../types/Post';
import { Heart, Send, MessageCircle, User as UserIcon } from 'lucide-react';

// Importamos lo necesario para la suscripción en tiempo real
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface Props {
  userId: string;
}

// ============================================================================
// SUB-COMPONENTE: PostItem (Maneja la actualización en tiempo real del autor)
// ============================================================================
const PostItem = ({ post, currentUserId, onLike }: { post: Post, currentUserId: string, onLike: (p: Post) => void }) => {
  // Inicializamos con los datos estáticos del post para que no haya parpadeos
  const [authorInfo, setAuthorInfo] = useState({ 
    name: post.userName, 
    avatar: post.userAvatar 
  });

  useEffect(() => {
    if (!post.userId) return;

    // Nos suscribimos a los cambios del perfil del autor en la base de datos
    const unsubscribe = onSnapshot(doc(db, 'users', post.userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAuthorInfo({
          // Priorizamos el displayName actualizado, si no el username, y por último el original del post
          name: data.displayName || data.username || post.userName,
          avatar: data.photoURL || ''
        });
      }
    });

    // Limpiamos la suscripción cuando el post ya no se muestra
    return () => unsubscribe();
  }, [post.userId, post.userName]);

  const isLiked = post.likedBy.includes(currentUserId);
  const dateStr = post.createdAt?.seconds 
    ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() 
    : 'Just now'; // Cambiado a inglés

  return (
    <div className="bg-saylo-card border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors">
      
      {/* Cabecera del Post: Avatar y Nombre (Ahoran son Reactivos) */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600 overflow-hidden shadow-sm">
          {authorInfo.avatar && authorInfo.avatar.startsWith('http') ? (
            <img 
              src={authorInfo.avatar} 
              alt={authorInfo.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-white font-bold text-lg uppercase">
              {authorInfo.name ? authorInfo.name.charAt(0) : <UserIcon size={20} className="text-slate-400" />}
            </span>
          )}
        </div>
        
        <div>
          <div className="font-bold text-white text-sm">{authorInfo.name}</div>
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
          onClick={() => onLike(post)}
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
};

// ============================================================================
// COMPONENTE PRINCIPAL: CommunityFeed
// ============================================================================
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
      console.error("Error loading posts:", error); 
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
    const name = profile?.displayName || 'User';
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
          placeholder="What verse inspires you today?"
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
          {posts.map(post => (
            // Renderizamos nuestro nuevo sub-componente para cada post
            <PostItem 
              key={post.id} 
              post={post} 
              currentUserId={userId} 
              onLike={handleLike} 
            />
          ))}
        </div>
      )}
    </div>
  );
};