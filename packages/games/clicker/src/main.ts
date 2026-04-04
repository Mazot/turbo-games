import * as THREE from 'three';
import {
  GameRenderer,
  addGameFeature,
  createImageTexture,
  Object3DFeature,
} from '@turbo-games/renderer';
import { AdManager } from '@turbo-games/ads';
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
  const analytics = new AnalyticsManager();
  const MUSIC_PREF_KEY = 'turbo-clicker-music';
  let musicEnabled = localStorage.getItem(MUSIC_PREF_KEY) !== 'false';
  let musicUnlocked = false;

  const audio = new AudioManager();
  audio.register('click', { src: 'assets/sfx/click.wav', volume: 0.5 });
  audio.register('music', { src: MUSIC_CONFIG.src, volume: MUSIC_CONFIG.volume, loop: true });

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

    bgCtx.clearRect(0, 0, screenW, screenH);

    // Layer 1: blurred cover-scaled image (fills bars area)
    const blur = 28;
    bgCtx.save();
    bgCtx.filter = `blur(${blur}px)`;
    let bw: number, bh: number, bx: number, by: number;
    if (scAspect > imgAspect) {
      // Screen wider than image: scale to fit width for cover
      bw = screenW + blur * 4;
      bh = bw / imgAspect;
      bx = -blur * 2;
      by = (screenH - bh) / 2;
    } else {
      // Screen taller than image: scale to fit height for cover
      bh = screenH + blur * 4;
      bw = bh * imgAspect;
      by = -blur * 2;
      bx = (screenW - bw) / 2;
    }
    bgCtx.drawImage(img, bx, by, bw, bh);
    bgCtx.restore();

    // Layer 2: dark overlay over bars
    bgCtx.fillStyle = 'rgba(0,0,0,0.35)';
    bgCtx.fillRect(0, 0, screenW, screenH);

    // Layer 3: sharp fit-to-width image centered vertically
    const scale = screenW / iw;
    const drawH = ih * scale;
    const drawY = (screenH - drawH) / 2;
    bgCtx.drawImage(img, 0, drawY, screenW, drawH);

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

  game.ctx.three.on('resize', (w: number, h: number) => {
    screenW = w;
    screenH = h;
    drawBackground();
  });
  applyBackground(state.currentBackground);

  // Clickable sprite — texture reflects current asset at its current level
  const material = new THREE.SpriteMaterial({
    map: createImageTexture(
      ASSETS[state.currentAsset].levels[state.getAssetLevel(state.currentAsset)].image,
    ),
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, -0.3, 0);
  sprite.scale.set(5, 5, 1);

  /** Reloads the sprite texture to match the active asset and its current level. */
  const updateSpriteTexture = () => {
    const lvl = state.getAssetLevel(state.currentAsset);
    const img = ASSETS[state.currentAsset].levels[lvl].image;
    material.map?.dispose();
    material.map = createImageTexture(img);
    material.needsUpdate = true;
  };

  state.events.on('asset:change', updateSpriteTexture);
  state.events.on('asset:level:change', (assetIndex) => {
    if (assetIndex === state.currentAsset) updateSpriteTexture();
  });
  state.events.on('background:change', (index) => applyBackground(index));

  const clickTarget = addGameFeature(sprite, ClickTarget);
  clickTarget.onClicked = () => {
    audio.play('click');
    const points = state.click();
    ui.showFloatText(points);
  };

  game.root.add(sprite);

  // UI
  const ui = new GameUI(state, adManager, musicEnabled);

  // Wire auto-click effects: play click sound + trigger sprite animation on each auto-click tick,
  // reproducing the same feedback as a real player click.
  ui.onAutoClickEffect = () => {
    audio.play('click');
    clickTarget.triggerClickEffect();
  };

  ui.onMusicToggle = () => {
    musicEnabled = !musicEnabled;
    localStorage.setItem(MUSIC_PREF_KEY, String(musicEnabled));
    if (musicEnabled) {
      if (musicUnlocked) audio.play('music');
    } else {
      audio.stop('music');
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
