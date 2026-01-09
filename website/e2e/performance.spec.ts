import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * 
 * Tests performance metrics for beast-mode.dev
 */
test.describe('Performance', () => {
  test('homepage should load quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    
    // Should load in reasonable time (10 seconds for dev server)
    expect(loadTime).toBeLessThan(10000);
  });

  test('API endpoints should respond quickly', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/health');
    const responseTime = Date.now() - start;
    
    // Should respond in < 3 seconds (dev server can be slower)
    expect(responseTime).toBeLessThan(3000);
  });

  test('should have reasonable page size', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      const contentLength = headers['content-length'];
      
      if (contentLength) {
        const sizeKB = parseInt(contentLength) / 1024;
        // Initial HTML should be reasonable (< 500KB)
        expect(sizeKB).toBeLessThan(500);
      }
    }
  });
});
