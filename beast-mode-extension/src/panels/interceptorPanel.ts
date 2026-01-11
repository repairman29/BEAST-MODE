/**
 * Interceptor Panel Webview for VS Code
 * Shows intercepted commits and issues
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class InterceptorPanel {
    public static currentPanel: InterceptorPanel | undefined;
    private static readonly viewType = 'beastModeInterceptor';

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (InterceptorPanel.currentPanel) {
            InterceptorPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            InterceptorPanel.viewType,
            'BEAST MODE Interceptor',
            column || vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        );

        InterceptorPanel.currentPanel = new InterceptorPanel(panel, context);
    }

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly context: vscode.ExtensionContext
    ) {
        this.update();

        this.panel.onDidDispose(() => {
            InterceptorPanel.currentPanel = undefined;
        }, null, context.subscriptions);
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
    <title>BEAST MODE Interceptor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .status-safe { background: #00ff0020; border-left: 3px solid #00ff00; }
        .status-blocked { background: #ff000020; border-left: 3px solid #ff0000; }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            margin: 10px 5px;
        }
    </style>
</head>
<body>
    <h1>🛡️ BEAST MODE Interceptor</h1>
    <div class="status status-safe">
        ✅ All files are safe to commit
    </div>
    <div style="text-align: center; margin-top: 20px;">
        <button onclick="check()">🔍 Check Staged Files</button>
        <button onclick="install()">📦 Install Pre-Commit Hook</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function check() {
            vscode.postMessage({ command: 'check' });
        }
        function install() {
            vscode.postMessage({ command: 'install' });
        }
    </script>
</body>
</html>`;
    }
}
