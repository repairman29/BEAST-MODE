import * as vscode from 'vscode';
import { BeastModeClient } from './beastModeClient';

export class SuggestionProvider {
  private client: BeastModeClient;
  private disposables: vscode.Disposable[] = [];

  constructor(client: BeastModeClient) {
    this.client = client;
  }

  activate(context: vscode.ExtensionContext) {
    // Register inline completion provider
    const provider = vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**/*.{js,ts,jsx,tsx,py,rs,go}' },
      {
        provideInlineCompletionItems: async (document, position, context, token) => {
          const content = document.getText();
          const line = position.line;
          const column = position.character;

          try {
            const result = await this.client.getSuggestions(
              document.fileName,
              content,
              line,
              column
            );

            if (result.success && result.suggestions.length > 0) {
              return result.suggestions.map((suggestion: any) => ({
                insertText: suggestion.text,
                range: new vscode.Range(position, position),
                command: {
                  title: 'Accept',
                  command: 'editor.action.inlineSuggest.commit',
                },
              }));
            }
          } catch (error) {
            console.error('Error getting suggestions:', error);
          }

          return [];
        },
      }
    );

    context.subscriptions.push(provider);
    this.disposables.push(provider);
  }

  async getSuggestions(document: vscode.TextDocument, position: vscode.Position) {
    const content = document.getText();
    const result = await this.client.getSuggestions(
      document.fileName,
      content,
      position.line,
      position.character
    );

    return result.success ? result.suggestions : [];
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}

