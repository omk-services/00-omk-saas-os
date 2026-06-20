import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // D6 #52 (2026-06-19): Pre-compress assets at build time. Vercel CDN
      // serves the smallest variant matching Accept-Encoding. ~20% extra
      // savings on top of gzip alone.
      compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
      compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // D6 #53: split supabase-js out so views that don't touch data
            // still get a small initial bundle.
            if (id.includes('node_modules/@supabase')) return 'supabase';
            return undefined;
          },
        },
      },
    },
  };
});
