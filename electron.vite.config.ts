import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  main: {
    plugins: [tsconfigPaths()],
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [tsconfigPaths(), react(), svgr({ svgrOptions: { icon: true } })],
  },
});
