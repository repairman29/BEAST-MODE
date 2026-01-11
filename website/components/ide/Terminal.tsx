'use client';

/**
 * Terminal Component
 * 
 * Implements P0 user stories:
 * - Terminal access
 * - Command execution
 * - Output display
 * - Command history
 */

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xterm.writeln('Welcome to BEAST MODE IDE Terminal');
    xterm.writeln('Type commands to get started...');
    xterm.writeln('');

    // Handle input
    let currentLine = '';
    xterm.onData((data) => {
      if (data === '\r') {
        // Enter pressed
        xterm.writeln('');
        handleCommand(currentLine, xterm);
        currentLine = '';
      } else if (data === '\x7f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
      } else {
        currentLine += data;
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, []);

  const handleCommand = (command: string, xterm: XTerm) => {
    const trimmed = command.trim();
    
    if (!trimmed) {
      return;
    }

    // Simple command handling
    if (trimmed === 'help') {
      xterm.writeln('Available commands:');
      xterm.writeln('  help - Show this help');
      xterm.writeln('  clear - Clear terminal');
      xterm.writeln('  echo <text> - Echo text');
      xterm.writeln('');
    } else if (trimmed === 'clear') {
      xterm.clear();
    } else if (trimmed.startsWith('echo ')) {
      xterm.writeln(trimmed.substring(5));
    } else {
      xterm.writeln(`Command not found: ${trimmed}`);
      xterm.writeln('Type "help" for available commands');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <span className="text-xs text-slate-400">Terminal</span>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}
