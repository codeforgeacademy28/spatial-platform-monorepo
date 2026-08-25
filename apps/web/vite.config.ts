import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const rootThree = fileURLToPath(new URL('../../node_modules/three', import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()] as any,
  server: { host: '0.0.0.0', port: 5173 },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    alias: { three: rootThree },
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/xr'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/xr', 'zustand', '@iwer/devui'],
    needsInterop: ['@iwer/devui'],
  },
  build: { commonjsOptions: { include: [/node_modules/] } },
});
