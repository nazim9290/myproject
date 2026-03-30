const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'batch-debug.spec.cjs',
  timeout: 60000, retries: 0, workers: 1,
  reporter: [['list']],
  use: { headless: true, viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
