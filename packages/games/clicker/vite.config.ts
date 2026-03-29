import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/turbo-games/',
  resolve: {
    alias: {
      '@turbo-games/renderer': path.resolve(__dirname, '../../core/renderer/src'),
      '@turbo-games/events': path.resolve(__dirname, '../../core/events/src'),
      '@turbo-games/ads': path.resolve(__dirname, '../../core/ads/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
