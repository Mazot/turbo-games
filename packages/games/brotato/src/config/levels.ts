import type { LevelConfig, WaveConfig } from '../types';

/** Pre-computed wave progression used by all levels (20 waves) */
const STANDARD_WAVES: WaveConfig[] = [
  // --- Difficulty 0 (waves 1–4) ---
  { waveNumber: 1, duration: 30_000, spawnRate: 2_000, enemyTypes: ['slime', 'goblin'], enemyWeights: [60, 40], maxEnemies: 15 },
  { waveNumber: 2, duration: 30_000, spawnRate: 2_000, enemyTypes: ['slime', 'goblin'], enemyWeights: [60, 40], maxEnemies: 15 },
  { waveNumber: 3, duration: 30_000, spawnRate: 2_000, enemyTypes: ['slime', 'goblin'], enemyWeights: [60, 40], maxEnemies: 15 },
  { waveNumber: 4, duration: 30_000, spawnRate: 2_000, enemyTypes: ['slime', 'goblin'], enemyWeights: [60, 40], maxEnemies: 15 },
  // --- Boss wave 5 (+orc) ---
  { waveNumber: 5, duration: 60_000, spawnRate: 2_000, enemyTypes: ['slime', 'goblin', 'orc'], enemyWeights: [40, 40, 20], maxEnemies: 15, bossWave: true },
  // --- Difficulty 1 (waves 6–9) ---
  { waveNumber: 6, duration: 30_000, spawnRate: 1_800, enemyTypes: ['slime', 'goblin', 'orc'], enemyWeights: [40, 40, 20], maxEnemies: 20 },
  { waveNumber: 7, duration: 30_000, spawnRate: 1_800, enemyTypes: ['slime', 'goblin', 'orc'], enemyWeights: [40, 40, 20], maxEnemies: 20 },
  { waveNumber: 8, duration: 30_000, spawnRate: 1_800, enemyTypes: ['slime', 'goblin', 'orc'], enemyWeights: [40, 40, 20], maxEnemies: 20 },
  { waveNumber: 9, duration: 30_000, spawnRate: 1_800, enemyTypes: ['slime', 'goblin', 'orc'], enemyWeights: [40, 40, 20], maxEnemies: 20 },
  // --- Boss wave 10 (+demon) ---
  { waveNumber: 10, duration: 60_000, spawnRate: 1_800, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 20, bossWave: true },
  // --- Difficulty 2 (waves 11–14) ---
  { waveNumber: 11, duration: 30_000, spawnRate: 1_600, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 25 },
  { waveNumber: 12, duration: 30_000, spawnRate: 1_600, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 25 },
  { waveNumber: 13, duration: 30_000, spawnRate: 1_600, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 25 },
  { waveNumber: 14, duration: 30_000, spawnRate: 1_600, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 25 },
  // --- Boss wave 15 ---
  { waveNumber: 15, duration: 60_000, spawnRate: 1_600, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 25, bossWave: true },
  // --- Difficulty 3 (waves 16–19) ---
  { waveNumber: 16, duration: 30_000, spawnRate: 1_400, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 30 },
  { waveNumber: 17, duration: 30_000, spawnRate: 1_400, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 30 },
  { waveNumber: 18, duration: 30_000, spawnRate: 1_400, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 30 },
  { waveNumber: 19, duration: 30_000, spawnRate: 1_400, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 30 },
  // --- Boss wave 20 ---
  { waveNumber: 20, duration: 60_000, spawnRate: 1_400, enemyTypes: ['slime', 'goblin', 'orc', 'demon'], enemyWeights: [30, 30, 25, 15], maxEnemies: 30, bossWave: true },
];

export const LEVELS: LevelConfig[] = [
  {
    id: 'forest',
    name: 'Dark Forest',
    background: '/assets/bg/forest.png',
    waves: STANDARD_WAVES,
    startGold: 10,
  },
  {
    id: 'desert',
    name: 'Desert Wasteland',
    background: '/assets/bg/desert.png',
    waves: STANDARD_WAVES,
    startGold: 10,
  },
  {
    id: 'dungeon',
    name: 'Ancient Dungeon',
    background: '/assets/bg/dungeon.png',
    waves: STANDARD_WAVES,
    startGold: 10,
  },
];
