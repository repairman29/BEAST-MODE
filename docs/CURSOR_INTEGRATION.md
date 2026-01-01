# Cursor IDE Integration Guide

This guide shows you how to integrate Cursor IDE sessions with BEAST MODE's unified analytics system.

## 🚀 Quick Start

**Fastest way:** Install the extension and connect GitHub. See [Quick Start Guide](./CURSOR_QUICK_START.md).

## Overview

BEAST MODE can track your Cursor IDE activity including:
- File edits and saves
- Project opens/closes
- Command executions
- Code completions
- AI interactions

All tied to your GitHub account for unified analytics across CLI, API, Web, and Cursor.

## Integration Methods

### Method 1: Cursor Extension (Recommended) ⭐

**Location:** `BEAST-MODE-PRODUCT/cursor-extension/`

A ready-to-use Cursor extension that automatically tracks your activity. Just install and go!

### Method 2: CLI Integration

Use the BEAST MODE CLI from within Cursor's terminal - automatically tracked!

### Method 3: Manual/Webhook Integration

Set up custom tracking via webhooks or scripts.

---

## Method 1: Cursor Extension

### Step 1: Create Extension Structure

```bash
mkdir cursor-beast-mode-extension
cd cursor-beast-mode-extension
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install --save-dev @types/vscode typescript
npm install axios
```

### Step 3: Create Extension Files

**`package.json`** (Extension Manifest):
```json
{
  "name": "beast-mode-cursor",
  "displayName": "BEAST MODE Analytics",
  "description": "Track your Cursor IDE activity with BEAST MODE",
  "version": "1.0.0",
  "publisher": "beast-mode",
  "engines": {
    "vscode": "^1.60.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "beastMode.connect",
        "title": "Connect to BEAST MODE"
      },
      {
        "command": "beastMode.status",
        "title": "BEAST MODE Status"
      }
    ],
    "configuration": {
      "title": "BEAST MODE",
      "properties": {
        "beastMode.apiUrl": {
          "type": "string",
          "default": "https://beastmode.dev",
          "description": "BEAST MODE API URL"
        },
        "beastMode.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable BEAST MODE tracking"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  }
}
```

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

**`src/extension.ts`**:
```typescript
import * as vscode from 'vscode';
import axios from 'axios';

let sessionId: string;
let apiUrl: string;
let enabled: boolean;

export function activate(context: vscode.ExtensionContext) {
  console.log('BEAST MODE extension activated');
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('beastMode');
  apiUrl = config.get<string>('apiUrl', 'https://beastmode.dev');
  enabled = config.get<boolean>('enabled', true);
  
  // Generate session ID
  sessionId = `cursor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Track session start
  trackEvent('session_start', {
    sessionId,
    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  });
  
  // Track file saves
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      trackEvent('file_saved', {
        file: doc.fileName,
        language: doc.languageId,
      });
    })
  );
  
  // Track file opens
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        trackEvent('file_opened', {
          file: editor.document.fileName,
          language: editor.document.languageId,
        });
      }
    })
  );
  
  // Track commands
  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.connect', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Enter your BEAST MODE API token (optional)',
        password: true,
      });
      
      if (token) {
        await context.secrets.store('beastModeToken', token);
        vscode.window.showInformationMessage('✅ Connected to BEAST MODE!');
      }
    })
  );
  
  // Track session end on deactivate
  context.subscriptions.push(
    new vscode.Disposable(() => {
      trackEvent('session_end', {
        sessionId,
        duration: Date.now() - parseInt(sessionId.split('_')[1]),
      });
    })
  );
}

async function trackEvent(event: string, metadata: any = {}) {
  if (!enabled) return;
  
  try {
    const token = await vscode.commands.executeCommand<string>(
      'getSecret',
      'beastModeToken'
    );
    
    await axios.post(`${apiUrl}/api/cursor/session`, {
      sessionId,
      event,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        version: vscode.version,
      },
      context: {
        file: metadata.file,
        project: vscode.workspace.workspaceFolders?.[0]?.name,
        repo: await getGitRepo(),
      },
    }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      timeout: 2000,
    });
  } catch (error) {
    // Silently fail - don't break IDE
    console.debug('BEAST MODE tracking error:', error);
  }
}

