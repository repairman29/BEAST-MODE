/**
 * Main Process Tests
 * Tests Electron main process functionality
 */

const { test, expect } = require('@playwright/test');
const { launchElectronApp, getMainWindow } = require('./electron-setup');

test.describe('Electron Main Process', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    electronApp = await launchElectronApp();
    window = await getMainWindow(electronApp);
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('App launches successfully', async () => {
    expect(electronApp).toBeTruthy();
    expect(window).toBeTruthy();
  });

  test('Main window is created', async () => {
    const title = await window.title();
    expect(title).toBeTruthy();
  });

  test('Window has correct size', async () => {
    const bounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.getBounds();
    });

    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  test('Window can be minimized', async () => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
    });

    const isMinimized = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isMinimized();
    });

    expect(isMinimized).toBe(true);
  });

  test('Window can be maximized', async () => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.maximize();
    });

    const isMaximized = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isMaximized();
    });

    expect(isMaximized).toBe(true);
  });
});
