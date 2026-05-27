import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Wafflerace E2E tests.
 * Focused on smoke tests for the race creation flow.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:9090',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'go run ./cmd/server',
    url: 'http://localhost:9090/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
