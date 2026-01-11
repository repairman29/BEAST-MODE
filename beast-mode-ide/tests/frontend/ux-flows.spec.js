/**
 * @ux
 * UX Flow Tests
 * Tests complete user workflows and journeys
 */

const { test, expect } = require('@playwright/test');

test.describe('UX Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    const htmlPath = require('path').join(__dirname, '../../renderer/index.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('Complete coding workflow @ux', async ({ page }) => {
    // 1. Editor loads
    const editor = page.locator('#monaco-editor');
    await expect(editor).toBeVisible();
    
    // 2. Type code
    await editor.click();
    await page.keyboard.type('function hello() {');
    await page.keyboard.press('Enter');
    await page.keyboard.type('  return "world";');
    await page.keyboard.press('Enter');
    await page.keyboard.type('}');
    
    // 3. Check if code is there
    const hasCode = await page.evaluate(() => {
      return window.editor && window.editor.getValue().includes('hello');
    });
    
    expect(hasCode).toBe(true);
  });

  test('File operations workflow @ux', async ({ page }) => {
    // Test if file operations are available
    const hasFileOps = await page.evaluate(() => {
      return typeof window.minimalUI !== 'undefined';
    });
    
    expect(hasFileOps).toBe(true);
  });

  test('AI assistance workflow @ux', async ({ page }) => {
    // Check if AI features are loaded
    const aiFeatures = await page.evaluate(() => {
      return typeof window.featureRegistry !== 'undefined' &&
             window.featureRegistry.ai &&
             window.featureRegistry.ai.length > 0;
    });
    
    expect(aiFeatures).toBe(true);
  });

  test('Quality check workflow @ux', async ({ page }) => {
    // Test quality features
    const qualityFeatures = await page.evaluate(() => {
      return typeof window.featureRegistry !== 'undefined' &&
             window.featureRegistry.quality &&
             window.featureRegistry.quality.length > 0;
    });
    
    expect(qualityFeatures).toBe(true);
  });

  test('Navigation workflow @ux', async ({ page }) => {
    // Test navigation features
    const navFeatures = await page.evaluate(() => {
      return typeof window.featureRegistry !== 'undefined' &&
             window.featureRegistry.navigation &&
             window.featureRegistry.navigation.length > 0;
    });
    
    expect(navFeatures).toBe(true);
  });

  test('Error handling workflow @ux', async ({ page }) => {
    // Test error boundary
    const hasErrorBoundary = await page.evaluate(() => {
      return typeof window.errorBoundary !== 'undefined';
    });
    
    expect(hasErrorBoundary).toBe(true);
  });
});
