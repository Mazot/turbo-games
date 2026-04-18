/** Config for a single upgrade level of an asset. */
export interface AssetLevelConfig {
  /** Sprite image path at this level. */
  image: string;
  /** Cost in points to upgrade from the previous level. 0 for level 0. */
  upgradeCost: number;
  /** Points awarded per click at this level. */
  pointsPerClick: number;
}

/** Config for a clickable asset with 6 upgrade levels. */
export interface AssetConfig {
  /** Display name of the asset. */
  name: string;
  /** Cost in points to unlock. 0 for the default starting asset. */
  unlockCost: number;
  /** Exactly 6 upgrade levels; index 0 is the free starting level. */
  levels: AssetLevelConfig[];
}

export interface BackgroundAssetConfig {
  name: string;
  image: string;
  cost: number;
}

export const ASSETS: AssetConfig[] = [
  {
    name: 'Wolf',
    unlockCost: 0,
    levels: [
      { image: 'assets/char/wolf_1.png', upgradeCost: 0, pointsPerClick: 2 },
      { image: 'assets/char/wolf_2.png', upgradeCost: 100, pointsPerClick: 4 },
      { image: 'assets/char/wolf_3.png', upgradeCost: 400, pointsPerClick: 7 },
      { image: 'assets/char/wolf_4.png', upgradeCost: 1_500, pointsPerClick: 12 },
      { image: 'assets/char/wolf_5.png', upgradeCost: 5_000, pointsPerClick: 20 },
    ],
  },
  {
    name: 'Fox',
    unlockCost: 300,
    levels: [
      { image: 'assets/char/fox_1.png', upgradeCost: 0, pointsPerClick: 5 },
      { image: 'assets/char/fox_2.png', upgradeCost: 200, pointsPerClick: 8 },
      { image: 'assets/char/fox_3.png', upgradeCost: 800, pointsPerClick: 13 },
      { image: 'assets/char/fox_4.png', upgradeCost: 3_000, pointsPerClick: 22 },
      { image: 'assets/char/fox_5.png', upgradeCost: 10_000, pointsPerClick: 35 },
    ],
  },
  {
    name: 'Rabbit',
    unlockCost: 1_500,
    levels: [
      { image: 'assets/char/rabbit_1.png', upgradeCost: 0, pointsPerClick: 8 },
      { image: 'assets/char/rabbit_2.png', upgradeCost: 500, pointsPerClick: 13 },
      { image: 'assets/char/rabbit_3.png', upgradeCost: 2_000, pointsPerClick: 22 },
      { image: 'assets/char/rabbit_4.png', upgradeCost: 7_000, pointsPerClick: 35 },
      { image: 'assets/char/rabbit_5.png', upgradeCost: 25_000, pointsPerClick: 55 },
    ],
  },
  {
    name: 'Deer',
    unlockCost: 5_000,
    levels: [
      { image: 'assets/char/deer_1.png', upgradeCost: 0, pointsPerClick: 13 },
      { image: 'assets/char/deer_2.png', upgradeCost: 1_500, pointsPerClick: 22 },
      { image: 'assets/char/deer_3.png', upgradeCost: 5_000, pointsPerClick: 35 },
      { image: 'assets/char/deer_4.png', upgradeCost: 15_000, pointsPerClick: 55 },
      { image: 'assets/char/deer_5.png', upgradeCost: 50_000, pointsPerClick: 80 },
    ],
  },
  {
    name: 'Cat',
    unlockCost: 15_000,
    levels: [
      { image: 'assets/char/cat_1.png', upgradeCost: 0, pointsPerClick: 22 },
      { image: 'assets/char/cat_2.png', upgradeCost: 4_000, pointsPerClick: 35 },
      { image: 'assets/char/cat_3.png', upgradeCost: 12_000, pointsPerClick: 55 },
      { image: 'assets/char/cat_4.png', upgradeCost: 35_000, pointsPerClick: 80 },
      { image: 'assets/char/cat_5.png', upgradeCost: 100_000, pointsPerClick: 120 },
    ],
  },
  {
    name: 'Bird',
    unlockCost: 40_000,
    levels: [
      { image: 'assets/char/bird_1.png', upgradeCost: 0, pointsPerClick: 35 },
      { image: 'assets/char/bird_2.png', upgradeCost: 10_000, pointsPerClick: 55 },
      { image: 'assets/char/bird_3.png', upgradeCost: 30_000, pointsPerClick: 80 },
      { image: 'assets/char/bird_4.png', upgradeCost: 80_000, pointsPerClick: 120 },
      { image: 'assets/char/bird_5.png', upgradeCost: 200_000, pointsPerClick: 170 },
    ],
  },
  {
    name: 'Snake',
    unlockCost: 100_000,
    levels: [
      { image: 'assets/char/snake_1.png', upgradeCost: 0, pointsPerClick: 55 },
      { image: 'assets/char/snake_2.png', upgradeCost: 25_000, pointsPerClick: 80 },
      { image: 'assets/char/snake_3.png', upgradeCost: 70_000, pointsPerClick: 120 },
      { image: 'assets/char/snake_4.png', upgradeCost: 200_000, pointsPerClick: 170 },
      { image: 'assets/char/snake_5.png', upgradeCost: 500_000, pointsPerClick: 240 },
    ],
  },
  {
    name: 'Dragon',
    unlockCost: 300_000,
    levels: [
      { image: 'assets/char/dragon_1.png', upgradeCost: 0, pointsPerClick: 80 },
      { image: 'assets/char/dragon_2.png', upgradeCost: 60_000, pointsPerClick: 120 },
      { image: 'assets/char/dragon_3.png', upgradeCost: 150_000, pointsPerClick: 170 },
      { image: 'assets/char/dragon_4.png', upgradeCost: 400_000, pointsPerClick: 240 },
      { image: 'assets/char/dragon_5.png', upgradeCost: 1_000_000, pointsPerClick: 350 },
    ],
  },
];

