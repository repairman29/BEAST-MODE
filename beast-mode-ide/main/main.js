/**
 * BEAST MODE IDE - Electron Main Process
 * Handles window creation, menu, and system integration
 */

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: false,
            webSecurity: false, // Allow loading Monaco from CDN
            allowRunningInsecureContent: true
        },
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    // Load the app - always use local file
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(htmlPath);
    
    // In production, serve bundled files from dist/
    if (!isDev) {
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            // Handle bundle loading failures gracefully
            console.warn('Failed to load resource:', validatedURL);
        });
    }
    
    // Open dev tools in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Create menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New File',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'new-file');
                    }
                },
                {
                    label: 'Open File',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'open-file');
                    }
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'save');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo', label: 'Undo' },
                { role: 'redo', label: 'Redo' },
                { type: 'separator' },
                { role: 'cut', label: 'Cut' },
                { role: 'copy', label: 'Copy' },
                { role: 'paste', label: 'Paste' },
                { role: 'selectAll', label: 'Select All' }
            ]
        },
        {
            label: 'BEAST MODE',
            submenu: [
                {
                    label: 'Secret Interceptor',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'interceptor');
                    }
                },
                {
                    label: 'Architecture Enforcement',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'architecture');
                    }
                },
                {
                    label: 'Quality Panel',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'quality');
                    }
                },
                {
                    label: 'Oracle AI',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'oracle');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'settings');
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload', label: 'Reload' },
                { role: 'forceReload', label: 'Force Reload' },
                { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Actual Size' },
                { role: 'zoomIn', label: 'Zoom In' },
                { role: 'zoomOut', label: 'Zoom Out' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Toggle Full Screen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About BEAST MODE IDE',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'about');
                    }
                },
                {
                    label: 'Documentation',
                    click: () => {
                        shell.openExternal('https://beast-mode.dev/docs');
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about', label: 'About ' + app.getName() },
                { type: 'separator' },
                { role: 'services', label: 'Services' },
                { type: 'separator' },
                { role: 'hide', label: 'Hide ' + app.getName() },
                { role: 'hideOthers', label: 'Hide Others' },
                { role: 'unhide', label: 'Show All' },
                { type: 'separator' },
                { role: 'quit', label: 'Quit ' + app.getName() }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// Handle file operations
ipcMain.handle('read-file', async (event, filePath) => {
    const fs = require('fs').promises;
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    const fs = require('fs').promises;
    try {
        await fs.writeFile(filePath, content, 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-dir', async (event, dirPath) => {
    const fs = require('fs').promises;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return {
            success: true,
            entries: entries.map(entry => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                isFile: entry.isFile()
            }))
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
