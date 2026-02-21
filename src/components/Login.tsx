import { loginWithGoogle } from '../services/auth';
import { ArrowRight, BookOpen, Users, Clock } from 'lucide-react';

export const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-saylo-bg text-white relative overflow-hidden">
      
      {/* Fondo decorativo (Glow effects) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-saylo-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-saylo-accent/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 text-center max-w-md px-6">
        
        {/* Logo / Icono Principal */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-saylo-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8 rotate-3 hover:rotate-6 transition-transform duration-500">
          <BookOpen size={40} className="text-white" />
        </div>

        <h1 className="text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Saylo.
        </h1>
        
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Tu espacio para estudiar la Biblia, sincronizado y en comunidad. 
          <span className="block mt-2 text-sm font-medium text-saylo-primary">
            Sin distracciones. En tiempo real.
          </span>
        </p>

        {/* Botón de Acción */}
        <button 
          onClick={loginWithGoogle}
          className="group w-full bg-white text-black py-4 px-6 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
        >
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          Continuar con Google
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Features rápidas */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-slate-800/50 text-saylo-secondary"><Users size={20} /></div>
            <span className="text-xs text-slate-500 font-medium">Grupos</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-slate-800/50 text-saylo-accent"><Clock size={20} /></div>
            <span className="text-xs text-slate-500 font-medium">Pomodoro</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-slate-800/50 text-purple-400"><BookOpen size={20} /></div>
            <span className="text-xs text-slate-500 font-medium">Biblia</span>
          </div>
        </div>

      </div>

      <footer className="absolute bottom-6 text-xs text-slate-600">
        © 2026 Saylo App • Hecho con ❤️
      </footer>
    </div>
  );
};