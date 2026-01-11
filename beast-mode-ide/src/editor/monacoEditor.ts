import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';

export class MonacoEditorService {
  private editor: editor.IStandaloneCodeEditor | null = null;
  private container: HTMLElement | null = null;

  async initialize(containerId: string, options: editor.IStandaloneEditorConstructionOptions = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
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
      value: '// Welcome to BEAST MODE IDE\n// Start coding with enterprise-grade quality intelligence\n\n',
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
        alert(`🛡️ Found ${result.issues?.length || 0} secret(s)!`);
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
        alert(`🏗️ Found ${result.violations.length} architecture violation(s)!`);
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
