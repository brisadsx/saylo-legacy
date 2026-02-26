import { useState, useEffect, useCallback } from 'react';
import { createPost, getRecentPosts, toggleLike } from '../services/posts';
import { getUserProfile } from '../services/users';
import type { Post } from '../types/Post';
import { Heart, Send, MessageCircle, User as UserIcon } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface Props {
  userId: string;
  onOpenProfile: (id: string) => void;
}

// ============================================================================
// SUB-COMPONENTE: PostItem (Reactivo y Adaptado a Fondo Claro)
// ============================================================================
const PostItem = ({ post, currentUserId, onLike, onOpenProfile }: { post: Post, currentUserId: string, onLike: (p: Post) => void, onOpenProfile: (id: string) => void }) => {
  const [authorInfo, setAuthorInfo] = useState({ 
    name: post.userName, 
    avatar: post.userAvatar 
  });

  useEffect(() => {
    if (!post.userId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', post.userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAuthorInfo({
          name: data.displayName || data.username || post.userName,
          avatar: data.photoURL || ''
        });
      }
    });
    return () => unsubscribe();
  }, [post.userId, post.userName]);

  const isLiked = post.likedBy.includes(currentUserId);
  const dateStr = post.createdAt?.seconds 
    ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() 
    : 'Just now';

  return (
    // Tarjeta con borde sutil para fondo claro
    <div className="bg-black/5 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-black/20 transition-colors">
      
      {/* Cabecera del Post: Un solo Avatar limpio */}
      <div className="flex items-start gap-3 mb-3">
        <div 
          onClick={() => onOpenProfile(post.userId)}
          className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer hover:scale-105 transition-transform"
        >
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
        
        {/* Textos oscuros para que se lean */}
        <div>
          <div 
            className="font-bold text-black text-sm cursor-pointer hover:underline" 
            onClick={() => onOpenProfile(post.userId)}
          >
            {authorInfo.name}
          </div>
          <div className="text-xs text-black/60">{dateStr}</div>
        </div>
      </div>

      {/* Contenido del Post en color NEGRO */}
      <p className="text-black font-medium text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Botones de Acción (Corazones y Comentarios) */}
      <div className="flex items-center gap-4 border-t border-black/10 pt-3">
        <button 
          onClick={() => onLike(post)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-red-500' : 'text-black/60 hover:text-black'}`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          {post.likes || 0}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-bold text-black/60 cursor-default">
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
export const CommunityFeed = ({ userId, onOpenProfile }: Props) => {
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
      
      {/* CAJA DE PUBLICAR (Diseño limpio adaptado al fondo claro) */}
      <div className="bg-black/5 border border-black/10 p-4 rounded-2xl mb-8 shadow-sm">
        <textarea 
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="What's going on?"
          className="w-full bg-transparent text-black placeholder:text-black/40 p-2 rounded-xl resize-none focus:outline-none focus:ring-0 transition-all text-sm min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-3 border-t border-black/10 pt-3">
          <span className="text-xs text-black/50 font-medium">Share with the community</span>
          <button 
            onClick={handlePublish} 
            disabled={!newPostText.trim()}
            className="bg-black hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#F2E3D0] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <Send size={14} /> Post
          </button>
        </div>
      </div>

      {/* LISTA DE POSTS */}
      {loading ? (
        <div className="text-center py-10 text-black/50 animate-pulse font-bold uppercase text-sm">Loading...</div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              currentUserId={userId} 
              onLike={handleLike} 
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
};