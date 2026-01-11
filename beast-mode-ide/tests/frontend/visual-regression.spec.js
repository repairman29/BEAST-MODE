/**
 * @visual
 * Visual Regression Tests
 * Tests visual appearance and catches visual regressions
 */

const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    const htmlPath = require('path').join(__dirname, '../../renderer/index.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for animations and Monaco
  });

  test('Full page screenshot matches baseline @visual', async ({ page }) => {
    await expect(page).toHaveScreenshot('full-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Title bar matches baseline @visual', async ({ page }) => {
    const titleBar = page.locator('#minimal-title-bar');
    await expect(titleBar).toHaveScreenshot('title-bar.png', {
      maxDiffPixels: 50,
    });
  });

  test('Status bar matches baseline @visual', async ({ page }) => {
    const statusBar = page.locator('#minimal-status-bar');
    await expect(statusBar).toHaveScreenshot('status-bar.png', {
      maxDiffPixels: 50,
    });
  });

  test('Editor area matches baseline @visual', async ({ page }) => {
    const editor = page.locator('#monaco-editor');
    await expect(editor).toHaveScreenshot('editor-area.png', {
      maxDiffPixels: 100,
    });
  });

  test('Design system colors are consistent @visual', async ({ page }) => {
    // Take screenshot and check color consistency
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
    
    // Check CSS variables are consistent
    const colors = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        primary: getComputedStyle(root).getPropertyValue('--color-primary'),
        background: getComputedStyle(root).getPropertyValue('--color-background'),
        surface: getComputedStyle(root).getPropertyValue('--color-surface'),
      };
    });
    
    expect(colors.primary).toContain('#007AFF');
    expect(colors.background).toContain('#F5F5F7');
    expect(colors.surface).toContain('#FFFFFF');
  });

  test('Typography is consistent @visual', async ({ page }) => {
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    
    expect(fontFamily).toContain('-apple-system');
  });

  test('Spacing is consistent @visual', async ({ page }) => {
    const titleBar = page.locator('#minimal-title-bar');
    const padding = await titleBar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
      };
    });
    
    // Should have consistent padding
    expect(parseInt(padding.paddingLeft)).toBeGreaterThan(0);
    expect(parseInt(padding.paddingRight)).toBeGreaterThan(0);
  });
});
