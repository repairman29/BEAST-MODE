/**
 * Playwright Configuration for Electron Testing
 * Tests Electron main process, IPC, and full app functionality
 */

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/electron',
  fullyParallel: false, // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron apps need single worker
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/electron-results.json' }],
    ['list']
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Electron-specific configuration
        launchOptions: {
          executablePath: path.join(__dirname, '../../node_modules/.bin/electron'),
          args: [path.join(__dirname, '../../main/main.js')],
        },
      },
    },
  ],
});
