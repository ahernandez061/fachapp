import { defineConfig, devices } from '@playwright/test'

// E2E contra el Supabase local (npm run sb:start && npm run db:reset).
// En local usa Edge/Chrome instalados (PW_CHANNEL=msedge|chrome); en CI, el Chromium de Playwright.
const channel = process.env.CI ? undefined : (process.env.PW_CHANNEL ?? 'msedge')
const baseURL = 'http://localhost:5180/fachapp/'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    channel,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
    // devices[] trae su propio userAgent/viewport; mantenemos el canal elegido.
    browserName: 'chromium',
  },
  projects: [
    { name: 'e2e', testIgnore: /screenshots\.spec\.ts/ },
    { name: 'docs', testMatch: /screenshots\.spec\.ts/ },
  ],
  webServer: {
    command: 'npx vite --port 5180 --strictPort',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
