/**
 * Secret Interceptor Service for VS Code
 * Integrates BEAST MODE Secret Interceptor with VS Code
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Import BEAST MODE interceptor (using relative path to main project)
let BrandReputationInterceptor: any;
try {
    // Try to load from main project
    const interceptorPath = path.join(__dirname, '..', '..', '..', 'lib', 'janitor', 'brand-reputation-interceptor.js');
    if (fs.existsSync(interceptorPath)) {
        BrandReputationInterceptor = require(interceptorPath).BrandReputationInterceptor;
    } else {
        // Fallback: use API if local code not available
        console.warn('BEAST MODE interceptor not found locally, will use API');
    }
} catch (error) {
    console.warn('Could not load BEAST MODE interceptor:', error);
}

export class InterceptorService {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('beast-mode-interceptor');
        this.outputChannel = vscode.window.createOutputChannel('BEAST MODE Interceptor');
        context.subscriptions.push(this.diagnosticCollection);
        context.subscriptions.push(this.outputChannel);
    }

    async checkStagedFiles() {
        const config = vscode.workspace.getConfiguration('beast-mode');
        if (!config.get('interceptor.enabled', true)) {
            vscode.window.showInformationMessage('🛡️ BEAST MODE Interceptor is disabled');
            return;
        }

        this.outputChannel.appendLine('🛡️ Checking staged files for secrets...');
        vscode.window.setStatusBarMessage('🛡️ BEAST MODE: Checking for secrets...', 2000);

        try {
            if (BrandReputationInterceptor) {
                // Use local interceptor
                const interceptor = new BrandReputationInterceptor({
                    enabled: true,
                    strictMode: config.get('interceptor.strictMode', true),
                    storeInSupabase: true
                });

                await interceptor.initialize();
                const result = await interceptor.checkStagedFiles();

                if (!result.allowed) {
                    this.showIssues(result.issues, result.interceptedFiles);
                    vscode.window.showErrorMessage(
                        `🛡️ Interceptor blocked: ${result.issues.length} issue(s) found`
                    );
                } else {
                    vscode.window.showInformationMessage('✅ All files are safe to commit');
                    this.outputChannel.appendLine('✅ All files passed interceptor check');
                }
            } else {
                // Use API fallback
                await this.checkViaAPI();
            }
        } catch (error: any) {
            const message = error.message || 'Unknown error';
            vscode.window.showErrorMessage(`❌ Interceptor error: ${message}`);
            this.outputChannel.appendLine(`❌ Error: ${message}`);
        }
    }

    private async checkViaAPI() {
        // Fallback to API if local code not available
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        // Get staged files
        const { stdout } = await execAsync('git diff --cached --name-only', {
            cwd: workspaceFolder.uri.fsPath
        });

        const stagedFiles = stdout.trim().split('\n').filter(Boolean);
        if (stagedFiles.length === 0) {
            vscode.window.showInformationMessage('✅ No staged files to check');
            return;
        }

        // Call BEAST MODE API
        const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/interceptor/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: stagedFiles })
        });

        if (!response.ok) {
            throw new Error('API check failed');
        }

        const result = await response.json() as {
            allowed?: boolean;
            issues?: any[];
            interceptedFiles?: any[];
        };
        if (result.allowed === false) {
            this.showIssues(result.issues || [], result.interceptedFiles || []);
        } else {
            vscode.window.showInformationMessage('✅ All files are safe to commit');
        }
    }

    private showIssues(issues: any[], interceptedFiles: string[]) {
        this.diagnosticCollection.clear();

        const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

        issues.forEach(issue => {
            const filePath = issue.file || issue.filePath;
            if (!filePath) return;

            const uri = vscode.Uri.file(path.resolve(filePath));
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(
                    (issue.line || 1) - 1,
                    0,
                    (issue.line || 1) - 1,
                    1000
                ),
                `[${issue.severity?.toUpperCase() || 'HIGH'}] ${issue.message || issue.name}`,
                this.getSeverity(issue.severity)
            );

            diagnostic.source = 'BEAST MODE Interceptor';
            diagnostic.code = issue.type;

            if (!diagnosticsByFile.has(uri.toString())) {
                diagnosticsByFile.set(uri.toString(), []);
            }
            diagnosticsByFile.get(uri.toString())!.push(diagnostic);
        });

        // Set diagnostics for each file
        diagnosticsByFile.forEach((diagnostics, uriString) => {
            this.diagnosticCollection.set(vscode.Uri.parse(uriString), diagnostics);
        });

        // Show in Problems panel
        vscode.commands.executeCommand('workbench.actions.view.problems');
    }

    private getSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return vscode.DiagnosticSeverity.Error;
            case 'high':
                return vscode.DiagnosticSeverity.Warning;
            case 'medium':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    async installPreCommitHook() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const gitDir = path.join(workspaceFolder.uri.fsPath, '.git', 'hooks');
        const hookPath = path.join(gitDir, 'pre-commit');

        try {
            // Ensure hooks directory exists
            await fs.promises.mkdir(gitDir, { recursive: true });

            // Get path to BEAST MODE interceptor
            const interceptorPath = path.join(__dirname, '..', '..', '..', 'lib', 'janitor', 'brand-reputation-interceptor.js');
            const projectRoot = path.join(__dirname, '..', '..', '..');

            const hookContent = `#!/bin/sh
# BEAST MODE Secret Interceptor Pre-Commit Hook
# Installed by BEAST MODE VS Code Extension

PROJECT_ROOT="${projectRoot}"
cd "$PROJECT_ROOT"

node -e "
const { BrandReputationInterceptor } = require('./lib/janitor/brand-reputation-interceptor');
const interceptor = new BrandReputationInterceptor({
    enabled: true,
    strictMode: true,
    storeInSupabase: true
});

interceptor.initialize()
    .then(() => interceptor.checkStagedFiles())
    .then(result => {
        if (!result.allowed) {
            console.error('\\n🛡️  BEAST MODE Interceptor');
            console.error('\\n❌ Commit blocked! Found issues:');
            result.issues.forEach(issue => {
                console.error(\`   • [\${issue.severity.toUpperCase()}] \${issue.message}\`);
            });
            process.exit(1);
        } else {
            console.log('✅ All files are safe to commit');
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('❌ Interceptor error:', err.message);
        process.exit(0); // Don't block commit on error
    });
"
`;

            await fs.promises.writeFile(hookPath, hookContent, 'utf8');
            await execAsync(`chmod +x ${hookPath}`);

            vscode.window.showInformationMessage('✅ BEAST MODE pre-commit hook installed');
            this.outputChannel.appendLine('✅ Pre-commit hook installed successfully');
        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ Failed to install hook: ${error.message}`);
            this.outputChannel.appendLine(`❌ Error: ${error.message}`);
        }
    }
}
