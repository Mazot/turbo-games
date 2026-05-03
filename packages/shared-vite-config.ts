import { defineConfig } from 'vite';
import path from 'path';
import type { UserConfig } from 'vite';

/**
 * Create a shared Vite config for a game package.
 * Resolves all @turbo-games/* imports to source files for HMR.
 *
 * @param gameDirname - Pass `import.meta.dirname` (or `__dirname`) from the game's vite.config.ts
 * @param overrides - Additional Vite config merged on top of defaults
 */
export function createGameViteConfig(
  gameDirname: string,
  overrides: UserConfig = {},
): ReturnType<typeof defineConfig> {
  const coreDir = path.resolve(gameDirname, '../../core');

  return defineConfig({
    base: '/turbo-games/',
    server: {
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
    resolve: {
      alias: {
        '@turbo-games/renderer': path.resolve(coreDir, 'renderer/src'),
        '@turbo-games/events': path.resolve(coreDir, 'events/src'),
        '@turbo-games/ads': path.resolve(coreDir, 'ads/src'),
        '@turbo-games/audio': path.resolve(coreDir, 'audio/src'),
        '@turbo-games/physics': path.resolve(coreDir, 'physics/src'),
        '@turbo-games/analytics': path.resolve(coreDir, 'analytics/src'),
        '@turbo-games/multiplayer': path.resolve(coreDir, 'multiplayer/src'),
        '@turbo-games/ui': path.resolve(coreDir, 'ui/src'),
        '@turbo-games/state': path.resolve(coreDir, 'state/src'),
        '@turbo-games/math': path.resolve(coreDir, 'math/src'),
        '@turbo-games/object-pool': path.resolve(coreDir, 'object-pool/src'),
        '@turbo-games/i18n': path.resolve(coreDir, 'i18n/src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
    },
    ...overrides,
  });
}
