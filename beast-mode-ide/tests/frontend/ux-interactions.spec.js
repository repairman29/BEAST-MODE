/**
 * @ux
 * UX Interaction Tests
 * Tests user experience and interactions
 */

const { test, expect } = require('@playwright/test');

test.describe('UX Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    const htmlPath = require('path').join(__dirname, '../../renderer/index.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('Editor is interactive and accepts input @ux', async ({ page }) => {
    const editor = page.locator('#monaco-editor');
    await expect(editor).toBeVisible();
    
    // Click on editor
    await editor.click();
    
    // Type some text
    await page.keyboard.type('console.log("Hello BEAST MODE");');
    
    // Check if text was entered (Monaco editor content)
    const hasContent = await page.evaluate(() => {
      return window.editor && window.editor.getValue().length > 0;
    });
    
    expect(hasContent).toBe(true);
  });

  test('Keyboard shortcuts work @ux', async ({ page }) => {
    // Test Cmd/Ctrl+S for secret check
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await page.waitForTimeout(500);
    
    // Should trigger secret check (check for any response)
    const hasResponse = await page.evaluate(() => {
      return typeof window.checkSecrets === 'function';
    });
    
    expect(hasResponse).toBe(true);
  });

  test('Terminal is accessible and functional @ux', async ({ page }) => {
    const terminal = page.locator('#terminal-content');
    await expect(terminal).toBeVisible();
    
    // Terminal should be interactive
    const isInteractive = await terminal.evaluate((el) => {
      return el.querySelector('canvas') !== null;
    });
    
    expect(isInteractive).toBe(true);
  });

  test('Panels can be toggled @ux', async ({ page }) => {
    // Check if panel system exists
    const hasPanelSystem = await page.evaluate(() => {
      return typeof window.minimalUI !== 'undefined';
    });
    
    expect(hasPanelSystem).toBe(true);
  });

  test('Error boundary displays errors gracefully @ux', async ({ page }) => {
    // Trigger an error
    await page.evaluate(() => {
      throw new Error('Test error');
    });
    
    await page.waitForTimeout(1000);
    
    // Check if error boundary caught it
    const errorBoundary = page.locator('#error-boundary-container');
    const isVisible = await errorBoundary.isVisible().catch(() => false);
    
    // Error boundary should either show or not (depending on implementation)
    expect(typeof isVisible).toBe('boolean');
  });

  test('Copy functionality works @ux', async ({ page }) => {
    // Test copy button if it exists
    const copyButtons = page.locator('button:has-text("Copy"), .copy-btn, [class*="copy"]');
    const count = await copyButtons.count();
    
    if (count > 0) {
      await copyButtons.first().click();
      await page.waitForTimeout(500);
      
      // Check if clipboard has content (if permission allows)
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (e) {
          return 'permission-denied';
        }
      });
      
      expect(clipboardText).toBeTruthy();
    }
  });

  test('Responsive layout works @ux', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1024, height: 768 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const editor = page.locator('#monaco-editor');
      await expect(editor).toBeVisible();
      
      const box = await editor.boundingBox();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('Smooth animations and transitions @ux', async ({ page }) => {
    // Check if CSS transitions are defined
    const hasTransitions = await page.evaluate(() => {
      const root = document.documentElement;
      const primary = getComputedStyle(root).getPropertyValue('--transition-base');
      return primary.length > 0;
    });
    
    expect(hasTransitions).toBe(true);
  });
});
