import { Agent } from 'node:https';
import { defineConfig } from 'vite';
export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420, strictPort: true,
    proxy: {
      '^/game-library/web/catalog\\.json$': {
        target: 'https://apps.b14f.com',
        changeOrigin: true,
        agent: new Agent({ proxyEnv: process.env }),
      },
    },
  },
  build: { target: 'es2022', sourcemap: false },
});
