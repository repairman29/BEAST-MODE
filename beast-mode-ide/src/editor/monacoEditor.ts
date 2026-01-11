/**
 * Monaco Editor Integration for BEAST MODE IDE
 */

import * as monaco from 'monaco-editor';

export class MonacoEditorManager {
    private editor: monaco.editor.IStandaloneCodeEditor | null = null;
    private container: HTMLElement;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }

    initialize() {
        // Create Monaco editor
        this.editor = monaco.editor.create(this.container, {
            value: '// Welcome to BEAST MODE IDE\n// Start coding...\n',
            language: 'typescript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
                enabled: true
            },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            wordWrap: 'on'
        });

        // Add BEAST MODE specific features
        this.setupBeastModeFeatures();
    }

    private setupBeastModeFeatures() {
        if (!this.editor) return;

        // Register custom actions
        this.editor.addAction({
            id: 'beast-mode.interceptor.check',
            label: 'Check for Secrets',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                monaco.KeyMod.Shift | monaco.KeyCode.KeyS
            ],
            run: () => {
                this.checkSecrets();
            }
        });

        this.editor.addAction({
            id: 'beast-mode.architecture.check',
            label: 'Check Architecture',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA,
                monaco.KeyMod.Shift | monaco.KeyCode.KeyA
            ],
            run: () => {
                this.checkArchitecture();
            }
        });
    }

    private async checkSecrets() {
        if (!this.editor) return;

        const content = this.editor.getValue();
        const filePath = this.getCurrentFilePath();

        // Call BEAST MODE interceptor API
        try {
            const response = await fetch('http://localhost:3000/api/interceptor/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath,
                    content
                })
            });

            const result = await response.json();
            if (!result.allowed) {
                this.showIssues(result.issues);
            }
        } catch (error) {
            console.error('Interceptor check failed:', error);
        }
    }

    private async checkArchitecture() {
        if (!this.editor) return;

        const content = this.editor.getValue();
        const filePath = this.getCurrentFilePath();

        // Call BEAST MODE architecture API
        try {
            const response = await fetch('http://localhost:3000/api/architecture/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath,
                    content
                })
            });

            const result = await response.json();
            if (result.violations && result.violations.length > 0) {
                this.showViolations(result.violations);
            }
        } catch (error) {
            console.error('Architecture check failed:', error);
        }
    }

    private showIssues(issues: any[]) {
        if (!this.editor) return;

        const markers: monaco.editor.IMarkerData[] = issues.map(issue => ({
            severity: this.getSeverity(issue.severity),
            message: issue.message || issue.name,
            startLineNumber: issue.line || 1,
            startColumn: 1,
            endLineNumber: issue.line || 1,
            endColumn: 1000
        }));

        monaco.editor.setModelMarkers(
            this.editor.getModel()!,
            'beast-mode-interceptor',
            markers
        );
    }

    private showViolations(violations: any[]) {
        if (!this.editor) return;

        const markers: monaco.editor.IMarkerData[] = violations.map(violation => ({
            severity: monaco.MarkerSeverity.Warning,
            message: violation.message || violation.name,
            startLineNumber: violation.line || 1,
            startColumn: 1,
            endLineNumber: violation.line || 1,
            endColumn: 1000
        }));

        monaco.editor.setModelMarkers(
            this.editor.getModel()!,
            'beast-mode-architecture',
            markers
        );
    }

    private getSeverity(severity: string): monaco.MarkerSeverity {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return monaco.MarkerSeverity.Error;
            case 'high':
                return monaco.MarkerSeverity.Warning;
            default:
                return monaco.MarkerSeverity.Info;
        }
    }

    private getCurrentFilePath(): string {
        // Get current file path from editor state
        return 'current-file.ts'; // TODO: Implement file path tracking
    }

    setValue(value: string) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    getValue(): string {
        return this.editor?.getValue() || '';
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
    }
}
