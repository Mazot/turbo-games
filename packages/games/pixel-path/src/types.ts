import type { GameEvents } from '@turbo-games/events';

export interface PixelPathEvents extends GameEvents {
  'level:start': (levelIndex: number) => void;
  'level:complete': (levelIndex: number, stars: number) => void;
  'level:fail': (levelIndex: number) => void;
  'ball:goal': () => void;
  'path:draw': () => void;
  'path:erase': () => void;
}

export interface SaveData {
  completedLevels: number[];
  stars: Record<number, number>;
  currentLevel: number;
  unlockedLevels: number[];
}

export interface ObstacleConfig {
  type: 'box' | 'spike' | 'moving-box';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  movePattern?: { dx: number; dy: number; duration: number };
}

export interface LevelConfig {
  name: string;
  groupIndex: number;
  ballStart: { x: number; y: number };
  goalPosition: { x: number; y: number };
  obstacles: ObstacleConfig[];
  maxPathLength: number;
  musicTrack: string;
  backgroundColor: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LevelGroupConfig {
  name: string;
  color: string;
  unlockLevel: number;
}
