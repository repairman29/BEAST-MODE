# Quick Install Guide

## Prerequisites

- Node.js 18+ installed
- Cursor IDE installed
- BEAST MODE dashboard running (or use https://beastmode.dev)

## Installation Steps

### 1. Build Extension

```bash
cd cursor-extension
npm install
npm run compile
npm run package
```

### 2. Install in Cursor

**Option A: Via Command Line**
```bash
code --install-extension beast-mode-cursor-1.0.0.vsix
```

**Option B: Via Cursor UI**
1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Install from VSIX"
4. Select `beast-mode-cursor-1.0.0.vsix`

### 3. Configure

1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "BEAST MODE"
3. Set API URL:
   - Production: `https://beastmode.dev`
   - Local Dev: `http://localhost:7777`

### 4. Connect GitHub

1. Open BEAST MODE Dashboard
2. Click "Connect GitHub"
3. Authorize with GitHub
4. Extension will automatically use your GitHub identity

## Verify

1. Check status bar (bottom-right) - should show "🧪 BEAST MODE"
2. Open a file and save it
3. Check BEAST MODE Dashboard → Analytics tab
4. You should see your Cursor session!

## Troubleshooting

- **Extension not showing**: Reload Cursor window (`Cmd+Shift+P` → "Reload Window")
- **Sessions not appearing**: Verify GitHub connection in dashboard
- **API errors**: Check API URL in settings matches your BEAST MODE instance

