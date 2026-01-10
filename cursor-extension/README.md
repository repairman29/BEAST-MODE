# BEAST MODE Cursor Extension

Track your Cursor IDE activity with BEAST MODE's unified analytics system.

## Features

- ✅ Automatic session tracking
- ✅ File save/open events
- ✅ GitHub repo detection
- ✅ Status bar indicator
- ✅ Privacy-first (opt-in, no code content sent)
- ✅ Unified with CLI, API, and Web analytics

## Installation

### Option 1: Install from VSIX (Recommended)

```bash
cd cursor-extension
npm install
npm run compile
npm run package
```

Then in Cursor:
1. Open Command Palette (Cmd+Shift+P)
2. Type "Install from VSIX"
3. Select the generated `.vsix` file

### Option 2: Development Mode

```bash
cd cursor-extension
npm install
npm run compile
npm run watch
```

Then in Cursor:
1. Press F5 to open Extension Development Host
2. Extension will be active in the new window

## Configuration

Open Cursor Settings (Cmd+,) and search for "BEAST MODE":

- **API URL**: Your BEAST MODE instance URL (default: `https://beast-mode.dev`)
- **Enabled**: Toggle tracking on/off
- **Track File Saves**: Track when you save files
- **Track File Opens**: Track when you open files
- **Track Commands**: Track command executions

## Commands

Access via Command Palette (Cmd+Shift+P):

- **BEAST MODE: Connect** - Connect with API token (optional, GitHub OAuth preferred)
- **BEAST MODE: Status** - Show current tracking status
- **BEAST MODE: Toggle** - Enable/disable tracking

## Status Bar

The extension shows a status indicator in the bottom-right:
- 🧪 **BEAST MODE** (green) - Tracking enabled
- 🧪 **BEAST MODE (Paused)** (yellow) - Tracking disabled

Click to toggle tracking on/off.

## What Gets Tracked

- Session start/end times
- Files opened (filename, language, line count)
- Files saved (filename, language, line count)
- Workspace/project name
- GitHub repository (if detected)
- Cursor version
- Event timestamps

**What's NOT Tracked:**
- File contents
- Code snippets
- Personal information
- Sensitive data

## Privacy

- All tracking is opt-in
- You can disable anytime
- Data is tied to your GitHub account
- No code content is transmitted
- Sessions are anonymized by default

## Troubleshooting

### Extension Not Activating

1. Check Cursor's Developer Console (Help → Toggle Developer Tools)
2. Look for "BEAST MODE extension activated" message
3. Verify extension is enabled in Extensions view

### Sessions Not Appearing

1. Verify GitHub connection in BEAST MODE dashboard
2. Check API URL is correct in settings
3. Ensure tracking is enabled
4. Check Developer Console for errors

### Status Bar Not Showing

1. Reload Cursor window (Cmd+Shift+P → "Reload Window")
2. Check extension is activated
3. Verify settings are correct

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Package extension
npm run package
```

## License

Part of BEAST MODE project.
