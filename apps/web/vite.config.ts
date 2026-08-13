import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths() // Resolves @spatial/* monorepo aliases on Vercel
  ] as any,
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/xr', 'zustand'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/xr',
      'zustand',
      '@iwer/devui'
    ],
    needsInterop: ['@iwer/devui']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
});