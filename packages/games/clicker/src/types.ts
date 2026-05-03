import type { GameEvents } from '@turbo-games/events';

export interface ClickerEvents extends GameEvents {
  click: (points: number) => void;
  'score:change': (score: number) => void;
  'asset:change': (index: number) => void;
  'asset:level:change': (assetIndex: number, level: number) => void;
  'background:change': (index: number) => void;
  'boost:start': (multiplier: number, durationMs: number) => void;
  'unlock:asset': (index: number) => void;
  'unlock:background': (index: number) => void;
  'roulette:open': () => void;
  'roulette:spin': () => void;
  'roulette:reward': (points: number) => void;
  'autoclick:start': (durationMs: number) => void;
  'autoclick:stop': () => void;
}

export interface SaveData {
  score: number;
  currentAsset: number;
  currentBackground: number;
  assetLevels: number[];
  unlockedAssets: number[];
  unlockedBackgrounds: number[];
  boostEndTime: number;
  lastFreeSpinTime: number;
  autoclickEndTime: number;
  tutorialDone: boolean;
}
