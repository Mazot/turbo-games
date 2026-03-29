import { createGameViteConfig } from '../../shared-vite-config';

export default createGameViteConfig(import.meta.dirname, {
  server: {
    port: 5174,
  },
});
