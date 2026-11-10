import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_PATH || '/',
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/@firebase/firestore/')) return 'firebase-data';
    if (id.includes('/@firebase/auth/')) return 'firebase-auth';
    if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'firebase-core';
    if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) return 'charts';
  } } } },
  test: { environment: 'jsdom', env: { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_AUTH_DOMAIN: '', VITE_FIREBASE_PROJECT_ID: '', VITE_FIREBASE_APP_ID: '' }, setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.{ts,tsx}'], exclude: ['tests/rules.test.ts'] },
}));
