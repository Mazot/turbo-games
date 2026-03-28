import * as THREE from 'three';
import { GameRenderer, addFeature, Object3DFeature } from '@turbo-games/renderer';
import { AdManager } from '@turbo-games/ads';
import { GameState } from './game-state';
import { ClickTarget } from './features/click-target';
import { GameUI } from './ui/game-ui';
import { ConfiguratorPanel } from './ui/configurator';
import { createImageTexture } from './textures';
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

  // Background
  applyBackground(state.currentBackground);

  // Clickable sprite
  const material = new THREE.SpriteMaterial({
    map: createImageTexture(ASSETS[state.currentAsset].image),
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.5, 2.5, 1);

  // kvy-core types target TS5; cast needed for TS6 compat
  const clickTarget = addFeature(sprite, ClickTarget as Parameters<typeof addFeature>[1]) as unknown as ClickTarget;
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

  function applyBackground(index: number) {
    const bg = BACKGROUNDS_ASSETS[index];
    const oldBg = game.scene.background;
    if (oldBg instanceof THREE.Texture) oldBg.dispose();
    game.scene.background = createImageTexture(bg.image);
  }

  if (import.meta.env.DEV) {
    const { default: Stats } = await import('three/addons/libs/stats.module.js');
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    class StatsFeature extends Object3DFeature {
      onBeforeRender() { stats.update(); }
    }
    addFeature(game.root, StatsFeature as Parameters<typeof addFeature>[1]);

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
