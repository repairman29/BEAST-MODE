# Cursor IDE Integration - Quick Start

Get Cursor IDE sessions tracking in 5 minutes!

## Option 1: Install Extension (Recommended)

### Step 1: Build Extension

```bash
cd BEAST-MODE-PRODUCT/cursor-extension
chmod +x install.sh
./install.sh
```

### Step 2: Install in Cursor

1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Install from VSIX"
4. Select the generated `.vsix` file

### Step 3: Connect GitHub

1. Open BEAST MODE Dashboard in browser
2. Click "Connect GitHub" 
3. Authorize with GitHub
4. Extension will automatically use your GitHub identity

**Done!** Your Cursor sessions are now being tracked.

---

## Option 2: Manual Tracking (No Extension)

If you don't want to install the extension, you can manually track sessions:

### Track Session Start

```bash
curl -X POST https://beast-mode.dev/api/cursor/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cursor_manual_123",
    "event": "session_start",
    "metadata": {
      "workspace": "/path/to/project"
    }
  }'
```

### Track File Saves

Add to your `.git/hooks/post-commit`:

```bash
#!/bin/bash
curl -X POST https://beast-mode.dev/api/cursor/session \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"cursor_manual_123\",
    \"event\": \"file_saved\",
    \"metadata\": {
      \"file\": \"$1\"
    }
  }" 2>/dev/null
```

---

## Option 3: Use CLI from Cursor Terminal

The BEAST MODE CLI automatically tracks all commands when run from Cursor's terminal:

```bash
# In Cursor's integrated terminal
beast-mode login
beast-mode quality check
beast-mode scan owner/repo
```

All commands are automatically tracked with session type `cli` and linked to your GitHub account.

---

## Verify It's Working

1. Open BEAST MODE Dashboard
2. Go to **Analytics** tab
3. Look for "Cursor Sessions" section
4. You should see your session activity

---

## What Gets Tracked

✅ Session start/end times  
✅ Files opened (filename, language only)  
✅ Files saved (filename, language only)  
✅ Workspace/project name  
✅ GitHub repository (auto-detected)  
✅ Cursor version  

❌ **NOT tracked:** File contents, code snippets, personal data

---

## Troubleshooting

### Extension Not Showing in Status Bar

1. Reload Cursor window: `Cmd+Shift+P` → "Reload Window"
2. Check extension is enabled in Extensions view
3. Verify settings: `Cmd+,` → search "BEAST MODE"

### Sessions Not Appearing

1. Verify GitHub connection in dashboard
2. Check API URL in settings (default: `https://beast-mode.dev`)
3. Ensure tracking is enabled
4. Check Developer Console: `Help` → `Toggle Developer Tools`

### CLI Not Tracking

1. Run `beast-mode status` to verify login
2. Check `~/.beast-mode/config.json` for GitHub username
3. Verify API URL in config

---

## Next Steps

- View unified analytics: Dashboard → Analytics
- See all your activity: CLI + API + Web + Cursor
- All tied to your GitHub account!

