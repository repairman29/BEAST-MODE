import { test, expect } from '@playwright/test';

/**
 * API Health Check E2E Tests
 * 
 * Tests critical API endpoints for beast-mode.dev
 */
test.describe('API Health Checks', () => {
  test('health endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('healthy');
  });

  test('health endpoint should include timestamp', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('timestamp');
    expect(typeof body.timestamp).toBe('string');
  });

  test('health endpoint should be fast', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/health');
    const duration = Date.now() - start;
    
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(6000); // Should respond in < 6 seconds (dev server can be slow on cold start)
  });
});