export const BACKGROUNDS_ASSETS: BackgroundAssetConfig[] = [
  { name: 'Darkness', image: 'assets/bg/bathroom_1.png', cost: 0 },
  { name: 'Sunset', image: 'assets/bg/bathroom_2.png', cost: 200 },
  { name: 'Ocean', image: 'assets/bg/bathroom_3.png', cost: 1_000 },
  { name: 'Forest', image: 'assets/bg/bathroom_4.png', cost: 5_000 },
  { name: 'Galaxy', image: 'assets/bg/bathroom_5.png', cost: 25_000 },
  { name: 'Dawn', image: 'assets/bg/bathroom_6.png', cost: 100_000 },
];

export const BOOST_CONFIG = {
  multiplier: 3,
  durationMs: 30_000,
  cost: 500,
};

export const AUTOCLICK_CONFIG = {
  durationMs: 60_000,
  clicksPerSecond: 5,
  cost: 1_000,
};

export interface RouletteSectorConfig {
  label: string;
  color: string;
  weight: number;
  icon: string;
  /** Optional sprite image URL displayed inside the sector. */
  image?: string;
  reward: number;
}

export const ROULETTE_SECTORS: RouletteSectorConfig[] = [
  { label: '10', color: '#e74c3c', weight: 30, icon: '⭐', reward: 10 },
  { label: '25', color: '#3498db', weight: 25, icon: '⭐', reward: 25 },
  { label: '50', color: '#2ecc71', weight: 20, icon: '💎', reward: 50 },
  { label: '100', color: '#9b59b6', weight: 12, icon: '💎', reward: 100 },
  { label: '250', color: '#f39c12', weight: 8, icon: '🔥', reward: 250 },
  { label: '500', color: '#1abc9c', weight: 4, icon: '🔥', reward: 500 },
  { label: '1K', color: '#e91e63', weight: 1, icon: '👑', reward: 1_000 },
];

export const ROULETTE_CONFIG = {
  spinDurationMs: 4_000,
  spinRevolutions: 5,
  wheelSize: 280,
  freeSpinCooldownMs: 300_000,
  spinCost: 100,
};

export const MUSIC_CONFIG = {
  src: 'assets/sfx/music.mp3',
  volume: 0.3,
};
