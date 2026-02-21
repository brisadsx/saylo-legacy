import { X, Mic, Music, Zap, Sliders } from 'lucide-react';

interface AudioConfig {
  ans: boolean; // Cancelación de ruido
  aec: boolean; // Cancelación de eco
  musicMode: boolean; // Modo música (Alta calidad)
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AudioConfig;
  onConfigChange: (newConfig: AudioConfig) => void;
}

export const AudioSettings = ({ isOpen, onClose, config, onConfigChange }: Props) => {
  if (!isOpen) return null;

  const toggleSetting = (key: keyof AudioConfig) => {
    onConfigChange({
      ...config,
      [key]: !config[key]
    });
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-80 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Sliders size={18} /> Configuración de Audio
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Opción 1: Reducción de Ruido */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.ans ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                <Zap size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Reducción de Ruido</p>
                <p className="text-xs text-slate-500">Elimina ruidos de fondo</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('ans')}
              className={`w-10 h-6 rounded-full transition-colors relative ${config.ans ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.ans ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* Opción 2: Cancelación de Eco */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.aec ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                <Mic size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Anti-Eco</p>
                <p className="text-xs text-slate-500">Evita que te escuches</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('aec')}
              className={`w-10 h-6 rounded-full transition-colors relative ${config.aec ? 'bg-green-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.aec ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* Opción 3: Modo Música (Importante para cantar) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.musicMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                <Music size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Modo Música</p>
                <p className="text-xs text-slate-500">Alta calidad para cantar</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('musicMode')}
              className={`w-10 h-6 rounded-full transition-colors relative ${config.musicMode ? 'bg-purple-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.musicMode ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
          Listo
        </button>
      </div>
    </div>
  );
};