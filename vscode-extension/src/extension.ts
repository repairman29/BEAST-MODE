import * as vscode from 'vscode';
import { BeastModeClient } from './beastModeClient';
import { SuggestionProvider } from './suggestionProvider';
import { QualityHintsProvider } from './qualityHintsProvider';
import { ChatProvider } from './chatProvider';

let beastModeClient: BeastModeClient;
let suggestionProvider: SuggestionProvider;
let qualityHintsProvider: QualityHintsProvider;
let chatProvider: ChatProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('BEAST MODE extension is now active!');

  // Initialize client
  const config = vscode.workspace.getConfiguration('beastMode');
  const apiUrl = config.get<string>('apiUrl', 'https://beast-mode.dev');
  
  beastModeClient = new BeastModeClient(apiUrl);
  suggestionProvider = new SuggestionProvider(beastModeClient);
  qualityHintsProvider = new QualityHintsProvider(beastModeClient);
  chatProvider = new ChatProvider(beastModeClient);

  // Register commands
  const commands = [
    vscode.commands.registerCommand('beastMode.analyzeQuality', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        // Try to open a test file automatically
        const testFile = vscode.Uri.file(
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath + 
          '/BEAST-MODE-PRODUCT/vscode-extension/src/test-file.ts'
        );
        try {
          await vscode.window.showTextDocument(testFile);
          vscode.window.showInformationMessage('Opened test file - try the command again!');
        } catch {
          vscode.window.showWarningMessage('Please open a file first, then try again');
        }
        return;
      }

      const filePath = editor.document.fileName;
      const content = editor.document.getText();

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing code quality...',
        cancellable: false
      }, async (progress) => {
        try {
          const result = await beastModeClient.analyzeQuality(filePath, content);
          
          if (result.success) {
            vscode.window.showInformationMessage(
              `Quality Score: ${(result.quality * 100).toFixed(1)}%`
            );
            
            // Show quality details in a new document
            const panel = vscode.window.createWebviewPanel(
              'beastModeQuality',
              'Code Quality Analysis',
              vscode.ViewColumn.Beside,
              {}
            );
            
            panel.webview.html = generateQualityReport(result);
          } else {
            vscode.window.showErrorMessage(`Analysis failed: ${result.error}`);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      });
    }),

    vscode.commands.registerCommand('beastMode.getSuggestions', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const position = editor.selection.active;
      const suggestions = await suggestionProvider.getSuggestions(
        editor.document,
        position
      );

      if (suggestions.length > 0) {
        const selected = await vscode.window.showQuickPick(
          suggestions.map((s: any) => ({
            label: s.text,
            description: `${s.type} (${(s.score * 100).toFixed(0)}%)`,
            detail: s.source
          })),
          { placeHolder: 'Select a suggestion' }
        );

        if (selected && typeof selected === 'object' && 'label' in selected) {
          const selectedLabel = (selected as { label: string }).label;
          const suggestion = suggestions.find((s: any) => s.text === selectedLabel);
          if (suggestion) {
            editor.edit(editBuilder => {
              editBuilder.insert(position, suggestion.text);
            });
          }
        }
      } else {
        vscode.window.showInformationMessage('No suggestions available');
      }
    }),

    vscode.commands.registerCommand('beastMode.openChat', () => {
      chatProvider.showChat();
    }),

    vscode.commands.registerCommand('beastMode.generateTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const filePath = editor.document.fileName;
      const content = editor.document.getText();

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating tests...',
        cancellable: false
      }, async (progress) => {
        try {
          const result = await beastModeClient.generateTests(filePath, content);
          
          if (result.success) {
            // Create new test file
            const testFilePath = result.testFile.path;
            const testContent = result.testFile.content;
            
            const uri = vscode.Uri.file(testFilePath);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
            
            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), testContent);
            await vscode.workspace.applyEdit(edit);
            
            vscode.window.showInformationMessage(
              `Tests generated! Estimated coverage: ${(result.estimatedCoverage * 100).toFixed(1)}%`
            );
          } else {
            vscode.window.showErrorMessage(`Test generation failed: ${result.error}`);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      });
    }),

    vscode.commands.registerCommand('beastMode.refactor', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const filePath = editor.document.fileName;
      const content = editor.document.getText();

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing refactoring opportunities...',
        cancellable: false
      }, async (progress) => {
        try {
          const analysis = await beastModeClient.analyzeRefactoring(filePath, content);
          
          if (analysis.success && analysis.opportunities.length > 0) {
            const selected = await vscode.window.showQuickPick(
              analysis.opportunities.map((opp: any) => ({
                label: opp.description,
                description: `${opp.type} - ${opp.severity}`,
                detail: `Estimated improvement: ${(opp.estimatedImprovement * 100).toFixed(1)}%`,
                opportunity: opp
              })),
              { placeHolder: 'Select a refactoring to apply' }
            );

            if (selected && typeof selected === 'object' && 'opportunity' in selected) {
              const result = await beastModeClient.applyRefactoring(
                filePath,
                content,
                (selected as any).opportunity
              );

              if (result.success) {
                // Apply refactored code
                const fullRange = new vscode.Range(
                  editor.document.positionAt(0),
                  editor.document.positionAt(content.length)
                );
                
                await editor.edit(editBuilder => {
                  editBuilder.replace(fullRange, result.refactoredCode);
                });

                vscode.window.showInformationMessage(
                  `Refactoring applied! Quality improved by ${(result.improvement * 100).toFixed(1)}%`
                );
              }
            }
          } else {
            vscode.window.showInformationMessage('No refactoring opportunities found');
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      });
    }),

    vscode.commands.registerCommand('beastMode.indexCodebase', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
      }

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Indexing codebase...',
        cancellable: false
      }, async (progress) => {
        try {
          const result = await beastModeClient.indexCodebase(workspaceFolder.uri.fsPath);
          
          if (result.success) {
            vscode.window.showInformationMessage(
              `Codebase indexed! ${result.indexing.filesIndexed} files, ${result.indexing.symbolsIndexed} symbols`
            );
          } else {
            vscode.window.showErrorMessage(`Indexing failed: ${result.error}`);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      });
    })
  ];

  // Register all commands
  context.subscriptions.push(...commands);

  // Register real-time suggestions if enabled
  if (config.get<boolean>('enableSuggestions', true)) {
    suggestionProvider.activate(context);
  }

  // Register quality hints if enabled
  if (config.get<boolean>('enableQualityHints', true)) {
    qualityHintsProvider.activate(context);
  }
}

export function deactivate() {
  // Cleanup
}

function generateQualityReport(result: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: system-ui; padding: 20px; }
        .score { font-size: 48px; font-weight: bold; color: #06b6d4; }
        .factors { margin-top: 20px; }
        .factor { padding: 10px; margin: 5px 0; background: #1e293b; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>Code Quality Analysis</h1>
      <div class="score">${(result.quality * 100).toFixed(1)}%</div>
      <div class="factors">
        ${Object.entries(result.factors || {}).map(([key, value]: [string, any]) => `
          <div class="factor">
            <strong>${key}:</strong> ${value.value} (Impact: ${(value.importance * 100).toFixed(1)}%)
          </div>
        `).join('')}
      </div>
      ${result.recommendations ? `
        <h2>Recommendations</h2>
        <ul>
          ${result.recommendations.map((rec: any) => `<li>${rec.action}</li>`).join('')}
        </ul>
      ` : ''}
    </body>
    </html>
  `;
}

