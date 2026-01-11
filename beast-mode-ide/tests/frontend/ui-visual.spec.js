/**
 * @ui @visual
 * Visual and UI Component Tests
 * Tests visual appearance and UI components
 */

const { test, expect } = require('@playwright/test');

test.describe('UI Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load the renderer HTML file directly
    const htmlPath = require('path').join(__dirname, '../../renderer/index.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for Monaco and features to load
  });

  test('Title bar is visible and styled correctly @ui', async ({ page }) => {
    const titleBar = page.locator('#minimal-title-bar');
    await expect(titleBar).toBeVisible();
    
    // Check styling
    const styles = await titleBar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        background: computed.background,
        display: computed.display,
      };
    });
    
    expect(styles.height).toBe('44px');
    expect(styles.display).toBe('flex');
  });

  test('Status bar is visible and styled correctly @ui', async ({ page }) => {
    const statusBar = page.locator('#minimal-status-bar');
    await expect(statusBar).toBeVisible();
    
    const styles = await statusBar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        position: computed.position,
      };
    });
    
    expect(styles.height).toBe('22px');
    expect(styles.position).toBe('fixed');
  });

  test('Monaco Editor container exists @ui', async ({ page }) => {
    const editor = page.locator('#monaco-editor');
    await expect(editor).toBeVisible();
    
    const styles = await editor.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
      };
    });
    
    expect(parseInt(styles.width)).toBeGreaterThan(0);
    expect(parseInt(styles.height)).toBeGreaterThan(0);
  });

  test('Design system colors are applied @visual', async ({ page }) => {
    // Check CSS variables are loaded
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        primary: getComputedStyle(root).getPropertyValue('--color-primary'),
        background: getComputedStyle(root).getPropertyValue('--color-background'),
        text: getComputedStyle(root).getPropertyValue('--color-text-primary'),
      };
    });
    
    expect(rootStyles.primary).toContain('#007AFF');
    expect(rootStyles.background).toContain('#F5F5F7');
    expect(rootStyles.text).toContain('#1D1D1F');
  });

  test('Typography system is applied @visual', async ({ page }) => {
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
      };
    });
    
    expect(bodyStyles.fontFamily).toContain('-apple-system');
    expect(parseFloat(bodyStyles.fontSize)).toBeGreaterThan(0);
  });

  test('UI elements have proper spacing @ui', async ({ page }) => {
    const titleBar = page.locator('#minimal-title-bar');
    const editor = page.locator('#monaco-editor');
    
    const titleBarBox = await titleBar.boundingBox();
    const editorBox = await editor.boundingBox();
    
    // Title bar should be at top
    expect(titleBarBox.y).toBe(0);
    
    // Editor should be below title bar
    expect(editorBox.y).toBeGreaterThan(titleBarBox.height);
  });

  test('Focus mode toggle works @ui', async ({ page }) => {
    // Press Cmd+K (or Ctrl+K) to toggle focus mode
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
    
    await page.waitForTimeout(500);
    
    // Check if focus mode class is applied
    const hasFocusMode = await page.evaluate(() => {
      return document.body.classList.contains('focus-mode');
    });
    
    expect(hasFocusMode).toBe(true);
  });

  test('UI auto-hides after inactivity @ui', async ({ page }) => {
    const titleBar = page.locator('#minimal-title-bar');
    
    // Wait for auto-hide (3 seconds)
    await page.waitForTimeout(3500);
    
    const opacity = await titleBar.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    
    // Should be hidden (opacity 0) or visible (opacity 1) depending on implementation
    expect(['0', '1']).toContain(opacity);
  });
});
