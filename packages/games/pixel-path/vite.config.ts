import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@turbo-games/renderer': path.resolve(__dirname, '../../core/renderer/src'),
      '@turbo-games/physics': path.resolve(__dirname, '../../core/physics/src'),
      '@turbo-games/audio': path.resolve(__dirname, '../../core/audio/src'),
      '@turbo-games/events': path.resolve(__dirname, '../../core/events/src'),
      '@turbo-games/ads': path.resolve(__dirname, '../../core/ads/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