async function getGitRepo(): Promise<string | undefined> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return undefined;
    
    const gitPath = vscode.Uri.joinPath(workspaceFolder.uri, '.git', 'config');
    const gitConfig = await vscode.workspace.fs.readFile(gitPath);
    const configText = Buffer.from(gitConfig).toString();
    
    const urlMatch = configText.match(/url\s*=\s*(.+)/);
    if (urlMatch) {
      const url = urlMatch[1].trim();
      // Extract owner/repo from GitHub URL
      const repoMatch = url.match(/github\.com[/:]([^/]+)\/([^/]+)/);
      if (repoMatch) {
        return `${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, '')}`;
      }
    }
  } catch (error) {
    // Not a git repo or can't read config
  }
  return undefined;
}

export function deactivate() {
  // Track session end
  trackEvent('session_end', {
    sessionId,
  });
}
```

### Step 4: Build and Install

```bash
npm run compile
```

Then install in Cursor:
1. Open Cursor
2. Go to Extensions (Cmd+Shift+X)
3. Click "..." → "Install from VSIX"
4. Or use the extension marketplace

---

## Method 2: CLI Integration

### Track Cursor Terminal Sessions

When you use Cursor's integrated terminal, BEAST MODE CLI automatically tracks your activity:

```bash
# In Cursor's terminal
beast-mode login
beast-mode quality check
beast-mode scan owner/repo
```

All commands are automatically tracked with session type `cli` and context from your Cursor workspace.

### Manual Session Tracking

You can also manually track Cursor sessions:

```bash
# Start a session
curl -X POST https://beastmode.dev/api/cursor/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cursor_123",
    "event": "session_start",
    "metadata": {
      "workspace": "/path/to/project"
    }
  }'
```

---

## Method 3: Webhook Integration

### Set Up Cursor Webhook

1. **Get BEAST MODE API Token**
   - Go to Settings → API Keys
   - Generate a new token

2. **Create Webhook Script**

Create `cursor-webhook.sh`:
```bash
#!/bin/bash

# BEAST MODE API URL
API_URL="https://beastmode.dev/api/cursor/session"

# Get session info
SESSION_ID="cursor_$(date +%s)_$$"
WORKSPACE="${1:-$(pwd)}"
EVENT="${2:-session_start}"

# Send to BEAST MODE
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEAST_MODE_TOKEN" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"event\": \"$EVENT\",
    \"metadata\": {
      \"workspace\": \"$WORKSPACE\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }"
```

3. **Use in Cursor**

Add to Cursor's tasks (`.vscode/tasks.json`):
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Track to BEAST MODE",
      "type": "shell",
      "command": "./cursor-webhook.sh ${workspaceFolder} file_saved",
      "problemMatcher": []
    }
  ]
}
```

---

## Configuration

### Environment Variables

Set in Cursor's settings or `.env`:

```bash
BEAST_MODE_API_URL=https://beastmode.dev
BEAST_MODE_TOKEN=your-token-here
BEAST_MODE_ENABLED=true
```

### Cursor Settings

Add to `.cursor/settings.json`:

```json
{
  "beastMode.apiUrl": "https://beastmode.dev",
  "beastMode.enabled": true,
  "beastMode.trackFileSaves": true,
  "beastMode.trackFileOpens": true,
  "beastMode.trackCommands": true
}
```

---

## Testing

### Test Session Tracking

```bash
# Test from terminal
curl -X POST https://beastmode.dev/api/cursor/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_123",
    "event": "test_event",
    "metadata": {
      "test": true
    }
  }'
```

### Verify in Dashboard

1. Open BEAST MODE Dashboard
2. Go to Analytics tab
3. Check "Cursor Sessions" section
4. You should see your test session

---

## Privacy & Security

- All tracking is opt-in
- Data is tied to your GitHub account
- No code content is sent, only metadata
- Sessions are anonymized by default
- You can disable tracking anytime

---

## Troubleshooting

### Extension Not Working

1. Check Cursor's Developer Console (Help → Toggle Developer Tools)
2. Verify extension is activated
3. Check configuration settings

### Sessions Not Appearing

1. Verify GitHub connection in BEAST MODE
2. Check API URL is correct
3. Ensure tracking is enabled
4. Check browser console for errors

### CLI Not Tracking

1. Run `beast-mode status` to verify login
2. Check `~/.beast-mode/config.json` for GitHub username
3. Verify API URL in config

---

## Next Steps

1. **Install Extension** (Method 1) for automatic tracking
2. **Use CLI** (Method 2) for manual tracking
3. **Set Up Webhooks** (Method 3) for custom integrations
4. **View Analytics** in BEAST MODE Dashboard → Analytics tab

All your Cursor activity will be unified with your CLI, API, and Web usage!



