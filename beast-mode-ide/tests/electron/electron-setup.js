/**
 * Electron Test Setup Utilities
 * Helper functions for testing Electron apps
 */

const { _electron: electron } = require('playwright');

/**
 * Launch Electron app for testing
 */
async function launchElectronApp(options = {}) {
  const electronApp = await electron.launch({
    args: [require('path').join(__dirname, '../../main/main.js')],
    ...options,
  });

  return electronApp;
}

/**
 * Get main window
 */
async function getMainWindow(electronApp) {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  return window;
}

/**
 * Test IPC communication
 */
async function testIPC(electronApp, channel, data) {
  const result = await electronApp.evaluate(
    ({ ipcMain }, channel, data) => {
      return new Promise((resolve) => {
        ipcMain.once(channel, (event, response) => {
          resolve(response);
        });
        // Trigger IPC from renderer
        // This would need to be implemented in your app
      });
    },
    channel,
    data
  );
  return result;
}

/**
 * Wait for Electron app to be ready
 */
async function waitForAppReady(window, timeout = 10000) {
  await window.waitForFunction(
    () => {
      return (
        typeof window.monaco !== 'undefined' ||
        document.querySelector('#monaco-editor') !== null
      );
    },
    { timeout }
  );
}

module.exports = {
  launchElectronApp,
  getMainWindow,
  testIPC,
  waitForAppReady,
};
