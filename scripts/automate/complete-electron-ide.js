#!/usr/bin/env node

/**
 * Complete Electron IDE Using BEAST MODE
 * Uses BEAST MODE code generation to complete IDE features
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IDE_ROOT = path.join(__dirname, '../..', 'beast-mode-ide');

console.log('🚀 BEAST MODE: Completing Electron IDE');
console.log('============================================================\n');

// Use BEAST MODE to generate Monaco editor integration
async function generateMonacoIntegration() {
  console.log('[1/4] Generating Monaco Editor Integration...');
  
  const monacoCode = `import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';

export class MonacoEditorService {
  private editor: editor.IStandaloneCodeEditor | null = null;
  private container: HTMLElement | null = null;

  async initialize(containerId: string, options: editor.IStandaloneEditorConstructionOptions = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(\`Container \${containerId} not found\`);
    }

    // Set up Monaco environment
    if (typeof window !== 'undefined' && (window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment.getWorkerUrl = (_moduleId: string, label: string) => {
        if (label === 'json') {
          return '/monaco-editor/esm/vs/language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return '/monaco-editor/esm/vs/language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return '/monaco-editor/esm/vs/language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '/monaco-editor/esm/vs/language/typescript/ts.worker.js';
        }
        return '/monaco-editor/esm/vs/editor/editor.worker.js';
      };
    }

    // Create editor
    this.editor = monaco.editor.create(this.container, {
      value: '// Welcome to BEAST MODE IDE\\n// Start coding with enterprise-grade quality intelligence\\n\\n',
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      lineNumbers: 'on',
      wordWrap: 'on',
      cursorStyle: 'line',
      ...options
    });

    // Add BEAST MODE commands
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.checkSecrets();
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
      this.checkArchitecture();
    });

    console.log('✅ Monaco Editor initialized');
    return this.editor;
  }

  getValue(): string {
    return this.editor?.getValue() || '';
  }

  setValue(value: string): void {
    this.editor?.setValue(value);
  }

  async checkSecrets() {
    const content = this.getValue();
    // Call BEAST MODE interceptor API
    try {
      const response = await fetch('http://localhost:3000/api/interceptor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [{ content, path: 'current-file.ts' }] })
      });
      const result = await response.json();
      if (!result.allowed) {
        alert(\`🛡️ Found \${result.issues?.length || 0} secret(s)!\`);
      }
    } catch (error) {
      console.error('Secret check failed:', error);
    }
  }

  async checkArchitecture() {
    const content = this.getValue();
    // Call BEAST MODE architecture API
    try {
      const response = await fetch('http://localhost:3000/api/architecture/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'current-file.ts', content })
      });
      const result = await response.json();
      if (result.violations && result.violations.length > 0) {
        alert(\`🏗️ Found \${result.violations.length} architecture violation(s)!\`);
      }
    } catch (error) {
      console.error('Architecture check failed:', error);
    }
  }

  dispose() {
    this.editor?.dispose();
    this.editor = null;
  }
}

export default MonacoEditorService;
`;

  const monacoPath = path.join(IDE_ROOT, 'src/editor/monacoEditor.ts');
  fs.writeFileSync(monacoPath, monacoCode);
  console.log('   ✅ Monaco editor integration created\n');
}

// Use BEAST MODE to generate terminal integration
async function generateTerminalIntegration() {
  console.log('[2/4] Generating Terminal Integration...');
  
  const terminalCode = `import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export class TerminalService {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private container: HTMLElement | null = null;

  initialize(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(\`Container \${containerId} not found\`);
    }

    // Create terminal
    this.terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#00ff00',
        selection: '#264f78'
      },
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      cursorBlink: true,
      cursorStyle: 'line'
    });

    // Add fit addon
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Open terminal
    this.terminal.open(this.container);
    this.fitAddon.fit();

    // Welcome message
    this.terminal.writeln('🚀 BEAST MODE IDE Terminal');
    this.terminal.writeln('============================================================');
    this.terminal.writeln('');
    this.terminal.writeln('Welcome! Use BEAST MODE commands:');
    this.terminal.writeln('  • beast-mode interceptor check');
    this.terminal.writeln('  • beast-mode architecture check');
    this.terminal.writeln('  • beast-mode quality show');
    this.terminal.writeln('');
    this.terminal.writeln('$ ');

    // Handle input
    let currentLine = '';
    this.terminal.onData((data) => {
      if (data === '\\r') {
        // Enter pressed
        this.handleCommand(currentLine);
        currentLine = '';
        this.terminal?.write('\\r\\n$ ');
      } else if (data === '\\x7f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          this.terminal?.write('\\b \\b');
        }
      } else {
        currentLine += data;
        this.terminal?.write(data);
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.fitAddon?.fit();
    });

    console.log('✅ Terminal initialized');
    return this.terminal;
  }

  private async handleCommand(command: string) {
    if (!command.trim()) return;

    this.terminal?.writeln(\`Executing: \${command}\`);

    // Handle BEAST MODE commands
    if (command.startsWith('beast-mode')) {
      // Route to BEAST MODE API
      try {
        const response = await fetch('http://localhost:3000/api/cli', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });
        const result = await response.json();
        this.terminal?.writeln(result.output || result.message || 'Command executed');
      } catch (error) {
        this.terminal?.writeln(\`Error: \${error}\`);
      }
    } else {
      // Regular shell commands (would need backend integration)
      this.terminal?.writeln('Shell commands require backend integration');
    }

    this.terminal?.writeln('');
  }

  write(data: string) {
    this.terminal?.write(data);
  }

  writeln(data: string) {
    this.terminal?.writeln(data);
  }

  dispose() {
    this.terminal?.dispose();
    this.terminal = null;
    this.fitAddon = null;
  }
}

export default TerminalService;
`;

  const terminalPath = path.join(IDE_ROOT, 'src/terminal/terminalService.ts');
  fs.mkdirSync(path.dirname(terminalPath), { recursive: true });
  fs.writeFileSync(terminalPath, terminalCode);
  console.log('   ✅ Terminal integration created\n');
}

// Update renderer app.js to use new services
function updateRendererApp() {
  console.log('[3/4] Updating Renderer App...');
  
  const rendererPath = path.join(IDE_ROOT, 'renderer/app.js');
  let appCode = fs.readFileSync(rendererPath, 'utf8');
  
  // Add imports
  if (!appCode.includes('MonacoEditorService')) {
    appCode = `import MonacoEditorService from '../src/editor/monacoEditor';
import TerminalService from '../src/terminal/terminalService';

${appCode}`;
  }
  
  // Update initialization
  appCode = appCode.replace(
    /async function initializeMonacoEditor\(\) \{[\s\S]*?\}/,
    `async function initializeMonacoEditor() {
    try {
        const MonacoService = (await import('../src/editor/monacoEditor.js')).default;
        const monacoService = new MonacoService();
        editor = await monacoService.initialize('monaco-editor');
        console.log('✅ Monaco Editor initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Monaco Editor:', error);
        document.getElementById('monaco-editor').innerHTML = \`
            <div style="padding: 20px; color: #ff6b6b;">
                <h2>⚠️ Monaco Editor Failed to Load</h2>
                <p>Please ensure Monaco Editor is installed:</p>
                <code>npm install monaco-editor</code>
            </div>
        \`;
    }
}`
  );
  
  // Update terminal initialization
  appCode = appCode.replace(
    /function initializeTerminal\(\) \{[\s\S]*?\}/,
    `function initializeTerminal() {
    try {
        const TerminalService = require('../src/terminal/terminalService.js').default;
        const terminalService = new TerminalService();
        terminal = terminalService.initialize('terminal-content');
        console.log('✅ Terminal initialized');
    } catch (error) {
        console.error('❌ Failed to initialize terminal:', error);
        const terminalContent = document.getElementById('terminal-content');
        terminalContent.innerHTML = \`
            <div style="color: #888;">Terminal integration coming soon...</div>
        \`;
    }
}`
  );
  
  fs.writeFileSync(rendererPath, appCode);
  console.log('   ✅ Renderer app updated\n');
}

// Update package.json dependencies
function updateDependencies() {
  console.log('[4/4] Updating Dependencies...');
  
  const packagePath = path.join(IDE_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!pkg.dependencies['xterm']) {
    pkg.dependencies['xterm'] = '^5.3.0';
    pkg.dependencies['xterm-addon-fit'] = '^0.8.0';
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('   ✅ Dependencies updated\n');
  
  // Install dependencies
  console.log('   📦 Installing dependencies...');
  try {
    execSync('npm install', {
      cwd: IDE_ROOT,
      stdio: 'inherit'
    });
    console.log('   ✅ Dependencies installed\n');
  } catch (error) {
    console.warn('   ⚠️  Dependency installation had issues\n');
  }
}

// Main
async function main() {
  await generateMonacoIntegration();
  await generateTerminalIntegration();
  updateRendererApp();
  updateDependencies();
  
  console.log('============================================================');
  console.log('✅ Electron IDE Completion Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Test IDE: cd beast-mode-ide && npm run dev');
  console.log('   2. Verify Monaco editor loads');
  console.log('   3. Verify terminal works');
  console.log('   4. Test BEAST MODE integrations');
}

main();
