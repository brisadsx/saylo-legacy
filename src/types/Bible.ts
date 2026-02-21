// src/types/Bible.ts
export interface Versiculo {
  id: string; // identificador único, puede ser generado con UUID
  texto: string;
  cita: string; 
  tags: string[]; // esto nos permite categorizar los versículos (IA podría sugerir tags)
}