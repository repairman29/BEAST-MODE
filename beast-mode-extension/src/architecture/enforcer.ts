/**
 * Architecture Enforcement for VS Code
 * Integrates BEAST MODE Architecture Enforcer with VS Code diagnostics
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Import BEAST MODE architecture enforcer
let ArchitectureEnforcerClass: any;
try {
    const enforcerPath = path.join(__dirname, '..', '..', '..', 'lib', 'janitor', 'architecture-enforcer.js');
    if (fs.existsSync(enforcerPath)) {
        ArchitectureEnforcerClass = require(enforcerPath).ArchitectureEnforcer;
    }
} catch (error) {
    console.warn('Could not load BEAST MODE architecture enforcer:', error);
}

export class ArchitectureEnforcer {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private outputChannel: vscode.OutputChannel;
    private enforcer: any;

    constructor(private context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('beast-mode-architecture');
        this.outputChannel = vscode.window.createOutputChannel('BEAST MODE Architecture');
        context.subscriptions.push(this.diagnosticCollection);
        context.subscriptions.push(this.outputChannel);

        if (ArchitectureEnforcer) {
            const config = vscode.workspace.getConfiguration('beast-mode');
            this.enforcer = new ArchitectureEnforcer({
                enabled: config.get('architecture.enabled', true),
                autoFix: config.get('architecture.autoFix', true),
                preCommitHook: false // VS Code handles this differently
            });
        }
    }

    async checkCurrentFile() {
        const config = vscode.workspace.getConfiguration('beast-mode');
        if (!config.get('architecture.enabled', true)) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const filePath = document.uri.fsPath;
        const content = document.getText();

        this.outputChannel.appendLine(`🔍 Checking architecture: ${path.basename(filePath)}`);

        try {
        if (this.enforcer) {
            // Use local enforcer
            const violations = await this.enforcer.checkFile(filePath, content) as any[];

            if (violations && violations.length > 0) {
                this.showViolations(document.uri, violations);
                vscode.window.showWarningMessage(
                    `⚠️ Architecture: ${violations.length} violation(s) found`
                );
            } else {
                // Clear diagnostics if no violations
                this.diagnosticCollection.delete(document.uri);
            }
        } else {
            // Use API fallback
            await this.checkViaAPI(document);
        }
        } catch (error: any) {
            this.outputChannel.appendLine(`❌ Error: ${error.message}`);
        }
    }

    private async checkViaAPI(document: vscode.TextDocument) {
        const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/architecture/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filePath: document.uri.fsPath,
                content: document.getText()
            })
        });

        if (response.ok) {
            const result = await response.json() as { violations?: any[] };
            if (result.violations && result.violations.length > 0) {
                this.showViolations(document.uri, result.violations);
            }
        }
    }

    private showViolations(uri: vscode.Uri, violations: any[]) {
        const diagnostics = violations.map(violation => {
            const line = (violation.line || 1) - 1;
            const range = new vscode.Range(
                line,
                0,
                line,
                1000
            );

            return new vscode.Diagnostic(
                range,
                `[Architecture] ${violation.message || violation.name}`,
                vscode.DiagnosticSeverity.Warning
            );
        });

        this.diagnosticCollection.set(uri, diagnostics);
    }

    async autoFixCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const filePath = document.uri.fsPath;
        const content = document.getText();

        try {
            if (this.enforcer) {
                const fixes = await this.enforcer.autoFix(filePath, content);
                
                if (fixes && fixes.length > 0) {
                    // Apply fixes
                    const edit = new vscode.WorkspaceEdit();
                    fixes.forEach((fix: any) => {
                        const range = new vscode.Range(
                            (fix.line || 1) - 1,
                            0,
                            (fix.line || 1) - 1,
                            1000
                        );
                        edit.replace(document.uri, range, fix.fixedCode || fix.suggestion);
                    });

                    await vscode.workspace.applyEdit(edit);
                    vscode.window.showInformationMessage(`✅ Fixed ${fixes.length} architecture issue(s)`);
                } else {
                    vscode.window.showInformationMessage('✅ No architecture issues to fix');
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ Auto-fix failed: ${error.message}`);
        }
    }
}
