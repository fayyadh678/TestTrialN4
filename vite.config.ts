/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Di GitHub Pages project path adalah /TestTrialN4/; di Vercel path /.
  base: process.env.GITHUB_PAGES === 'true' ? '/TestTrialN4/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
        setupFiles: ['tests/setup.ts'],
  },
});