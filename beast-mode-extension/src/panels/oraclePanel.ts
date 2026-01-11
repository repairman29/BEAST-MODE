/**
 * Oracle Panel Webview for VS Code
 * AI chat interface for Oracle integration
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class OraclePanel {
    public static currentPanel: OraclePanel | undefined;
    private static readonly viewType = 'beastModeOracle';

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (OraclePanel.currentPanel) {
            OraclePanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            OraclePanel.viewType,
            'BEAST MODE Oracle',
            column || vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        );

        OraclePanel.currentPanel = new OraclePanel(panel, context);
    }

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly context: vscode.ExtensionContext
    ) {
        this.update();

        this.panel.onDidDispose(() => {
            OraclePanel.currentPanel = undefined;
        }, null, context.subscriptions);

        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'search') {
                    // Handle search
                }
            },
            null,
            context.subscriptions
        );
    }

    private update() {
        const webview = this.panel.webview;
        this.panel.webview.html = this.getHtmlForWebview(webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BEAST MODE Oracle</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        #chat {
            height: 400px;
            overflow-y: auto;
            border: 1px solid var(--vscode-input-border);
            padding: 10px;
            margin-bottom: 10px;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .message-user { background: var(--vscode-input-background); }
        .message-oracle { background: var(--vscode-editor-background); }
        input {
            width: 70%;
            padding: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        button {
            width: 25%;
            padding: 10px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>🧠 BEAST MODE Oracle</h1>
    <div id="chat"></div>
    <div>
        <input type="text" id="query" placeholder="Ask Oracle...">
        <button onclick="search()">Search</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function search() {
            const query = document.getElementById('query').value;
            if (!query) return;
            
            const chat = document.getElementById('chat');
            chat.innerHTML += '<div class="message message-user">' + query + '</div>';
            
            vscode.postMessage({ command: 'search', query: query });
            document.getElementById('query').value = '';
        }
    </script>
</body>
</html>`;
    }
}
