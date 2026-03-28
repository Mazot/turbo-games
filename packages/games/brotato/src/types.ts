export interface GameEvents {
  'game:start': () => void;
  'game:pause': () => void;
  'game:resume': () => void;
  'game:over': () => void;
  'wave:start': (waveNumber: number) => void;
  'wave:complete': (waveNumber: number) => void;
  'enemy:spawn': (enemyId: string) => void;
  'enemy:death': (enemyId: string, gold: number) => void;
  'player:damage': (damage: number, hp: number) => void;
  'player:heal': (amount: number, hp: number) => void;
  'player:death': () => void;
  'gold:change': (gold: number) => void;
  'upgrade:select': (upgradeId: string) => void;
  'item:add': (itemId: string) => void;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface CharacterStats {
  maxHp: number;
  hp: number;
  speed: number;
  damage: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
  armor: number;
  dodge: number;
  luck: number;
  range: number;
  projectileSpeed: number;
  piercing: number;
  lifesteal: number;
  regen: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  spriteAtlas: string;
  animations: AnimationConfig;
  baseStats: CharacterStats;
}

export interface AnimationConfig {
  idle: AnimationFrames;
  walk: AnimationFrames;
  attack?: AnimationFrames;
  hurt?: AnimationFrames;
  death?: AnimationFrames;
}

export interface AnimationFrames {
  frames: number[];
  frameRate: number;
  loop: boolean;
}

export interface EnemyConfig {
  id: string;
  name: string;
  spriteAtlas: string;
  animations: AnimationConfig;
  hp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  goldDrop: number;
  xpDrop: number;
  scale: number;
}

export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  damage: number;
  attackSpeed: number;
  range: number;
  projectileSpeed: number;
  piercing: number;
  projectileSprite: string;
  projectileScale: number;
  soundEffect?: string;
}

export interface ItemConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  effects: ItemEffect[];
}

export interface ItemEffect {
  stat: keyof CharacterStats;
  value: number;
  type: 'add' | 'multiply';
}

export interface UpgradeOption {
  id: string;
  type: 'item' | 'stat' | 'weapon';
  itemId?: string;
  weaponId?: string;
  statBoost?: ItemEffect;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface WaveConfig {
  waveNumber: number;
  duration: number;
  spawnRate: number;
  enemyTypes: string[];
  enemyWeights: number[];
  maxEnemies: number;
  bossWave?: boolean;
}

export interface LevelConfig {
  id: string;
  name: string;
  background: string;
  waves: WaveConfig[];
  startGold: number;
}

export interface SaveData {
  gold: number;
  currentWave: number;
  currentLevel: string;
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  unlockedItems: string[];
  stats: CharacterStats;
  equippedWeapons: string[];
  inventory: string[];
}
