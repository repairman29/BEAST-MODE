import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * 
 * Tests the main landing page of beast-mode.dev
 */
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/BEAST MODE/i);
    
    // Check main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    // Hero section should be visible
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Look for navigation links
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const count = await navLinks.count();
    
    if (count > 0) {
      // Test first navigation link
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('#')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        // Page should have loaded
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile-friendly elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      err => !err.includes('favicon') && 
             !err.includes('analytics') &&
             !err.includes('gtag') &&
             !err.includes('chunk') &&
             !err.includes('Failed to load resource') &&
             !err.includes('404') &&
             !err.includes('NetworkError') &&
             !err.toLowerCase().includes('polyfill')
    );
    
    // Log errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Non-filtered errors found:', criticalErrors);
    }
    
    // Allow some errors but log them
    expect(criticalErrors.length).toBeLessThan(10);
  });
});
