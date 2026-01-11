// Terminal integration - using xterm.js
// Note: Install with: npm install xterm @xterm/addon-fit
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export class TerminalService {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private container: HTMLElement | null = null;

  initialize(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
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
      if (data === '\r') {
        // Enter pressed
        this.handleCommand(currentLine);
        currentLine = '';
        this.terminal?.write('\r\n$ ');
      } else if (data === '\x7f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          this.terminal?.write('\b \b');
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

    this.terminal?.writeln(`Executing: ${command}`);

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
        this.terminal?.writeln(`Error: ${error}`);
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
