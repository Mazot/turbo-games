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
  /** If true — can only be obtained via roulette, not purchased in shop */
  rouletteOnly?: boolean;
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
  // ── Bathroom (shop) ────────────────────────────────────────────
  { name: 'Bathroom 1',   image: 'assets/bg/bathroom_1.png', cost: 0 },
  { name: 'Bathroom 2',   image: 'assets/bg/bathroom_2.png', cost: 150 },
  { name: 'Bathroom 3',   image: 'assets/bg/bathroom_3.png', cost: 350 },
  { name: 'Bathroom 4',   image: 'assets/bg/bathroom_4.png', cost: 1_000 },
  { name: 'Bathroom 5',   image: 'assets/bg/bathroom_5.png', cost: 3_000 },
  { name: 'Bathroom 6',   image: 'assets/bg/bathroom_6.png', cost: 8_000 },
  { name: 'Bathroom 7',   image: 'assets/bg/bathroom_7.png', cost: 20_000 },
  // ── Bedroom (shop) ─────────────────────────────────────────────
  { name: 'Bedroom',      image: 'assets/bg/bedroom.png',    cost: 40_000 },
  { name: 'Bedroom 3',    image: 'assets/bg/bedroom_3.png',  cost: 80_000 },
  // ── Living room (shop) ─────────────────────────────────────────
  { name: 'Living 1',     image: 'assets/bg/livingroom_1.png', cost: 150_000 },
  { name: 'Living 2',     image: 'assets/bg/livingroom_2.png', cost: 250_000 },
  { name: 'Living 3',     image: 'assets/bg/livingroom_3.png', cost: 450_000 },
  // ── Roulette-only ──────────────────────────────────────────────
  { name: 'Bedroom 4',    image: 'assets/bg/bedroom_4.png',    cost: 0, rouletteOnly: true },
  { name: 'Bedroom 5',    image: 'assets/bg/bedroom_5.png',    cost: 0, rouletteOnly: true },
  { name: 'Kitchen 2',    image: 'assets/bg/kitchen_2.png',    cost: 0, rouletteOnly: true },
  { name: 'Kitchen 3',    image: 'assets/bg/kitchen_3.png',    cost: 0, rouletteOnly: true },
  { name: 'Kitchen 4',    image: 'assets/bg/kitchen_4.png',    cost: 0, rouletteOnly: true },
  { name: 'Kitchen 5',    image: 'assets/bg/kitchen_5.png',    cost: 0, rouletteOnly: true },
  { name: 'Living 4',     image: 'assets/bg/livingroom_4.png', cost: 0, rouletteOnly: true },
  { name: 'Living 5',     image: 'assets/bg/livingroom_5.png', cost: 0, rouletteOnly: true },
  { name: 'Living 6',     image: 'assets/bg/livingroom_6.png', cost: 0, rouletteOnly: true },
  { name: 'Living 7',     image: 'assets/bg/livingroom_7.png', cost: 0, rouletteOnly: true },
  { name: 'Living 8',     image: 'assets/bg/livingroom_8.png', cost: 0, rouletteOnly: true },
  { name: 'Living 9',     image: 'assets/bg/livingroom_9.png', cost: 0, rouletteOnly: true },
  { name: 'Living 10',    image: 'assets/bg/livingroom_10.png', cost: 0, rouletteOnly: true },
  { name: 'Living 11',    image: 'assets/bg/livingroom_11.png', cost: 0, rouletteOnly: true },
  { name: 'Living 12',    image: 'assets/bg/livingroom_12.png', cost: 0, rouletteOnly: true },
  { name: 'Living 13',    image: 'assets/bg/livingroom_13.png', cost: 0, rouletteOnly: true },
  { name: 'Living 14',    image: 'assets/bg/livingroom_14.png', cost: 0, rouletteOnly: true },
  { name: 'Living 15',    image: 'assets/bg/livingroom_15.png', cost: 0, rouletteOnly: true },
  { name: 'Living 16',    image: 'assets/bg/livingroom_16.png', cost: 0, rouletteOnly: true },
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

export type RewardType = 'points' | 'background' | 'autoclick' | 'boost';

export interface RouletteSectorConfig {
  label: string;
  color: string;
  weight: number;
  icon: string;
  /** Optional sprite image URL displayed inside the sector. */
  image?: string;
  reward: number;
  rewardType?: RewardType;
}

export const ROULETTE_SECTORS: RouletteSectorConfig[] = [
  { label: '10', color: '#e74c3c', weight: 28, icon: '✦', reward: 10 },
  { label: '25', color: '#3498db', weight: 22, icon: '✦', reward: 25 },
  { label: '50', color: '#2ecc71', weight: 18, icon: '◆', reward: 50 },
  { label: '100', color: '#9b59b6', weight: 10, icon: '◆', reward: 100 },
  { label: '250', color: '#f39c12', weight: 6, icon: '★', reward: 250 },
  { label: '1K', color: '#e91e63', weight: 2, icon: '♛', reward: 1_000 },
  { label: '×3', color: '#ff6f00', weight: 5, icon: '⚡', reward: 0, rewardType: 'boost' },
  { label: 'AUTO', color: '#00bcd4', weight: 5, icon: '⟳', reward: 0, rewardType: 'autoclick' },
  { label: 'ФОН', color: '#8e24aa', weight: 4, icon: '▣', reward: 0, rewardType: 'background' },
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
