import * as THREE from 'three';
import {
  GameRenderer,
  addGameFeature,
  createImageTexture,
  Object3DFeature,
} from '@turbo-games/renderer';
import { AdManager, YandexAdsProvider } from '@turbo-games/ads';
import { AnalyticsManager } from '@turbo-games/analytics';
import { AudioManager } from '@turbo-games/audio';
import { GameState } from './game-state';
import { ClickTarget } from './features/click-target';
import { GameUI } from './ui/game-ui';
import { ConfiguratorPanel } from './ui/configurator';
import { ASSETS, BACKGROUNDS_ASSETS, MUSIC_CONFIG } from './config';

async function main() {
  const container = document.getElementById('root') as HTMLDivElement;

  const game = await GameRenderer.create({
    container,
    fov: 60,
  });

  // Camera
  game.camera.position.set(0, 0, 5);
  game.camera.lookAt(0, 0, 0);

  // State & services
  const state = new GameState();
  const adManager = new AdManager();
  adManager.setProvider(new YandexAdsProvider(), { appId: '', testMode: import.meta.env.DEV });
  const analytics = new AnalyticsManager();
  const MUSIC_PREF_KEY = 'turbo-clicker-music';
  let musicEnabled = localStorage.getItem(MUSIC_PREF_KEY) !== 'false';
  let musicUnlocked = false;

  const audio = new AudioManager();
  audio.register('click', { src: 'assets/sfx/click.wav', volume: 0.5 });
  audio.register('music', { src: MUSIC_CONFIG.src, volume: MUSIC_CONFIG.volume, loop: true });

  // Apply saved mute preference immediately (before first gesture)
  if (!musicEnabled) audio.mute(true);

  function tryPlayMusic() {
    musicUnlocked = true;
    if (musicEnabled) audio.play('music');
  }

  // Browser requires a user gesture before playing audio
  document.addEventListener('pointerdown', tryPlayMusic, { once: true });

  // Background — fit-to-width with blurred bars
  // WebGPU creates the GPU texture once at the canvas size on first upload —
  // so we must never change canvas dimensions after that. We recreate the
  // CanvasTexture whenever the screen size changes.
  const bgCanvas = document.createElement('canvas');
  const bgCtx = bgCanvas.getContext('2d')!;

  let bgImg: HTMLImageElement | null = null;
  let screenW = container.offsetWidth || 1;
  let screenH = container.offsetHeight || 1;
  let currentBgTex: THREE.CanvasTexture | null = null;

  function ensureBgTexture() {
    if (currentBgTex && bgCanvas.width === screenW && bgCanvas.height === screenH) return;
    currentBgTex?.dispose();
    bgCanvas.width = screenW;
    bgCanvas.height = screenH;
    currentBgTex = new THREE.CanvasTexture(bgCanvas);
    currentBgTex.colorSpace = THREE.SRGBColorSpace;
    game.scene.background = currentBgTex;
  }

  function drawBackground() {
    if (!bgImg) return;
    ensureBgTexture();

    const img = bgImg;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const imgAspect = iw / ih;
    const scAspect = screenW / screenH;

    // Clear to black (visible as bars when screen is wider than image)
    bgCtx.fillStyle = '#000';
    bgCtx.fillRect(0, 0, screenW, screenH);

    let dw: number, dh: number, dx: number, dy: number;

    if (scAspect <= imgAspect) {
      // Screen narrower than image: fit to height, crop width
      dh = screenH;
      dw = dh * imgAspect;
      dx = (screenW - dw) / 2; // center horizontally (crops sides)
      dy = 0;
    } else {
      // Screen wider than image: fit to width, black bars top/bottom
      dw = screenW;
      dh = dw / imgAspect;
      dx = 0;
      dy = (screenH - dh) / 2; // center vertically
    }

    bgCtx.drawImage(img, dx, dy, dw, dh);
    currentBgTex!.needsUpdate = true;
  }

  function applyBackground(index: number) {
    const bg = BACKGROUNDS_ASSETS[index];
    const img = new Image();
    img.onload = () => {
      bgImg = img;
      drawBackground();
    };
    img.src = bg.image;
  }

  // Sprite occupies 70% of visible screen height, bottom-aligned to the screen edge.
  const SPRITE_SCREEN_RATIO = 0.7;

  function getVisibleHeight(): number {
    const fovRad = (game.camera.fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * game.camera.position.z;
  }

  function getSpriteHeight(): number {
    return getVisibleHeight() * SPRITE_SCREEN_RATIO;
  }

  /** Returns the Y position that places the sprite's bottom edge at the screen bottom. */
  function getSpriteBottomY(spriteH: number): number {
    return -getVisibleHeight() / 2 + spriteH / 2;
  }

  let clickTarget: ClickTarget | null = null;
  let sprite: THREE.Sprite | null = null;

  /** Recalculates and applies sprite scale + position from the current frustum size. */
  function applySpriteLayout(): void {
    if (!sprite) return;
    const h = getSpriteHeight();
    sprite.scale.set(h, h, 1);
    sprite.position.y = getSpriteBottomY(h);
    clickTarget?.setBaseScale(h, h);
  }

  game.ctx.three.on('resize', (w: number, h: number) => {
    screenW = w;
    screenH = h;
    drawBackground();
    applySpriteLayout();
  });
  applyBackground(state.currentBackground);

  const initH = getSpriteHeight();

  const material = new THREE.SpriteMaterial({
    map: createImageTexture(
      ASSETS[state.currentAsset].levels[state.getAssetLevel(state.currentAsset)].image,
      1024,
      () => applySpriteLayout(),
    ),
    transparent: true,
  });

  sprite = new THREE.Sprite(material);
  sprite.scale.set(initH, initH, 1);
  sprite.position.set(0, getSpriteBottomY(initH), 0);

  /** Reloads the sprite texture to match the active asset and its current level. */
  const updateSpriteTexture = () => {
    const lvl = state.getAssetLevel(state.currentAsset);
    const img = ASSETS[state.currentAsset].levels[lvl].image;
    material.map?.dispose();
    material.map = createImageTexture(img, 1024, () => applySpriteLayout());
    material.needsUpdate = true;
  };

  state.events.on('asset:change', updateSpriteTexture);
  state.events.on('asset:level:change', (assetIndex) => {
    if (assetIndex === state.currentAsset) updateSpriteTexture();
  });
  state.events.on('background:change', (index) => applyBackground(index));

  clickTarget = addGameFeature(sprite, ClickTarget);
  clickTarget.onClicked = () => {
    audio.play('click');
    const points = state.click();
    const feverMulti = ui.registerClick();
    // Award bonus clicks from fever (extra points, no extra state.click())
    const totalPoints = points * feverMulti;
    if (feverMulti > 1) {
      // Add the extra points directly to score
      for (let i = 1; i < feverMulti; i++) {
        state.click();
      }
    }
    ui.showFloatText(totalPoints);
  };

  game.root.add(sprite);

  // UI
  const ui = new GameUI(state, adManager, musicEnabled);

  // Wire auto-click effects: play click sound + trigger sprite animation on each auto-click tick,
  // reproducing the same feedback as a real player click.
  ui.onAutoClickEffect = () => {
    audio.play('click');
    clickTarget?.triggerClickEffect();
  };

  ui.onMusicToggle = () => {
    musicEnabled = !musicEnabled;
    localStorage.setItem(MUSIC_PREF_KEY, String(musicEnabled));
    audio.mute(!musicEnabled);
    if (musicEnabled && !musicUnlocked) {
      musicUnlocked = true;
      audio.play('music');
    }
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

    new ConfiguratorPanel(state, updateSpriteTexture, (index) => {
      if (state.currentBackground === index) applyBackground(index);
    });
  }
}

main();
