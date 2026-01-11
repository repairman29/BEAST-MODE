import * as vscode from 'vscode';
import { BeastModeClient } from './beastModeClient';

export class QualityStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private client: BeastModeClient;
  private currentQuality: number | null = null;
  private isAnalyzing: boolean = false;
  private disposables: vscode.Disposable[] = [];

  constructor(client: BeastModeClient) {
    this.client = client;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      200 // Priority (lower = more to the right)
    );
    this.statusBarItem.command = 'beastMode.analyzeQuality';
    this.statusBarItem.tooltip = 'BEAST MODE Quality Score - Click to analyze';
    this.updateStatusBar('---', '$(sync~spin)');
  }

  activate(context: vscode.ExtensionContext) {
    // Show status bar
    this.statusBarItem.show();

    // Update on document change (debounced)
    let updateTimeout: NodeJS.Timeout | null = null;
    const changeListener = vscode.workspace.onDidChangeTextDocument(async (e) => {
      // Only update for active editor
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === e.document) {
        // Debounce updates (wait 1 second after last change)
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
          this.analyzeCurrentFile();
        }, 1000);
      }
    });

    // Update on editor change
    const editorListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor) {
        this.analyzeCurrentFile();
      } else {
        this.updateStatusBar('---', '$(file)');
      }
    });

    // Initial analysis
    if (vscode.window.activeTextEditor) {
      this.analyzeCurrentFile();
    }

    context.subscriptions.push(changeListener, editorListener, this.statusBarItem);
    this.disposables.push(changeListener, editorListener);
  }

  private async analyzeCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.updateStatusBar('---', '$(file)');
      return;
    }

    // Skip if already analyzing
    if (this.isAnalyzing) {
      return;
    }

    this.isAnalyzing = true;
    this.updateStatusBar('...', '$(sync~spin)');

    try {
      const filePath = editor.document.fileName;
      const content = editor.document.getText();

      // Only analyze if file has content
      if (!content || content.trim().length === 0) {
        this.updateStatusBar('---', '$(file)');
        this.isAnalyzing = false;
        return;
      }

      const result = await this.client.analyzeQuality(filePath, content);

      if (result.success && result.quality !== undefined) {
        this.currentQuality = result.quality;
        const qualityPercent = Math.round(result.quality * 100);
        this.updateStatusBar(`${qualityPercent}%`, this.getQualityIcon(result.quality));
      } else {
        this.updateStatusBar('Error', '$(error)');
      }
    } catch (error) {
      console.error('[BEAST MODE] Quality analysis error:', error);
      this.updateStatusBar('Error', '$(error)');
    } finally {
      this.isAnalyzing = false;
    }
  }

  private getQualityIcon(quality: number): string {
    if (quality >= 0.8) return '$(check)'; // Green check
    if (quality >= 0.6) return '$(warning)'; // Yellow warning
    if (quality >= 0.4) return '$(alert)'; // Orange alert
    return '$(error)'; // Red error
  }

  private updateStatusBar(text: string, icon: string) {
    this.statusBarItem.text = `$(beast-mode) ${icon} ${text}`;
  }

  getCurrentQuality(): number | null {
    return this.currentQuality;
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.statusBarItem.dispose();
  }
}
