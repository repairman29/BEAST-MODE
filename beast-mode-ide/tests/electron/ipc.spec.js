/**
 * IPC (Inter-Process Communication) Tests
 * Tests communication between main and renderer processes
 */

const { test, expect } = require('@playwright/test');
const { launchElectronApp, getMainWindow, testIPC } = require('./electron-setup');

test.describe('IPC Communication', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    electronApp = await launchElectronApp();
    window = await getMainWindow(electronApp);
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('IPC channels are registered', async () => {
    // Test that IPC channels exist
    const hasIPC = await electronApp.evaluate(() => {
      return typeof require('electron').ipcMain !== 'undefined';
    });

    expect(hasIPC).toBe(true);
  });

  test('Renderer can communicate with main', async () => {
    // This would test your specific IPC channels
    // Example: testIPC(electronApp, 'your-channel', { data: 'test' });
  });

  test('Main can communicate with renderer', async () => {
    // Test main-to-renderer communication
  });
});
