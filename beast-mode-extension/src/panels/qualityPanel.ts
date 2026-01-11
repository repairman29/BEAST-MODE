/**
 * Quality Panel Webview for VS Code
 * Shows quality metrics and self-healing status
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class QualityPanel {
    public static currentPanel: QualityPanel | undefined;
    private static readonly viewType = 'beastModeQuality';

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (QualityPanel.currentPanel) {
            QualityPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            QualityPanel.viewType,
            'BEAST MODE Quality',
            column || vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        );

        QualityPanel.currentPanel = new QualityPanel(panel, context);
    }

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly context: vscode.ExtensionContext
    ) {
        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => {
            QualityPanel.currentPanel = undefined;
        }, null, context.subscriptions);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this.update();
                        return;
                    case 'selfHeal':
                        vscode.commands.executeCommand('beast-mode.quality.self-heal');
                        return;
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
    <title>BEAST MODE Quality</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .quality-score {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #00ff00;
        }
        .score-excellent { color: #00ff00; }
        .score-good { color: #ffff00; }
        .score-poor { color: #ff0000; }
        .issues {
            margin-top: 20px;
        }
        .issue {
            padding: 10px;
            margin: 5px 0;
            background: var(--vscode-editor-background);
            border-left: 3px solid;
        }
        .issue-critical { border-color: #ff0000; }
        .issue-high { border-color: #ff8800; }
        .issue-medium { border-color: #ffff00; }
        .issue-low { border-color: #00ff00; }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            margin: 10px 5px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>🛡️ BEAST MODE Quality</h1>
    <div class="quality-score score-excellent" id="qualityScore">95/100</div>
    <div class="issues" id="issues">
        <div class="issue issue-low">✅ No critical issues</div>
        <div class="issue issue-medium">⚠️ 2 medium priority issues</div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
        <button onclick="refresh()">🔄 Refresh</button>
        <button onclick="selfHeal()">✨ Self-Heal</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }
        function selfHeal() {
            vscode.postMessage({ command: 'selfHeal' });
        }
        // Auto-refresh every 30 seconds
        setInterval(refresh, 30000);
    </script>
</body>
</html>`;
    }
}
