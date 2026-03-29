import * as THREE from 'three';
import { GameRenderer, addGameFeature, createImageTexture, Object3DFeature } from '@turbo-games/renderer';
import { AdManager } from '@turbo-games/ads';
import { AnalyticsManager } from '@turbo-games/analytics';
import { GameState } from './game-state';
import { ClickTarget } from './features/click-target';
import { GameUI } from './ui/game-ui';
import { ConfiguratorPanel } from './ui/configurator';
import { ASSETS, BACKGROUNDS_ASSETS } from './config';

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
    img.onload = () => { bgImg = img; drawBackground(); };
    img.src = bg.image;
  }

  game.ctx.three.on('resize', (w: number, h: number) => {
    screenW = w;
    screenH = h;
    drawBackground();
  });
  applyBackground(state.currentBackground);

  // Clickable sprite
  const material = new THREE.SpriteMaterial({
    map: createImageTexture(ASSETS[state.currentAsset].image),
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, -0.3, 0);
  sprite.scale.set(5, 5, 1);

  const clickTarget = addGameFeature(sprite, ClickTarget);
  clickTarget.onClicked = () => {
    const points = state.click();
    ui.showFloatText(points);
  };

  game.root.add(sprite);

  // UI
  const ui = new GameUI(state, adManager, {
    onAssetSelect: (index) => {
      const tex = createImageTexture(ASSETS[index].image);
      material.map?.dispose();
      material.map = tex;
      material.needsUpdate = true;
    },
    onBackgroundSelect: (index) => {
      applyBackground(index);
    },
  });

  if (import.meta.env.DEV) {
    const { default: Stats } = await import('three/addons/libs/stats.module.js');
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    class StatsFeature extends Object3DFeature {
      onBeforeRender() { stats.update(); }
    }
    addGameFeature(game.root, StatsFeature);

    new ConfiguratorPanel({
      getCurrentAsset: () => state.currentAsset,
      getCurrentBackground: () => state.currentBackground,
      onAssetChange: (index) => {
        const tex = createImageTexture(ASSETS[index].image);
        material.map?.dispose();
        material.map = tex;
        material.needsUpdate = true;
      },
      onBackgroundChange: (index) => {
        applyBackground(index);
      },
    });
  }
}

main();
