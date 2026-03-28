# Brotato Clone

A top-down arena survival game inspired by Brotato, built with the turbo-games framework.

## Features

- **Wave-based survival gameplay**: Fight increasingly difficult waves of enemies
- **Character progression**: Upgrade your character between waves with new items, weapons, and stat boosts
- **Configurable systems**: All game elements (characters, enemies, weapons, items, levels) are configurable
- **Sprite animations**: Character and enemy animations using sprite sheets
- **Auto-shooting weapons**: Multiple weapons that automatically target and fire at enemies
- **Dev tools**: Built-in cheats panel, level editor, and configuration viewer

## Controls

### Gameplay
- **WASD** or **Arrow Keys**: Move character
- Weapons automatically fire at nearby enemies

### Dev Mode (Development build only)
- **F1**: Open level editor
- **F2**: Open configurator panel
- **Cheats Panel** (visible in top-right):
  - Add gold
  - Heal to full HP
  - Kill all enemies
  - Complete current wave
  - Increase stats
  - God mode toggle

## Game Mechanics

### Character Stats
- **HP**: Health points - die when it reaches zero
- **Speed**: Movement speed
- **Damage**: Base damage for all weapons
- **Attack Speed**: How fast weapons fire
- **Critical Chance**: Chance to deal critical damage
- **Critical Damage**: Multiplier for critical hits
- **Armor**: Reduces incoming damage
- **Dodge**: Chance to avoid damage completely
- **Range**: Maximum weapon range
- **Piercing**: Number of enemies projectiles can pierce through
- **Lifesteal**: Percentage of damage healed
- **Regeneration**: HP recovered per second

### Waves
- Waves increase in difficulty as you progress
- Each wave lasts 30-60 seconds depending on configuration
- More and stronger enemies spawn as waves progress
- Boss waves occur every 5 waves

### Upgrades
- Choose 1 of 3 upgrades after completing each wave
- Upgrade types:
  - **Items**: Permanent stat boosts
  - **Weapons**: Add new weapons to your arsenal (max 6)
  - **Stat Boosts**: Direct increases to character stats

### Enemies
- **Slime**: Weak, slow basic enemy
- **Goblin**: Faster enemy with moderate health
- **Orc**: Tanky, high-damage enemy
- **Demon**: Fast and deadly boss-type enemy

## Configuration

All game elements are configurable through TypeScript files in `src/config/`:

- **characters.ts**: Character definitions and base stats
- **enemies.ts**: Enemy types, stats, and behavior
- **weapons.ts**: Weapon definitions and projectile properties
- **items.ts**: Items and their stat effects
- **levels.ts**: Level configurations and wave definitions

### Creating Custom Content

#### Adding a New Character
Edit `src/config/characters.ts`:
```typescript
{
  id: 'my_character',
  name: 'My Character',
  description: 'Custom character description',
  spriteAtlas: '/assets/characters/my_character.png',
  animations: {
    idle: { frames: [0], frameRate: 0, loop: true },
    walk: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
  },
  baseStats: {
    // ... customize stats
  },
}
```

#### Adding a New Enemy
Edit `src/config/enemies.ts` - follow the same pattern as existing enemies.

#### Adding a New Weapon
Edit `src/config/weapons.ts` - configure damage, attack speed, range, and projectile properties.

#### Adding New Items
Edit `src/config/items.ts` - define stat effects and item tiers.

### Using the Editors (Dev Mode)

#### Level Editor (F1)
- Edit level properties (ID, name, background)
- Configure waves (duration, spawn rate, enemy types)
- Add/remove waves
- Export configuration to console

#### Configurator Panel (F2)
- View all items, weapons, enemies, and characters
- Export configurations to console for copy/paste

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

The game runs on http://localhost:5174 by default.

## Asset Requirements

Place your game assets in `public/assets/`:

```
public/assets/
├── bg/
│   ├── forest.png
│   ├── desert.png
│   └── dungeon.png
├── characters/
│   ├── potato.png
│   ├── warrior.png
│   └── ranger.png
├── enemies/
│   ├── slime.png
│   ├── goblin.png
│   ├── orc.png
│   └── demon.png
├── weapons/
│   ├── stick.png
│   ├── sword.png
│   └── ...
└── ui/
    └── ... (item icons, etc.)
```

For sprite animations, use sprite sheets with frames arranged in a grid. Configure frame counts in the character/enemy config files.

## Architecture

- **Features**: Object3DFeature components for behaviors (animation, AI, weapons)
- **Systems**: Game systems for wave management, upgrades
- **UI**: HTML-based UI overlays
- **State**: Centralized game state with event bus
- **Config**: Data-driven configuration for all game elements

## Future Enhancements

- Sprite sheet texture support (currently using colored sprites as placeholders)
- Sound effects and background music
- Physics-based collision detection (Rapier integration)
- Particle effects
- More enemy variety
- Meta-progression system
- Multiple playable characters
- Save/load system for runs
