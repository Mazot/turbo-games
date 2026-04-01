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
      { image: 'assets/char/wolf_1.png', upgradeCost: 0, pointsPerClick: 1 },
      { image: 'assets/char/wolf_2.png', upgradeCost: 100, pointsPerClick: 3 },
      { image: 'assets/char/wolf_3.png', upgradeCost: 500, pointsPerClick: 8 },
      { image: 'assets/char/wolf_4.png', upgradeCost: 2_000, pointsPerClick: 20 },
      { image: 'assets/char/wolf_5.png', upgradeCost: 10_000, pointsPerClick: 50 },
      { image: 'assets/char/wolf_6.png', upgradeCost: 50_000, pointsPerClick: 120 },
    ],
  },
  {
    name: 'Fox',
    unlockCost: 500,
    levels: [
      { image: 'assets/char/fox_1.png', upgradeCost: 0, pointsPerClick: 2 },
      { image: 'assets/char/fox_2.png', upgradeCost: 200, pointsPerClick: 6 },
      { image: 'assets/char/fox_3.png', upgradeCost: 1_000, pointsPerClick: 15 },
      { image: 'assets/char/fox_4.png', upgradeCost: 4_000, pointsPerClick: 40 },
      { image: 'assets/char/fox_5.png', upgradeCost: 20_000, pointsPerClick: 100 },
      { image: 'assets/char/fox_5.png', upgradeCost: 100_000, pointsPerClick: 250 },
    ],
  },
  {
    name: 'Star',
    unlockCost: 2_000,
    levels: [
      { image: 'assets/char/star.svg', upgradeCost: 0, pointsPerClick: 5 },
      { image: 'assets/char/star.svg', upgradeCost: 500, pointsPerClick: 12 },
      { image: 'assets/char/star.svg', upgradeCost: 2_500, pointsPerClick: 30 },
      { image: 'assets/char/star.svg', upgradeCost: 10_000, pointsPerClick: 75 },
      { image: 'assets/char/star.svg', upgradeCost: 50_000, pointsPerClick: 190 },
      { image: 'assets/char/superstar.svg', upgradeCost: 250_000, pointsPerClick: 480 },
    ],
  },
  {
    name: 'Diamond',
    unlockCost: 8_000,
    levels: [
      { image: 'assets/char/diamond.svg', upgradeCost: 0, pointsPerClick: 10 },
      { image: 'assets/char/diamond.svg', upgradeCost: 1_000, pointsPerClick: 25 },
      { image: 'assets/char/diamond.svg', upgradeCost: 5_000, pointsPerClick: 60 },
      { image: 'assets/char/diamond.svg', upgradeCost: 20_000, pointsPerClick: 150 },
      { image: 'assets/char/diamond.svg', upgradeCost: 100_000, pointsPerClick: 380 },
      { image: 'assets/char/crystal.svg', upgradeCost: 500_000, pointsPerClick: 950 },
    ],
  },
  {
    name: 'Crown',
    unlockCost: 30_000,
    levels: [
      { image: 'assets/char/crown.svg', upgradeCost: 0, pointsPerClick: 20 },
      { image: 'assets/char/crown.svg', upgradeCost: 2_000, pointsPerClick: 50 },
      { image: 'assets/char/crown.svg', upgradeCost: 10_000, pointsPerClick: 130 },
      { image: 'assets/char/crown.svg', upgradeCost: 40_000, pointsPerClick: 330 },
      { image: 'assets/char/crown.svg', upgradeCost: 200_000, pointsPerClick: 830 },
      { image: 'assets/char/crown.svg', upgradeCost: 1_000_000, pointsPerClick: 2_000 },
    ],
  },
  {
    name: 'Heart',
    unlockCost: 100_000,
    levels: [
      { image: 'assets/char/heart.svg', upgradeCost: 0, pointsPerClick: 50 },
      { image: 'assets/char/heart.svg', upgradeCost: 5_000, pointsPerClick: 125 },
      { image: 'assets/char/heart.svg', upgradeCost: 25_000, pointsPerClick: 310 },
      { image: 'assets/char/heart.svg', upgradeCost: 100_000, pointsPerClick: 780 },
      { image: 'assets/char/heart.svg', upgradeCost: 500_000, pointsPerClick: 1_950 },
      { image: 'assets/char/heart.svg', upgradeCost: 2_500_000, pointsPerClick: 4_900 },
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
