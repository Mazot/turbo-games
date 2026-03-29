#!/usr/bin/env node

/**
 * Scaffold a new game under packages/games/<name>/.
 * Usage: node scripts/create-game.js <game-name>
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const name = process.argv[2];
if (!name) {
  console.error('Usage: node scripts/create-game.js <game-name>');
  process.exit(1);
}

const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const gameDir = join(import.meta.dirname, '..', 'packages', 'games', slug);

if (existsSync(gameDir)) {
  console.error(`Error: ${gameDir} already exists`);
  process.exit(1);
}

mkdirSync(join(gameDir, 'src', 'features'), { recursive: true });
mkdirSync(join(gameDir, 'public', 'assets'), { recursive: true });

writeFileSync(
  join(gameDir, 'package.json'),
  JSON.stringify(
    {
      name: `@turbo-games/${slug}`,
      version: '0.0.1',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        '@turbo-games/renderer': 'workspace:*',
        '@turbo-games/events': 'workspace:*',
        '@turbo-games/ads': 'workspace:*',
        '@turbo-games/analytics': 'workspace:*',
        '@turbo-games/ui': 'workspace:*',
        '@turbo-games/state': 'workspace:*',
        '@turbo-games/math': 'workspace:*',
        three: '^0.183.2',
      },
      devDependencies: {
        '@types/three': '^0.183.1',
        typescript: '^6.0.0',
        vite: '^7.0.0',
      },
    },
    null,
    2,
  ) + '\n',
);

writeFileSync(
  join(gameDir, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        outDir: 'dist',
        rootDir: 'src',
        noEmit: true,
        types: ['vite/client'],
      },
      include: ['src'],
    },
    null,
    2,
  ) + '\n',
);

writeFileSync(
  join(gameDir, 'vite.config.ts'),
  `import { createGameViteConfig } from '../../shared-vite-config';

export default createGameViteConfig(import.meta.dirname);
`,
);

writeFileSync(
  join(gameDir, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${slug}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
      #root { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
);

writeFileSync(
  join(gameDir, 'src', 'main.ts'),
  `import { GameRenderer, Object3DFeature, addFeature } from '@turbo-games/renderer';
import { AdManager } from '@turbo-games/ads';
import { AnalyticsManager } from '@turbo-games/analytics';

async function main() {
  const container = document.getElementById('root') as HTMLDivElement;

  const game = await GameRenderer.create({ container, fov: 60 });

  game.camera.position.set(0, 0, 5);
  game.camera.lookAt(0, 0, 0);

  const adManager = new AdManager();
  const analytics = new AnalyticsManager();

  // Dev tools: FPS stats
  if (import.meta.env.DEV) {
    const { default: Stats } = await import('three/addons/libs/stats.module.js');
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    class StatsFeature extends Object3DFeature {
      onBeforeRender() { stats.update(); }
    }
    addFeature(game.root, StatsFeature as Parameters<typeof addFeature>[1]);
  }

  // TODO: Add game logic here
}

main().catch(console.error);
`,
);

console.log(`✅ Created game scaffold at packages/games/${slug}/`);
console.log('   Run: pnpm install && pnpm --filter @turbo-games/' + slug + ' dev');
