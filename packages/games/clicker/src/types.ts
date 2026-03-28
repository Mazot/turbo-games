import type { GameEvents } from '@turbo-games/events';

export interface ClickerEvents extends GameEvents {
  'click': (points: number) => void;
  'score:change': (score: number) => void;
  'asset:change': (index: number) => void;
  'background:change': (index: number) => void;
  'boost:start': (multiplier: number, durationMs: number) => void;
  'unlock:asset': (index: number) => void;
  'unlock:background': (index: number) => void;
}

export interface SaveData {
  score: number;
  currentAsset: number;
  currentBackground: number;
  unlockedAssets: number[];
  unlockedBackgrounds: number[];
  boostEndTime: number;
}
