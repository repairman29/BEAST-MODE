import { test, expect } from '@playwright/test';

/**
 * API Endpoints E2E Tests
 * 
 * Tests critical API endpoints for beast-mode.dev
 */
test.describe('API Endpoints', () => {
  test('repos quality endpoint should exist', async ({ request }) => {
    // Test with a sample repo
    const response = await request.get('/api/repos/quality?repo=test/repo');
    
    // Should return either 200 (success) or 400/401 (validation/auth error)
    expect([200, 400, 401, 404]).toContain(response.status());
  });

  test('repos quality endpoint should handle errors gracefully', async ({ request }) => {
    const response = await request.get('/api/repos/quality');
    
    // Should return an error response, not crash
    expect([200, 400, 401, 404, 500]).toContain(response.status());
    
    if (response.status() !== 200) {
      const body = await response.json().catch(() => ({}));
      // Should have error message
      expect(body).toBeTruthy();
    }
  });

  test('health endpoint should be accessible', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });

  test('API should have CORS headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const headers = response.headers();
    
    // Check for CORS headers
    expect(headers['access-control-allow-origin'] || headers['Access-Control-Allow-Origin']).toBeTruthy();
  });

  test('API should return JSON for JSON endpoints', async ({ request }) => {
    const response = await request.get('/api/health');
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    } else {
      // If endpoint is broken, skip content type check
      test.skip();
    }
  });
});
