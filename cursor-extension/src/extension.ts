import * as vscode from 'vscode';
import axios from 'axios';
import { ModelSelector } from './modelSelector';
import { BeastModeClient } from './beastModeClient';

let sessionId: string;
let apiUrl: string;
let enabled: boolean;
let trackFileSaves: boolean;
let trackFileOpens: boolean;
let trackCommands: boolean;
let sessionStartTime: number;
let statusBarItem: vscode.StatusBarItem;
let modelSelector: ModelSelector;
let beastModeClient: BeastModeClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('BEAST MODE Cursor extension is now active!');
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('beastMode');
  // Default to production, can be overridden in settings
  apiUrl = config.get<string>('apiUrl', 'https://beast-mode.dev');
  enabled = config.get<boolean>('enabled', true);
  trackFileSaves = config.get<boolean>('trackFileSaves', true);
  trackFileOpens = config.get<boolean>('trackFileOpens', true);
  trackCommands = config.get<boolean>('trackCommands', true);
  
  // Initialize BEAST MODE components
  modelSelector = new ModelSelector(apiUrl);
  beastModeClient = new BeastModeClient(apiUrl);
  
  // Generate session ID
  sessionStartTime = Date.now();
  sessionId = `cursor_${sessionStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create status bar item (will be updated by model selector)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'beastMode.showModelStatus';
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
  
  // Register BEAST MODE commands
  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.selectModel', async () => {
      await modelSelector.selectModel();
      updateStatusBar();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.registerCustomModel', async () => {
      await modelSelector.registerCustomModel();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.showModelStatus', async () => {
      await modelSelector.showModelStatus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.chat', async () => {
      const selectedModel = modelSelector.getSelectedModel();
      if (!selectedModel) {
        const result = await vscode.window.showWarningMessage(
          'No model selected. Would you like to select one now?',
          'Yes',
          'No'
        );
        if (result === 'Yes') {
          await modelSelector.selectModel();
        }
        return;
      }

      const message = await vscode.window.showInputBox({
        prompt: 'Enter your message',
        placeHolder: 'Ask BEAST MODE anything...'
      });

      if (!message) return;

      try {
        const response = await beastModeClient.chat(message, selectedModel);
        if (response.success) {
          // Show response in a new document
          const doc = await vscode.workspace.openTextDocument({
            content: `# BEAST MODE Chat Response\n\n**Model:** ${selectedModel}\n\n**Your Message:**\n${message}\n\n**Response:**\n${response.message || response.content || 'No response'}`,
            language: 'markdown'
          });
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showErrorMessage(`Chat failed: ${response.error}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Chat error: ${error.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('beastMode.analyzeQuality', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const selectedModel = modelSelector.getSelectedModel();
      const filePath = editor.document.fileName;
      const content = editor.document.getText();

      try {
        const result = await beastModeClient.analyzeQuality(filePath, content, selectedModel || undefined);
        if (result.success) {
          vscode.window.showInformationMessage(
            `Quality Score: ${(result.quality * 100).toFixed(1)}%`
          );
        } else {
          vscode.window.showErrorMessage(`Analysis failed: ${result.error}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Analysis error: ${error.message}`);
      }
    })
  );

  // Register tracking commands
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
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('beastMode')) {
        const newConfig = vscode.workspace.getConfiguration('beastMode');
        enabled = newConfig.get<boolean>('enabled', true);
        apiUrl = newConfig.get<string>('apiUrl', 'https://beast-mode.dev');
        trackFileSaves = newConfig.get<boolean>('trackFileSaves', true);
        trackFileOpens = newConfig.get<boolean>('trackFileOpens', true);
        trackCommands = newConfig.get<boolean>('trackCommands', true);
        
        // Update model selector if API URL changed
        if (e.affectsConfiguration('beastMode.apiUrl')) {
          modelSelector = new ModelSelector(apiUrl);
          beastModeClient = new BeastModeClient(apiUrl);
        }
        
        await updateStatusBar();
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

async function updateStatusBar() {
  // Update based on selected model
  const selectedModel = modelSelector?.getSelectedModel();
  if (selectedModel) {
    const models = await modelSelector?.getAvailableModels() || [];
    const model = models.find(m => m.modelId === selectedModel);
    statusBarItem.text = `$(beaker) BEAST MODE: ${model?.modelName || selectedModel}`;
    statusBarItem.tooltip = `BEAST MODE - Model: ${selectedModel} - Click to view status`;
  } else {
    statusBarItem.text = '$(beaker) BEAST MODE: No Model';
    statusBarItem.tooltip = 'BEAST MODE - No model selected - Click to select';
  }
  statusBarItem.backgroundColor = enabled ? undefined : new vscode.ThemeColor('statusBarItem.warningBackground');
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

