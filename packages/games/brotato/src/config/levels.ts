import type { LevelConfig, WaveConfig } from '../types';

function generateWaves(count: number): WaveConfig[] {
  const waves: WaveConfig[] = [];

  for (let i = 1; i <= count; i++) {
    const isBossWave = i % 5 === 0;
    const difficulty = Math.floor((i - 1) / 5);

    const wave: WaveConfig = {
      waveNumber: i,
      duration: isBossWave ? 60_000 : 30_000,
      spawnRate: Math.max(500, 2_000 - difficulty * 200),
      enemyTypes: ['slime', 'goblin'],
      enemyWeights: [60, 40],
      maxEnemies: 15 + difficulty * 5,
      bossWave: isBossWave,
    };

    if (i >= 5) {
      wave.enemyTypes.push('orc');
      wave.enemyWeights = [40, 40, 20];
    }

    if (i >= 10) {
      wave.enemyTypes.push('demon');
      wave.enemyWeights = [30, 30, 25, 15];
    }

    waves.push(wave);
  }

  return waves;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'forest',
    name: 'Dark Forest',
    background: '/assets/bg/forest.png',
    waves: generateWaves(20),
    startGold: 10,
  },
  {
    id: 'desert',
    name: 'Desert Wasteland',
    background: '/assets/bg/desert.png',
    waves: generateWaves(20),
    startGold: 10,
  },
  {
    id: 'dungeon',
    name: 'Ancient Dungeon',
    background: '/assets/bg/dungeon.png',
    waves: generateWaves(20),
    startGold: 10,
  },
];
