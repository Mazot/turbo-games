import type { CharacterConfig, CharacterStats } from '../types';

const DEFAULT_STATS: CharacterStats = {
  maxHp: 100,
  hp: 100,
  speed: 3,
  damage: 10,
  attackSpeed: 1,
  critChance: 0.05,
  critDamage: 1.5,
  armor: 0,
  dodge: 0,
  luck: 0,
  range: 5,
  projectileSpeed: 8,
  piercing: 0,
  lifesteal: 0,
  regen: 0,
};

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'potato',
    name: 'Potato',
    description: 'A balanced character with no special abilities',
    spriteAtlas: '/assets/characters/potato.png',
    animations: {
      idle: { frames: [0], frameRate: 0, loop: true },
      walk: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    },
    baseStats: { ...DEFAULT_STATS },
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'High HP and armor, slower movement',
    spriteAtlas: '/assets/characters/warrior.png',
    animations: {
      idle: { frames: [0], frameRate: 0, loop: true },
      walk: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    },
    baseStats: {
      ...DEFAULT_STATS,
      maxHp: 150,
      hp: 150,
      armor: 5,
      speed: 2.5,
    },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Increased range and projectile speed',
    spriteAtlas: '/assets/characters/ranger.png',
    animations: {
      idle: { frames: [0], frameRate: 0, loop: true },
      walk: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    },
    baseStats: {
      ...DEFAULT_STATS,
      range: 8,
      projectileSpeed: 12,
      damage: 8,
    },
  },
];
