import * as vscode from 'vscode';
import axios from 'axios';

let sessionId: string;
let apiUrl: string;
let enabled: boolean;
let trackFileSaves: boolean;
let trackFileOpens: boolean;
let trackCommands: boolean;
let sessionStartTime: number;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('BEAST MODE extension activated');
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('beastMode');
  // Default to localhost for development, can be overridden in settings
  apiUrl = config.get<string>('apiUrl', 'http://localhost:7777');
  enabled = config.get<boolean>('enabled', true);
  trackFileSaves = config.get<boolean>('trackFileSaves', true);
  trackFileOpens = config.get<boolean>('trackFileOpens', true);
  trackCommands = config.get<boolean>('trackCommands', true);
  
  // Generate session ID
  sessionStartTime = Date.now();
  sessionId = `cursor_${sessionStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'beastMode.toggle';
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  
  // Track session start
  trackEvent('session_start', {
    sessionId,
    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    version: vscode.version,
  });
  
  // Track file saves
  if (trackFileSaves) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        trackEvent('file_saved', {
          file: doc.fileName,
          language: doc.languageId,
          lineCount: doc.lineCount,
        });
      })
    );
  }
  
  // Track file opens
  if (trackFileOpens) {
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          trackEvent('file_opened', {
            file: editor.document.fileName,
            language: editor.document.languageId,
            lineCount: editor.document.lineCount,
          });
        }
      })
    );
  }
  
  // Track commands (if enabled)
  if (trackCommands) {
    // Track when user runs commands
    const originalExecuteCommand = vscode.commands.executeCommand;
    // Note: We can't easily intercept all commands, but we can track specific ones
  }
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.connect', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Enter your BEAST MODE API token (optional - GitHub OAuth is preferred)',
        password: true,
        ignoreFocusOut: true,
      });
      
      if (token) {
        await context.secrets.store('beastModeToken', token);
        vscode.window.showInformationMessage('✅ Connected to BEAST MODE!');
        updateStatusBar();
      }
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.status', async () => {
      let token: string | undefined;
      try {
        token = await context.secrets.get('beastModeToken');
      } catch {
        token = undefined;
      }
      const status = enabled ? 'Enabled' : 'Disabled';
      const connected = token ? 'Connected' : 'Not Connected';
      
      vscode.window.showInformationMessage(
        `BEAST MODE: ${status} | ${connected} | Session: ${sessionId.substring(0, 20)}...`
      );
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.toggle', async () => {
      enabled = !enabled;
      await config.update('enabled', enabled, vscode.ConfigurationTarget.Global);
      updateStatusBar();
      
      if (enabled) {
        vscode.window.showInformationMessage('✅ BEAST MODE tracking enabled');
        trackEvent('tracking_enabled', {});
      } else {
        vscode.window.showInformationMessage('⏸️ BEAST MODE tracking disabled');
        trackEvent('tracking_disabled', {});
      }
    })
  );
  
  // Track configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('beastMode')) {
        const newConfig = vscode.workspace.getConfiguration('beastMode');
        enabled = newConfig.get<boolean>('enabled', true);
        apiUrl = newConfig.get<string>('apiUrl', 'https://beastmode.dev');
        trackFileSaves = newConfig.get<boolean>('trackFileSaves', true);
        trackFileOpens = newConfig.get<boolean>('trackFileOpens', true);
        trackCommands = newConfig.get<boolean>('trackCommands', true);
        updateStatusBar();
      }
    })
  );
  
  // Track session end on deactivate
  context.subscriptions.push(
    new vscode.Disposable(() => {
      trackEvent('session_end', {
        sessionId,
        duration: Date.now() - sessionStartTime,
      });
    })
  );
}

function updateStatusBar() {
  if (enabled) {
    statusBarItem.text = '$(beaker) BEAST MODE';
    statusBarItem.tooltip = 'BEAST MODE tracking enabled - Click to disable';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(beaker) BEAST MODE (Paused)';
    statusBarItem.tooltip = 'BEAST MODE tracking disabled - Click to enable';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
}

async function trackEvent(event: string, metadata: any = {}) {
  if (!enabled) return;
  
  try {
    // Get token from secrets storage (optional - GitHub OAuth is preferred)
    let token: string | undefined = undefined;
    // Note: Token is optional - GitHub OAuth from dashboard is preferred
    // Extension will work without token if user is connected via dashboard
    
    // Get GitHub repo info
    const repo = await getGitRepo();
    const workspace = vscode.workspace.workspaceFolders?.[0];
    
    await axios.post(`${apiUrl}/api/cursor/session`, {
      sessionId,
      event,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        version: vscode.version,
        workspace: workspace?.name,
      },
      context: {
        file: metadata.file,
        project: workspace?.name,
        repo: repo,
      },
    }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      timeout: 2000,
      validateStatus: () => true, // Don't throw on HTTP errors
    }).catch((error: any) => {
      // Silently fail - don't break IDE
      // Only log in debug mode
      if (process.env.DEBUG) {
        console.debug('BEAST MODE tracking error:', error.message);
      }
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
    
    // Try to read .git/config
    const gitConfigPath = vscode.Uri.joinPath(workspaceFolder.uri, '.git', 'config');
    try {
      const gitConfig = await vscode.workspace.fs.readFile(gitConfigPath);
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
    
    // Try git command as fallback
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('git remote get-url origin', { cwd: workspaceFolder.uri.fsPath }, (error: any, stdout: string) => {
          if (!error && stdout) {
            const url = stdout.trim();
            const repoMatch = url.match(/github\.com[/:]([^/]+)\/([^/]+)/);
            if (repoMatch) {
              resolve(`${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, '')}`);
            } else {
              resolve(undefined);
            }
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}

export function deactivate() {
  // Track session end
  trackEvent('session_end', {
    sessionId,
    duration: Date.now() - sessionStartTime,
  });
}

