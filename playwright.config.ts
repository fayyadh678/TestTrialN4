import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test melawan hasil build (dist) yang disajikan statis.
 * GITHUB_PAGES=true dipakai supaya base path /TestTrialN4/ ikut diuji.
 */
const usePagesBase = process.env.E2E_PAGES_BASE === 'true';
const port = usePagesBase ? 4181 : 4180;

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'public.spec.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}${usePagesBase ? '/TestTrialN4/' : '/'}`,
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
        name: 'tablet',
        use: { ...devices['iPad Mini'], defaultBrowserType: 'chromium' },
    },
      {
        name: 'mobile',
        use: { ...devices['Pixel 7'] },
      },
    ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${port} ${usePagesBase ? 'true' : 'false'}`,
    port,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});