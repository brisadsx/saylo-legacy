// src/types/pomodoro.types.ts
export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}