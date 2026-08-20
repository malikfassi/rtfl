import { defineConfig, devices } from '@playwright/test';

// The suite runs on PLAYWRIGHT_PORT, defaulting to 3000. Make it explicit when
// another dev server already holds 3000: `reuseExistingServer` would otherwise
// adopt that unrelated server and run global setup - a full database wipe and
// reseed - straight through it.
const port = process.env.PLAYWRIGHT_PORT || '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

// global-setup.ts reads PLAYWRIGHT_BASE_URL to decide where to seed. Pin it
// here so the two halves can never disagree about which server they mean.
process.env.PLAYWRIGHT_BASE_URL = baseURL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/start-test-server.cjs',
    url: baseURL,
    // next dev reads PORT; start-test-server.cjs loads .env.test with dotenv,
    // which never overwrites an already-set variable, so this survives.
    env: { ...(process.env as Record<string, string>), PORT: port },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 