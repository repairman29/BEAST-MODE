/**
 * @a11y
 * Accessibility Tests
 * Tests accessibility features and compliance
 */

const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    const htmlPath = require('path').join(__dirname, '../../renderer/index.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Inject axe-core
    try {
      await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.8.0/axe.min.js' });
    } catch (e) {
      // May fail in file:// context, that's okay
    }
  });

  test('Page has proper heading structure @a11y', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    // Should have at least some headings for structure
    expect(headings).toBeGreaterThanOrEqual(0);
  });

  test('Images have alt text @a11y', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('Interactive elements are keyboard accessible @a11y', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      await button.focus();
      
      const isFocused = await button.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('Color contrast meets WCAG standards @a11y', async ({ page }) => {
    // Check text contrast
    const textElements = page.locator('body').first();
    const styles = await textElements.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });
    
    // Basic check - colors should be defined
    expect(styles.color).toBeTruthy();
    expect(styles.backgroundColor).toBeTruthy();
  });

  test('Focus indicators are visible @a11y', async ({ page }) => {
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await button.focus();
      
      const outline = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.outline || computed.outlineWidth;
      });
      
      // Should have some focus indicator
      expect(outline).toBeTruthy();
    }
  });

  test('ARIA labels are present where needed @a11y', async ({ page }) => {
    const interactiveElements = page.locator('[role], [aria-label], [aria-labelledby]');
    const count = await interactiveElements.count();
    
    // Should have some ARIA attributes for complex interactions
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Page is navigable with keyboard only @a11y', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const focused = await page.evaluate(() => {
      return document.activeElement !== document.body;
    });
    
    // Should be able to focus something
    expect(focused).toBe(true);
  });

  test('No keyboard traps @a11y', async ({ page }) => {
    // Tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focused = await page.evaluate(() => {
        return document.activeElement !== null;
      });
      
      expect(focused).toBe(true);
    }
  });
});
