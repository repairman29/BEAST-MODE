/**
 * Oracle AI Service for VS Code
 * Integrates BEAST MODE Oracle for AI context and knowledge
 */

import * as vscode from 'vscode';

export class OracleService {
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('BEAST MODE Oracle');
        context.subscriptions.push(this.outputChannel);
    }

    async searchKnowledge(query: string): Promise<any> {
        try {
            const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/oracle/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error: any) {
            this.outputChannel.appendLine(`❌ Oracle search failed: ${error.message}`);
        }

        return null;
    }

    async getCommitSafetyContext(filePath: string): Promise<any> {
        try {
            const apiUrl = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/oracle/commit-safety`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error: any) {
            this.outputChannel.appendLine(`❌ Commit safety check failed: ${error.message}`);
        }

        return null;
    }
}
