export type ChannelCategory = 'worship' | 'sermon';

export interface ChannelConfig {
  name: string;
  id: string; 
  categories: ChannelCategory[]; // Array: puede ser uno o los dos
  lang: 'es' | 'en';
}

export const CHANNELS_DB: ChannelConfig[] = [
  { 
    name: 'UPPERROOM', 
    id: 'UCCrxpO3RnaL-RbPbmB3TQCw', 
    // CORRECCIÓN: Es válido para AMBOS formatos.
    categories: ['worship', 'sermon'], 
    lang: 'en' 
  },
  { 
    name: 'TTL Iglesia', 
    id: 'UCsveEdvbn73sDTvrxuDAgaA', 
    // CORRECCIÓN: Solo Prédica (evita que salga hablando el pastor cuando pides música)
    categories: ['sermon'], 
    lang: 'es' 
  },
  { 
    name: 'origeniglesia', 
    id: 'UCk7sLgEx-comnXjJ7l3dong', 
    // CORRECCIÓN: Solo Prédica
    categories: ['sermon'], 
    lang: 'es' 
  }
];