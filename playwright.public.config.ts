import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test melawan URL publik yang sudah dideploy (GitHub Pages atau Vercel).
 * Jalankan: npx playwright test --config playwright.public.config.ts
 * URL dapat diubah: E2E_PUBLIC_URL=https://... npx playwright test --config playwright.public.config.ts
 */
const publicUrl = process.env.E2E_PUBLIC_URL ?? 'https://fayyadh678.github.io/TestTrialN4/';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'public.spec.ts',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: publicUrl,
    trace: 'off',
    video: 'off',
  },
  projects: [
    { name: 'public-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'public-mobile', use: { ...devices['Pixel 7'] } },
  ],
});