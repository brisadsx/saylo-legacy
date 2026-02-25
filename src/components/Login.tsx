import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';

export const Login = () => {
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <div className="min-h-screen bg-saylo-cream text-saylo-black flex flex-col justify-between items-center py-12 font-sans selection:bg-saylo-blue selection:text-saylo-black">
      
      <div className="flex-1"></div>

      <div className="flex flex-col items-center text-center gap-8 w-full max-w-sm px-4">
        
        {/* titulos */}
        <div className="flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-none mb-4 font-light">
            Welcome<br />
            to<br />
            <span className="text-saylo-gray">Saylo</span>
          </h1>
          <p className="text-saylo-black text-sm md:text-base tracking-wide">
            (learn/meet up with friends)
          </p>
        </div>

        {/* botón de google */}
        <button 
          onClick={loginWithGoogle}
          className="bg-saylo-blue text-saylo-black hover:bg-opacity-80 transition-all rounded-full px-8 py-3 flex items-center gap-3 text-sm font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          {/* logo de google */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 flex flex-col leading-tight text-sm tracking-tight font-medium">
          <span className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>groups,</span>
          <span className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>pomodoro,</span>
          <span className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>community,</span>
          <span className="opacity-0 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>bible</span>
        </div>

      </div>

      <div className="flex-1 flex items-end pb-4">
        <p className="text-saylo-black text-xs font-medium tracking-wide">
          © 2026 Saylo. Made with love
        </p>
      </div>

    </div>
  );
};