import * as THREE from 'three';
import { GameRenderer, addFeature, Object3DFeature } from '@turbo-games/renderer';
import { createPhysicsModule } from '@turbo-games/physics';
import { AudioManager } from '@turbo-games/audio';
import { AdManager } from '@turbo-games/ads';
import { GameState } from './game-state';
import { PathDrawing } from './features/path-drawing';
import { Ball } from './features/ball';
import { GameUI } from './ui/game-ui';
import { DevPanel } from './ui/dev-panel';
import { createObstacle, createGoal, createBall, createPathColliders } from './physics-helpers';
import { setupAudio, playMusicForLevel } from './audio-helpers';
import { LEVELS, PHYSICS_CONFIG, GAME_CONFIG } from './config';

async function main() {
  const container = document.getElementById('root') as HTMLDivElement;

  // Physics
  const physics = await createPhysicsModule({
    gravity: PHYSICS_CONFIG.gravity,
  });

  // Renderer
  const game = await GameRenderer.create({
    container,
    fov: GAME_CONFIG.cameraFov,
    modules: { rapier: physics },
  });

  // Camera
  game.camera.position.set(
    GAME_CONFIG.cameraPosition.x,
    GAME_CONFIG.cameraPosition.y,
    GAME_CONFIG.cameraPosition.z,
  );
  game.camera.lookAt(0, 0, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  game.scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  game.scene.add(directionalLight);

  // Services
  const state = new GameState();
  const audioManager = new AudioManager();
  const adManager = new AdManager();
  setupAudio(audioManager);

  // Game objects containers
  let currentLevelObjects: THREE.Group | null = null;
  let ballMesh: THREE.Mesh | null = null;
  let ballFeature: Ball | null = null;
  let pathDrawingFeature: PathDrawing | null = null;
  let pathColliders: THREE.Group | null = null;

  // Path drawing setup
  const pathDrawingContainer = new THREE.Group();
  game.root.add(pathDrawingContainer);
  pathDrawingFeature = addFeature(
    pathDrawingContainer,
    PathDrawing as Parameters<typeof addFeature>[1],
  ) as unknown as PathDrawing;

  function clearLevel(): void {
    if (currentLevelObjects) {
      game.root.remove(currentLevelObjects);
      currentLevelObjects = null;
    }
    if (ballMesh && ballFeature) {
      game.root.remove(ballMesh);
      ballMesh = null;
      ballFeature = null;
    }
    if (pathColliders) {
      game.root.remove(pathColliders);
      pathColliders = null;
    }
    pathDrawingFeature?.clearPath();
  }

  function loadLevel(index: number): void {
    clearLevel();

    const level = LEVELS[index];

    // Background color
    game.scene.background = new THREE.Color(level.backgroundColor);

    // Music
    playMusicForLevel(audioManager, level.musicTrack);

    // Level objects container
    currentLevelObjects = new THREE.Group();
    game.root.add(currentLevelObjects);

    // Create obstacles
    for (const obstacle of level.obstacles) {
      const obstacleMesh = createObstacle(
        obstacle.x,
        obstacle.y,
        obstacle.width ?? 1,
        obstacle.height ?? 1,
        GAME_CONFIG.obstacleColor,
      );
      currentLevelObjects.add(obstacleMesh);
    }

    // Create goal
    const goalMesh = createGoal(
      level.goalPosition.x,
      level.goalPosition.y,
      0.5,
      GAME_CONFIG.goalColor,
    );
    currentLevelObjects.add(goalMesh);

    // Create ball
    ballMesh = createBall(
      level.ballStart.x,
      level.ballStart.y,
      PHYSICS_CONFIG.ballRadius,
      GAME_CONFIG.ballColor,
    );

    ballFeature = addFeature(ballMesh, Ball as Parameters<typeof addFeature>[1]) as unknown as Ball;
    ballFeature.setRadius(PHYSICS_CONFIG.ballRadius);
    ballFeature.setStartPosition(
      new THREE.Vector3(level.ballStart.x, level.ballStart.y, 0),
    );
    ballFeature.setGoalPosition(
      new THREE.Vector3(level.goalPosition.x, level.goalPosition.y, 0),
    );

    ballFeature.onGoalReached = () => {
      audioManager.play('sfx-goal');
      state.completeLevel(index, 3);
      // Show interstitial ad on level complete (every 3 levels)
      if ((index + 1) % 3 === 0) {
        adManager.show('interstitial');
      }
    };

    ballFeature.onFallOff = () => {
      audioManager.play('sfx-fail');
      state.failLevel(index);
    };

    game.root.add(ballMesh);

    // Path drawing setup
    pathDrawingFeature!.setMaxPathLength(level.maxPathLength);
    pathDrawingFeature!.setPathColor(GAME_CONFIG.pathColor);

    pathDrawingFeature!.onPathComplete = (points: THREE.Vector3[]) => {
      audioManager.play('sfx-draw');

      // Create physics colliders for the path
      if (pathColliders) {
        game.root.remove(pathColliders);
      }
      pathColliders = createPathColliders(points, GAME_CONFIG.pathWidth);
      game.root.add(pathColliders);

      // Launch the ball
      ballFeature!.launch();
    };

    pathDrawingFeature!.onPathClear = () => {
      audioManager.play('sfx-erase');
      if (pathColliders) {
        game.root.remove(pathColliders);
        pathColliders = null;
      }
    };
  }

  // UI
  const ui = new GameUI(state, adManager, {
    onLevelSelect: (index) => {
      audioManager.play('sfx-click');
      state.selectLevel(index);
      loadLevel(index);
    },
    onRestart: () => {
      audioManager.play('sfx-click');
      loadLevel(state.currentLevel);
      ballFeature?.reset();
      pathDrawingFeature?.clearPath();
    },
    onNextLevel: () => {
      audioManager.play('sfx-click');
      if (state.nextLevel()) {
        loadLevel(state.currentLevel);
      }
    },
    onBackToMenu: () => {
      audioManager.play('sfx-click');
      clearLevel();
    },
  });

  // DEV mode
  if (import.meta.env.DEV) {
    const { default: Stats } = await import('three/addons/libs/stats.module.js');
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    class StatsFeature extends Object3DFeature {
      onBeforeRender() {
        stats.update();
      }
    }
    addFeature(game.root, StatsFeature as Parameters<typeof addFeature>[1]);

    new DevPanel(state, {
      onLevelChange: (index) => {
        state.selectLevel(index);
        loadLevel(index);
      },
      onMusicChange: (track) => {
        playMusicForLevel(audioManager, track);
      },
      onUnlockAll: () => {
        state.unlockAllLevels();
      },
      onCompleteAll: () => {
        state.completeAllLevels();
      },
      onResetProgress: () => {
        state.resetProgress();
      },
    });
  }
}

main();
