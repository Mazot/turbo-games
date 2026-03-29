export interface AssetConfig {
  name: string;
  image: string;
  cost: number;
  pointsPerClick: number;
}

export interface BackgroundAssetConfig {
  name: string;
  image: string;
  cost: number;
}

export const ASSETS: AssetConfig[] = [
  { name: 'Star', image: 'assets/char/wolf_1.png', cost: 0, pointsPerClick: 1 },
  { name: 'Diamond', image: 'assets/char/wolf_2.png', cost: 100, pointsPerClick: 2 },
  { name: 'Heart', image: 'assets/char/wolf_3.png', cost: 500, pointsPerClick: 5 },
  { name: 'Crown', image: 'assets/char/wolf_4.png', cost: 2_000, pointsPerClick: 12 },
  { name: 'Crystal', image: 'assets/char/wolf_5.png', cost: 10_000, pointsPerClick: 30 },
  { name: 'Superstar', image: 'assets/char/wolf_6.png', cost: 50_000, pointsPerClick: 80 },
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
