import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths() // Resolves workspace imports (@spatial/*) on Vercel
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    resolve: {
        dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/xr'],
        alias: {
            'react': fileURLToPath(new URL('../../node_modules/react', import.meta.url)),
            'react-dom': fileURLToPath(new URL('../../node_modules/react-dom', import.meta.url)),
            'three': fileURLToPath(new URL('../../node_modules/three', import.meta.url)),
            '@react-three/fiber': fileURLToPath(new URL('../../node_modules/@react-three/fiber', import.meta.url))
        }
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'three',
            '@react-three/fiber',
            '@react-three/xr',
            'zustand'
        ]
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/]
        }
    }
});
//# sourceMappingURL=vite.config.js.map