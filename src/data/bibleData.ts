// src/data/bibleData.ts
import type { Versiculo } from '../types/Bible';

export const versiculos: Versiculo[] = [
    {
        id: 'jos-1-9',
        texto: '¿No te he mandado que te esfuerces y seas valiente? No temas ni desmayes, porque Jehová tu Dios estará contigo dondequiera que vayas.',
        cita: 'Josué 1:9',
        tags: ['valentía', 'fuerza']
    },
    {
        id: 'sal-23-1',
        texto: 'Jehová es mi pastor; nada me faltará.',
        cita: 'Salmos 23:1',
        tags: ['confianza', 'paz']
    },
    {
        id: 'fil-4-13',
        texto: 'Todo lo puedo en Cristo que me fortalece.',
        cita: 'Filipenses 4:13',
        tags: ['fuerza', 'superación']
    },
    {
        id: 'jer-29-11',
        texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
        cita: 'Jeremías 29:11',
        tags: ['futuro', 'esperanza']
    }
];