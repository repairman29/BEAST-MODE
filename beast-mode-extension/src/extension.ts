/**
 * BEAST MODE VS Code Extension
 * Enterprise Quality Intelligence Platform
 * 
 * Features:
 * - Secret Interceptor (prevents committing secrets)
 * - Architecture Enforcement (prevents bad patterns)
 * - Quality Tracking (self-healing)
 * - Oracle Integration (AI context)
 */

import * as vscode from 'vscode';
import { InterceptorService } from './interceptor/interceptorService';
import { ArchitectureEnforcer } from './architecture/enforcer';
import { QualityTracker } from './quality/tracker';
import { OracleService } from './oracle/oracleService';
import { QualityPanel } from './panels/qualityPanel';
import { InterceptorPanel } from './panels/interceptorPanel';
import { OraclePanel } from './panels/oraclePanel';

let statusBarItem: vscode.StatusBarItem;
let interceptorService: InterceptorService;
let architectureEnforcer: ArchitectureEnforcer;
let qualityTracker: QualityTracker;
let oracleService: OracleService;

export function activate(context: vscode.ExtensionContext) {
    console.log('🛡️ BEAST MODE extension is now active!');

    // Initialize services
    interceptorService = new InterceptorService(context);
    architectureEnforcer = new ArchitectureEnforcer(context);
    qualityTracker = new QualityTracker(context);
    oracleService = new OracleService(context);

    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(shield) BEAST MODE";
    statusBarItem.tooltip = "BEAST MODE: Enterprise Quality Intelligence";
    statusBarItem.command = 'beast-mode.status';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    const commands = [
        // Interceptor commands
        vscode.commands.registerCommand('beast-mode.interceptor.check', () => {
            interceptorService.checkStagedFiles();
        }),
        vscode.commands.registerCommand('beast-mode.interceptor.install', () => {
            interceptorService.installPreCommitHook();
        }),
        vscode.commands.registerCommand('beast-mode.interceptor.list', () => {
            InterceptorPanel.createOrShow(context);
        }),

        // Architecture commands
        vscode.commands.registerCommand('beast-mode.architecture.check', () => {
            architectureEnforcer.checkCurrentFile();
        }),
        vscode.commands.registerCommand('beast-mode.architecture.fix', () => {
            architectureEnforcer.autoFixCurrentFile();
        }),

        // Quality commands
        vscode.commands.registerCommand('beast-mode.quality.show', () => {
            QualityPanel.createOrShow(context);
        }),
        vscode.commands.registerCommand('beast-mode.quality.self-heal', () => {
            qualityTracker.runSelfHealing();
        }),

        // Oracle commands
        vscode.commands.registerCommand('beast-mode.oracle.chat', () => {
            OraclePanel.createOrShow(context);
        }),

        // Status command
        vscode.commands.registerCommand('beast-mode.status', () => {
            showStatus();
        })
    ];

    // Register all commands
    commands.forEach(command => context.subscriptions.push(command));

    // Watch for file changes (architecture enforcement)
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx}');
    fileWatcher.onDidChange(async (uri) => {
        const config = vscode.workspace.getConfiguration('beast-mode');
        if (config.get('architecture.enabled', true)) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.uri.toString() === uri.toString()) {
                await architectureEnforcer.checkCurrentFile();
            }
        }
    });
    context.subscriptions.push(fileWatcher);

    // Update status bar periodically
    updateStatusBar();
    setInterval(updateStatusBar, 30000); // Every 30 seconds

    // Show welcome message for first-time users
    const isFirstTime = context.globalState.get('beast-mode.first-time', true);
    if (isFirstTime) {
        vscode.window.showInformationMessage(
            '🛡️ BEAST MODE activated! Use Command Palette (Cmd+Shift+P) to access features.',
            'Got it'
        ).then(() => {
            context.globalState.update('beast-mode.first-time', false);
        });
    }
}

function updateStatusBar() {
    // Update status bar with current status
    const config = vscode.workspace.getConfiguration('beast-mode');
    const enabled = config.get('enabled', true);
    
    if (enabled) {
        statusBarItem.text = "$(shield) BEAST MODE";
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = "$(shield) BEAST MODE (Disabled)";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

function showStatus() {
    const config = vscode.workspace.getConfiguration('beast-mode');
    const status = {
        enabled: config.get('enabled', true),
        interceptor: config.get('interceptor.enabled', true),
        architecture: config.get('architecture.enabled', true),
        quality: config.get('quality.enabled', true),
        oracle: config.get('oracle.enabled', true)
    };

    const message = `🛡️ BEAST MODE Status:
${status.enabled ? '✅' : '❌'} Overall: ${status.enabled ? 'Enabled' : 'Disabled'}
${status.interceptor ? '✅' : '❌'} Secret Interceptor: ${status.interceptor ? 'Enabled' : 'Disabled'}
${status.architecture ? '✅' : '❌'} Architecture Enforcement: ${status.architecture ? 'Enabled' : 'Disabled'}
${status.quality ? '✅' : '❌'} Quality Tracking: ${status.quality ? 'Enabled' : 'Disabled'}
${status.oracle ? '✅' : '❌'} Oracle AI: ${status.oracle ? 'Enabled' : 'Disabled'}`;

    vscode.window.showInformationMessage(message);
}

export function deactivate() {
    // Cleanup
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
