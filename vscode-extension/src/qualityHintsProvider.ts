import * as vscode from 'vscode';
import { BeastModeClient } from './beastModeClient';

export class QualityHintsProvider {
  private client: BeastModeClient;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];

  constructor(client: BeastModeClient) {
    this.client = client;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('beastMode');
  }

  activate(context: vscode.ExtensionContext) {
    // Update diagnostics on document change
    const changeListener = vscode.workspace.onDidChangeTextDocument(async (e) => {
      await this.updateDiagnostics(e.document);
    });

    // Update diagnostics on document open
    const openListener = vscode.workspace.onDidOpenTextDocument(async (doc) => {
      await this.updateDiagnostics(doc);
    });

    context.subscriptions.push(changeListener, openListener);
    this.disposables.push(changeListener, openListener);
  }

  private async updateDiagnostics(document: vscode.TextDocument) {
    const content = document.getText();
    const position = new vscode.Position(0, 0);
    
    try {
      const result = await this.client.getSuggestions(
        document.fileName,
        content,
        position.line,
        position.character
      );

      if (result.success && result.qualityHint && result.qualityHint.message) {
        const hint = result.qualityHint;
        const diagnostics: vscode.Diagnostic[] = [];

        // Create diagnostic for quality hint
        const range = new vscode.Range(
          new vscode.Position(0, 0),
          new vscode.Position(0, 0)
        );

        const severity = this.getSeverity(hint.severity);
        const diagnostic = new vscode.Diagnostic(
          range,
          hint.message + (hint.suggestion ? ` - ${hint.suggestion}` : ''),
          severity
        );

        diagnostic.source = 'BEAST MODE';
        diagnostics.push(diagnostic);

        this.diagnosticCollection.set(document.uri, diagnostics);
      } else {
        this.diagnosticCollection.delete(document.uri);
      }
    } catch (error) {
      console.error('Error updating diagnostics:', error);
    }
  }

  private getSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      default:
        return vscode.DiagnosticSeverity.Information;
    }
  }

  dispose() {
    this.diagnosticCollection.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}

