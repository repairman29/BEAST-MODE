import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for beast-mode.dev
 * 
 * Tests the full end-to-end functionality of the BEAST MODE platform
 */
export default defineConfig({
  testDir: './e2e',
  
  // Maximum time one test can run for
  timeout: 60 * 1000, // 60 seconds for dev server
  
  // Test execution
  fullyParallel: false, // Use sequential for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once for flakiness
  workers: 1, // Single worker for stability
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 240 * 1000, // 4 minutes for server to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
