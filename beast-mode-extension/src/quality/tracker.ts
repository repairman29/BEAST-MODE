/**
 * Quality Tracker for VS Code
 * Integrates BEAST MODE Quality Tracking and Self-Healing
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class QualityTracker {
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('BEAST MODE Quality');
        context.subscriptions.push(this.outputChannel);
    }

    async runSelfHealing() {
        const config = vscode.workspace.getConfiguration('beast-mode');
        if (!config.get('quality.enabled', true)) {
            vscode.window.showInformationMessage('🛡️ BEAST MODE Quality Tracking is disabled');
            return;
        }

        this.outputChannel.appendLine('🔄 Running self-healing analysis...');
        vscode.window.setStatusBarMessage('🔄 BEAST MODE: Self-healing...', 5000);

        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            // Get active file or all files
            const editor = vscode.window.activeTextEditor;
            const filesToAnalyze = editor 
                ? [editor.document.uri.fsPath]
                : await this.getAllCodeFiles(workspaceFolder.uri.fsPath);

            // Call self-healing API
            const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/beast-mode/self-improve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: filesToAnalyze,
                    targetScore: config.get('quality.targetScore', 90)
                })
            });

            if (!response.ok) {
                throw new Error('Self-healing API failed');
            }

            const result = await response.json() as {
                issues?: any[];
                qualityScore?: number;
                recommendations?: Array<{ action: string; priority: string }>;
            };
            
            if (result.issues && result.issues.length > 0) {
                this.outputChannel.appendLine(`📊 Found ${result.issues.length} issue(s)`);
                this.outputChannel.appendLine(`📈 Quality Score: ${result.qualityScore || 'N/A'}/100`);

                // Show recommendations
                if (result.recommendations) {
                    result.recommendations.forEach((rec: any) => {
                        this.outputChannel.appendLine(`💡 ${rec.action} (Priority: ${rec.priority})`);
                    });
                }

                vscode.window.showInformationMessage(
                    `🔄 Self-healing: ${result.issues.length} issue(s) found. Check output for details.`
                );
            } else {
                vscode.window.showInformationMessage('✅ No quality issues found!');
                this.outputChannel.appendLine('✅ All files meet quality standards');
            }

            // Update quality panel if open
            vscode.commands.executeCommand('beast-mode.quality.show');
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ Self-healing failed: ${error.message}`);
            this.outputChannel.appendLine(`❌ Error: ${error.message}`);
        }
    }

    private async getAllCodeFiles(rootPath: string): Promise<string[]> {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs'];
        const files: string[] = [];

        async function walkDir(dir: string) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Skip node_modules, .git, etc.
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }

                if (entry.isDirectory()) {
                    await walkDir(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (codeExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        }

        await walkDir(rootPath);
        return files;
    }

    async getQualityScore(filePath: string): Promise<number | null> {
        try {
            const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/quality/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            if (response.ok) {
                const result = await response.json() as { score?: number };
                return result.score || null;
            }
        } catch (error) {
            // Silently fail
        }

        return null;
    }
}
