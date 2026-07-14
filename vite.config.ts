import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

/**
 * ONJEOM_TARGET:
 *  - electron (default): desktop with electron plugin
 *  - web | android: static SPA only (Capacitor / browser)
 */
const target = process.env.ONJEOM_TARGET || 'electron';
const isStatic = target === 'web' || target === 'android';

export default defineConfig({
  // Always relative so Electron custom protocol + Capacitor resolve assets next to index.html
  // Production Electron loads onjeom://app/index.html → assets at onjeom://app/assets/*
  base: './',
  plugins: [
    react(),
    ...(!isStatic
      ? [
          electron({
            main: {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
            preload: {
              input: 'electron/preload.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  lib: {
                    entry: 'electron/preload.ts',
                    formats: ['cjs'],
                  },
                  rollupOptions: {
                    external: ['electron'],
                    output: {
                      format: 'cjs',
                      entryFileNames: 'preload.cjs',
                      // Ensure require-style for Electron preload
                      inlineDynamicImports: true,
                    },
                  },
                },
              },
            },
            renderer: {},
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: isStatic ? 'es2020' : 'modules',
    assetsDir: 'assets',
  },
  define: {
    __ONJEOM_TARGET__: JSON.stringify(target),
  },
});
