import * as THREE from 'three';
import { GameRenderer, addGameFeature, setTextureBackground, Object3DFeature, KeysInput } from '@turbo-games/renderer';
import type { ModulesRecord , CoreContext} from '@turbo-games/renderer';
import { AdManager } from '@turbo-games/ads';
import { AnalyticsManager } from '@turbo-games/analytics';
import { AudioManager } from '@turbo-games/audio';
import { GameState } from './game-state';
import { GameUI } from './ui/game-ui';
import { CheatsPanel } from './ui/cheats-panel';
import { LevelEditor } from './ui/level-editor';
import { ConfiguratorPanel } from './ui/configurator-panel';
import { PlayerController } from './features/player-controller';
import { EnemyAI } from './features/enemy-ai';
import { WeaponSystem, Projectile } from './features/weapon-system';
import { WaveSystem } from './systems/wave-system';
import { UpgradeSystem } from './systems/upgrade-system';
import { CHARACTERS } from './config/characters';
import { WEAPONS } from './config/weapons';
import { ITEMS } from './config/items';
import { LEVELS } from './config/levels';
import type { EnemyConfig, WeaponConfig, UpgradeOption } from './types';
import { initBrotatoI18n } from './i18n';

async function main() {
  await initBrotatoI18n();

  const container = document.getElementById('root') as HTMLDivElement;

  const game = await GameRenderer.create({
    container,
    fov: 60,
    modules: { keys: new KeysInput() },
  });

  game.camera.position.set(0, 0, 15);
  game.camera.lookAt(0, 0, 0);

  const state = new GameState();
  const adManager = new AdManager();
  const analytics = new AnalyticsManager();
  const audioManager = new AudioManager();
  const ui = new GameUI(state);

  const level = LEVELS[0];
  const waveSystem = new WaveSystem(level.waves);
  const upgradeSystem = new UpgradeSystem();

  await setTextureBackground(game.scene, '/assets/bg/forest.png');

  const charConfig = CHARACTERS.find((c) => c.id === state.selectedCharacter) || CHARACTERS[0];
  const playerSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: 0x00ff00,
      transparent: true,
    })
  );
  playerSprite.position.set(0, 0, 0);
  playerSprite.scale.set(1, 1, 1);

  const playerController = addGameFeature(playerSprite, PlayerController);

  playerController.setStats(state.stats);
  playerController.onTakeDamage = (damage) => {
    const died = state.takeDamage(damage);
    ui.updateHP(state.stats.hp, state.stats.maxHp);
    if (died) {
      handleGameOver();
    }
  };

  game.root.add(playerSprite);

  const weaponSystem = addGameFeature(game.root, WeaponSystem);

  weaponSystem.setTarget(playerSprite);

  for (const weaponId of state.equippedWeapons) {
    const weapon = WEAPONS.find((w) => w.id === weaponId);
    if (weapon) {
      weaponSystem.addWeapon(weapon);
    }
  }

  const enemies: THREE.Sprite[] = [];
  const enemyAIs: EnemyAI[] = [];
  const projectiles: THREE.Sprite[] = [];
  const projectileFeatures: Projectile[] = [];

  let godMode = false;

  function spawnEnemy(enemyConfig: EnemyConfig): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = 12;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    const enemySprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: 0xff0000,
        transparent: true,
      })
    );
    enemySprite.position.set(x, y, 0);
    enemySprite.scale.set(enemyConfig.scale, enemyConfig.scale, 1);

    const enemyAI = addGameFeature(enemySprite, EnemyAI);

    enemyAI.setConfig(enemyConfig);
    enemyAI.setTarget(playerSprite);
    enemyAI.onDeath = (gold, xp) => {
      removeEnemy(enemySprite);
      state.addGold(gold);
      state.events.emit('enemy:death', enemyConfig.id, gold);
    };
    enemyAI.onAttack = (damage) => {
      if (!godMode) {
        playerController.takeDamage(damage);
      }
    };

    enemies.push(enemySprite);
    enemyAIs.push(enemyAI);
    game.root.add(enemySprite);
    state.events.emit('enemy:spawn', enemyConfig.id);
  }

  function removeEnemy(enemySprite: THREE.Sprite): void {
    const index = enemies.indexOf(enemySprite);
    if (index !== -1) {
      enemies.splice(index, 1);
      enemyAIs.splice(index, 1);
      game.root.remove(enemySprite);
    }
  }

  function fireProjectile(weapon: WeaponConfig, direction: THREE.Vector2): void {
    const projectileSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: 0xffff00,
        transparent: true,
      })
    );
    projectileSprite.position.copy(playerSprite.position);
    projectileSprite.scale.set(weapon.projectileScale, weapon.projectileScale, 1);

    const stats = state.stats;
    const damage = weapon.damage + stats.damage;
    const critRoll = Math.random();
    const actualDamage = critRoll < stats.critChance ? damage * stats.critDamage : damage;

    const projectile = addGameFeature(projectileSprite, Projectile);

    projectile.setup(
      actualDamage,
      weapon.piercing + stats.piercing,
      direction,
      weapon.projectileSpeed + stats.projectileSpeed,
    );

    projectile.onRemove = () => {
      const idx = projectiles.indexOf(projectileSprite);
      if (idx !== -1) {
        projectiles.splice(idx, 1);
        projectileFeatures.splice(idx, 1);
        game.root.remove(projectileSprite);
      }
    };

    projectiles.push(projectileSprite);
    projectileFeatures.push(projectile);
    game.root.add(projectileSprite);
  }

  weaponSystem.onFireProjectile = fireProjectile;

  function checkCollisions(): void {
    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];
      const projFeature = projectileFeatures[i];

      if (!projFeature.canHit()) continue;

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const enemyAI = enemyAIs[j];

        const dx = proj.position.x - enemy.position.x;
        const dy = proj.position.y - enemy.position.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.5) {
          const died = enemyAI.takeDamage(projFeature.getDamage());
          projFeature.registerHit();

          const lifesteal = state.stats.lifesteal;
          if (lifesteal > 0) {
            const healAmount = projFeature.getDamage() * lifesteal;
            state.heal(healAmount);
            ui.updateHP(state.stats.hp, state.stats.maxHp);
          }

          if (died) {
            break;
          }

          if (!projFeature.canHit()) {
            break;
          }
        }
      }
    }
  }

  class GameLoop extends Object3DFeature<ModulesRecord> {
    private _regenTimer = 0;

    onBeforeRender(ctx: CoreContext<ModulesRecord>): void {
      weaponSystem.updateEnemies(enemies);
      checkCollisions();
      waveSystem.update(enemies.length);

      this._regenTimer += ctx.deltaTime;
      if (this._regenTimer >= 1) {
        this._regenTimer = 0;
        if (state.stats.regen > 0) {
          state.heal(state.stats.regen);
          ui.updateHP(state.stats.hp, state.stats.maxHp);
        }
      }
    }
  }

  addGameFeature(game.root, GameLoop);

  waveSystem.onSpawnEnemy = (enemyConfig) => {
    spawnEnemy(enemyConfig);
  };

  waveSystem.onWaveComplete = () => {
    const upgrades = upgradeSystem.generateUpgrades(3, waveSystem.getCurrentWaveNumber());
    ui.showUpgradePanel(upgrades);
  };

  ui.onUpgradeSelect = (upgrade: UpgradeOption) => {
    if (upgrade.type === 'item' && upgrade.itemId) {
      const item = ITEMS.find((i) => i.id === upgrade.itemId);
      if (item) {
        for (const effect of item.effects) {
          const currentValue = state.stats[effect.stat];
          if (effect.type === 'add') {
            state.setStat(effect.stat, currentValue + effect.value);
          } else {
            state.setStat(effect.stat, currentValue * (1 + effect.value));
          }
        }
        state.addItem(upgrade.itemId);
      }
    } else if (upgrade.type === 'weapon' && upgrade.weaponId) {
      const weapon = WEAPONS.find((w) => w.id === upgrade.weaponId);
      if (weapon) {
        weaponSystem.addWeapon(weapon);
        state.addWeapon(upgrade.weaponId);
      }
    } else if (upgrade.type === 'stat' && upgrade.statBoost) {
      const boost = upgrade.statBoost;
      const currentValue = state.stats[boost.stat];
      if (boost.type === 'add') {
        state.setStat(boost.stat, currentValue + boost.value);
      } else {
        state.setStat(boost.stat, currentValue * (1 + boost.value));
      }
    }

    playerController.updateStats(state.stats);
    ui.updateHP(state.stats.hp, state.stats.maxHp);

    setTimeout(() => {
      waveSystem.startWave();
    }, 1000);
  };

  function handleGameOver(): void {
    ui.showGameOver(waveSystem.getCurrentWaveNumber(), state.gold);
  }

  ui.onRestart = () => {
    for (const enemy of [...enemies]) {
      removeEnemy(enemy);
    }
    for (const proj of [...projectiles]) {
      const idx = projectiles.indexOf(proj);
      projectiles.splice(idx, 1);
      projectileFeatures.splice(idx, 1);
      game.root.remove(proj);
    }

    state.resetRun();
    playerController.updateStats(state.stats);
    ui.updateHP(state.stats.hp, state.stats.maxHp);
    waveSystem.startWave();
  };

  if (import.meta.env.DEV) {
    const { default: Stats } = await import('three/addons/libs/stats.module.js');
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    class StatsFeature extends Object3DFeature {
      onBeforeRender() {
        stats.update();
      }
    }
    addGameFeature(game.root, StatsFeature);

    const cheats = new CheatsPanel(state);
    cheats.onGodMode = (enabled) => {
      godMode = enabled;
    };
    cheats.onKillAllEnemies = () => {
      for (const enemy of [...enemies]) {
        removeEnemy(enemy);
      }
    };
    cheats.onCompleteWave = () => {
      for (const enemy of [...enemies]) {
        removeEnemy(enemy);
      }
      waveSystem.update(0);
    };

    const levelEditor = new LevelEditor();
    const configurator = new ConfiguratorPanel();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        levelEditor.show();
      } else if (e.key === 'F2') {
        configurator.show();
      }
    });
  }

  setTimeout(() => {
    waveSystem.startWave();
  }, 1000);
}

main();
