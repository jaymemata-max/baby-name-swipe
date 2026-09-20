import { defineConfig, devices } from '@playwright/test';

const runLocalSupabase = process.env.E2E_LOCAL_SUPABASE === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: runLocalSupabase
    ? {
        command: 'npm run dev',
        url: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
