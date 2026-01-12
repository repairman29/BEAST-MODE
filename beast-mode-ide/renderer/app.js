/**
 * BEAST MODE IDE - Renderer Process (Fixed)
 * Main application logic for Electron IDE
 */

// Initialize Monaco Editor
let editor;
let terminal;
let terminalContent = '';
let terminalBuffer = []; // Store terminal output for copying
let consoleOutput = []; // Store console output for the console panel
let consolePanelInitialized = false;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 BEAST MODE IDE Starting...');
    
    // Initialize Monaco Editor
    await initializeMonacoEditor();
    
    // Initialize Terminal
    await initializeTerminal();
    
    // Initialize Panels
    initializePanels();
    
    // Initialize File Explorer
    initializeFileExplorer();
    
    // Setup menu actions
    setupMenuActions();
    
    // Setup copy functionality
    setupCopyFunctionality();
    
    // Intercept console errors and log to terminal
    interceptConsoleErrors();
    
    console.log('✅ BEAST MODE IDE Ready!');
});

/**
 * Initialize Monaco Editor
 * Uses bundled Monaco Editor (offline support) with CDN fallback
 */
async function initializeMonacoEditor() {
    try {
        const container = document.getElementById('monaco-editor');
        if (!container) {
            throw new Error('monaco-editor container not found');
        }
        
        // Try to load Monaco - webpack will bundle it, or use CDN fallback
        let monaco;
        
        // Check if Monaco is already available (bundled by webpack)
        if (window.monaco) {
            monaco = window.monaco;
        } else {
            // Try to import Monaco (webpack will handle this)
            try {
                // Dynamic import for webpack bundling
                const monacoModule = await import('monaco-editor');
                monaco = monacoModule.default || monacoModule;
            } catch (importError) {
                // Fallback to CDN if webpack bundle not available
                console.warn('Bundled Monaco not available, using CDN fallback');
                monaco = await loadMonacoFromCDN();
            }
        }
        
        // Create editor
        createEditor(monaco, container);
        
    } catch (error) {
        console.error('❌ Failed to initialize Monaco Editor:', error);
        const errorMsg = `❌ Failed to initialize Monaco Editor: ${error.message}\nStack: ${error.stack || 'N/A'}`;
        logErrorToTerminal(errorMsg);
        
        const container = document.getElementById('monaco-editor');
        if (container) {
            const errorHtml = `
                <div class="error-message" style="padding: 20px; color: #ff6b6b;">
                    <button class="copy-error-btn" onclick="copyError('${escapeHtml(error.message)}', '${escapeHtml(error.stack || 'N/A')}')">📋 Copy</button>
                    <h2>⚠️ Monaco Editor Failed to Load</h2>
                    <p>Error: ${error.message}</p>
                    <p>Monaco Editor is loading from bundle (offline support). If this persists:</p>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        <li>Run: npm run build:webpack</li>
                        <li>Check webpack configuration</li>
                        <li>Try reloading the IDE (Cmd+R or Ctrl+R)</li>
                    </ul>
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #888;">Stack Trace</summary>
                        <pre style="margin-top: 10px; font-size: 11px; color: #aaa;">${error.stack || 'N/A'}</pre>
                    </details>
                </div>
            `;
            container.innerHTML = errorHtml;
        }
    }
}

/**
 * Load Monaco Editor from CDN (fallback)
 * Only used when webpack bundle is not available
 */
async function loadMonacoFromCDN() {
    return new Promise((resolve, reject) => {
        // Load loader script from CDN
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        loaderScript.onload = () => {
            // Use global require from loader
            if (window.require && window.require.config) {
                window.require.config({ 
                    paths: { 
                        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
                    } 
                });
                window.require(['vs/editor/editor.main'], () => {
                    resolve(window.monaco);
                }, reject);
            } else {
                reject(new Error('Monaco loader not available'));
            }
        };
        loaderScript.onerror = reject;
        document.head.appendChild(loaderScript);
    });
}

/**
 * Create Monaco Editor instance
 */
function createEditor(monaco, container) {
    editor = monaco.editor.create(container, {
        value: '// Welcome to BEAST MODE IDE\n// Start coding with enterprise-grade quality intelligence\n\n',
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineNumbers: 'on',
        wordWrap: 'on',
        cursorStyle: 'line'
    });

    // Add BEAST MODE commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        checkSecrets();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
        checkArchitecture();
    });

    console.log('✅ Monaco Editor initialized');
}

/**
 * Initialize Terminal (xterm.js)
 */
async function initializeTerminal() {
    try {
        const terminalContent = document.getElementById('terminal-content');
        if (!terminalContent) {
            throw new Error('terminal-content container not found');
        }
        
        // Try to use xterm if available
        try {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            await import('@xterm/xterm/css/xterm.css');
            
            // Create terminal
            terminal = new Terminal({
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
            
            const fitAddon = new FitAddon();
            terminal.loadAddon(fitAddon);
            terminal.open(terminalContent);
            fitAddon.fit();
            
            // Welcome message
            const welcomeMsg = '🚀 BEAST MODE IDE Terminal\n============================================================\n\nWelcome! Terminal is ready.\n\n$ ';
            terminal.writeln(welcomeMsg);
            addToTerminalBuffer(welcomeMsg);
            
            // Enable copy on selection
            terminal.onSelectionChange(() => {
                const selection = terminal.getSelection();
                if (selection) {
                    // Selection is automatically available via Ctrl+C or right-click
                }
            });
            
            console.log('✅ Terminal initialized with xterm.js');
        } catch (xtermError) {
            // Fallback: Simple terminal placeholder
            console.log('   ⚠️  xterm.js not available, using placeholder');
            terminalContent.innerHTML = `
                <div style="color: #00ff00; font-family: monospace; padding: 10px;">
                    <div>$ BEAST MODE IDE Terminal</div>
                    <div style="color: #888; margin-top: 10px;">Terminal ready</div>
                    <div style="color: #888;">Use: beast-mode interceptor check</div>
                    <div style="color: #888; margin-top: 10px;">$ </div>
                </div>
            `;
            console.log('✅ Terminal placeholder initialized');
        }
    } catch (error) {
        console.error('❌ Failed to initialize terminal:', error);
        const errorMsg = `❌ Failed to initialize terminal: ${error.message}\nStack: ${error.stack || 'N/A'}`;
        logErrorToTerminal(errorMsg);
        
        const terminalContentEl = document.getElementById('terminal-content');
        if (terminalContentEl) {
            const errorHtml = `
                <div class="error-message" style="color: #ff6b6b; padding: 10px;">
                    <button class="copy-error-btn" onclick="copyError('${escapeHtml(error.message)}', '${escapeHtml(error.stack || 'N/A')}')">📋 Copy</button>
                    ⚠️ Terminal failed to load: ${error.message}
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #888;">Stack Trace</summary>
                        <pre style="margin-top: 10px; font-size: 11px; color: #aaa;">${error.stack || 'N/A'}</pre>
                    </details>
                </div>
            `;
            terminalContentEl.innerHTML = errorHtml;
        }
    }
}

/**
 * Initialize Panels
 */
function initializePanels() {
    const panelTabs = document.querySelectorAll('.panel-tab');
    panelTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            panelTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding panel content
            const panelName = tab.dataset.panel;
            showPanel(panelName);
        });
    });
    
    // Show default panel
    showPanel('interceptor');
}

function showPanel(panelName) {
    const panelContent = document.getElementById('panel-content');
    if (!panelContent) return;
    
    switch (panelName) {
        case 'interceptor':
            panelContent.innerHTML = `
                <h3>🛡️ Secret Interceptor</h3>
                <p>Prevents committing secrets and sensitive data.</p>
                <button onclick="checkSecrets()" style="padding: 10px; background: #007acc; color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Check for Secrets
                </button>
                <div id="interceptor-results" style="margin-top: 20px;"></div>
            `;
            break;
        case 'quality':
            panelContent.innerHTML = `
                <h3>✨ Quality Tracking</h3>
                <p>Automated quality improvement and tracking.</p>
                <div style="font-size: 48px; color: #00ff00; text-align: center; margin: 20px 0;">95/100</div>
                <button onclick="runSelfHealing()" style="padding: 10px; background: #007acc; color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Run Self-Healing
                </button>
            `;
            break;
        case 'oracle':
            panelContent.innerHTML = `
                <h3>🧠 Oracle AI</h3>
                <p>AI-powered code assistance and context.</p>
                <input type="text" id="oracle-query" placeholder="Ask Oracle..." style="width: 100%; padding: 10px; margin: 10px 0;">
                <button onclick="queryOracle()" style="padding: 10px; background: #007acc; color: white; border: none; cursor: pointer; border-radius: 3px; width: 100%;">
                    Search
                </button>
                <div id="oracle-results" style="margin-top: 20px;"></div>
            `;
            break;
        case 'console':
            panelContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>📋 Console Output</h3>
                    <div style="display: flex; gap: 5px;">
                        <button class="copy-btn" onclick="copyAllConsole()" style="padding: 5px 10px; font-size: 11px;">📋 Copy All</button>
                        <button class="copy-btn" onclick="clearConsole()" style="padding: 5px 10px; font-size: 11px;">🗑️ Clear</button>
                    </div>
                </div>
                <div id="console-output" style="background: #1e1e1e; padding: 10px; border-radius: 3px; max-height: 500px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4;">
                    <div style="color: #888;">Console output will appear here...</div>
                </div>
            `;
            initializeConsolePanel();
            break;
    }
}

/**
 * Initialize File Explorer
 */
function initializeFileExplorer() {
    const fileExplorer = document.getElementById('file-explorer');
    if (fileExplorer) {
        fileExplorer.innerHTML = `
            <div style="color: #888; padding: 10px;">
                <div>📁 File Explorer</div>
                <div style="margin-top: 10px; font-size: 12px;">
                    File explorer integration coming soon...
                </div>
            </div>
        `;
    }
}

/**
 * Setup Menu Actions
 */
function setupMenuActions() {
    if (window.electronAPI) {
        window.electronAPI.onMenuAction((action) => {
            switch (action) {
                case 'new-file':
                    if (editor) editor.setValue('// New file\n');
                    break;
                case 'open-file':
                    console.log('Open file');
                    break;
                case 'save':
                    console.log('Save file');
                    break;
                case 'interceptor':
                    showPanel('interceptor');
                    break;
                case 'architecture':
                    checkArchitecture();
                    break;
                case 'quality':
                    showPanel('quality');
                    break;
                case 'oracle':
                    showPanel('oracle');
                    break;
            }
        });
    }
}

/**
 * Check for Secrets
 */
async function checkSecrets() {
    const resultsDiv = document.getElementById('interceptor-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div style="color: #888;">Checking for secrets...</div>';
    }
    
    try {
        const content = editor?.getValue() || '';
        const response = await fetch('http://localhost:3000/api/interceptor/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [{ content, path: 'current-file.ts' }] })
        });
        
        const result = await response.json();
        
        if (resultsDiv) {
            if (result.allowed) {
                resultsDiv.innerHTML = '<div style="color: #00ff00;">✅ All files are safe to commit</div>';
            } else {
                const issuesText = JSON.stringify(result.issues || [], null, 2);
                resultsDiv.innerHTML = `
                    <div class="error-message" style="color: #ff6b6b;">
                        <button class="copy-error-btn" onclick="copyError('Found ${result.issues?.length || 0} issue(s)', '${escapeHtml(issuesText)}')">📋 Copy</button>
                        ❌ Found ${result.issues?.length || 0} issue(s)
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; color: #888;">View Issues</summary>
                            <pre style="margin-top: 10px; font-size: 11px; color: #aaa;">${escapeHtml(issuesText)}</pre>
                        </details>
                    </div>
                `;
            }
        }
    } catch (error) {
        const errorMsg = `❌ Error: ${error.message}`;
        logErrorToTerminal(errorMsg);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="error-message" style="color: #ff6b6b;">
                    <button class="copy-error-btn" onclick="copyError('${escapeHtml(error.message)}', '${escapeHtml(error.stack || 'N/A')}')">📋 Copy</button>
                    ❌ Error: ${error.message}
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #888;">Stack Trace</summary>
                        <pre style="margin-top: 10px; font-size: 11px; color: #aaa;">${escapeHtml(error.stack || 'N/A')}</pre>
                    </details>
                </div>
            `;
        }
    }
}

/**
 * Check Architecture
 */
async function checkArchitecture() {
    if (!editor) return;
    
    const content = editor.getValue();
    const filePath = 'current-file.ts';
    
    try {
        const response = await fetch('http://localhost:3000/api/architecture/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath, content })
        });
        
        const result = await response.json();
        
        if (result.violations && result.violations.length > 0) {
            alert(`⚠️ Found ${result.violations.length} architecture violation(s)`);
        } else {
            alert('✅ No architecture violations found');
        }
    } catch (error) {
        console.error('Architecture check failed:', error);
    }
}

/**
 * Run Self-Healing
 */
async function runSelfHealing() {
    try {
        const response = await fetch('http://localhost:3000/api/beast-mode/self-improve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [], targetScore: 90 })
        });
        
        const result = await response.json();
        alert(`🔄 Self-healing complete! Found ${result.issues?.length || 0} issue(s)`);
    } catch (error) {
        console.error('Self-healing failed:', error);
    }
}

/**
 * Query Oracle
 */
async function queryOracle() {
    const query = document.getElementById('oracle-query')?.value;
    if (!query) return;
    
    const resultsDiv = document.getElementById('oracle-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div style="color: #888;">Searching...</div>';
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/oracle/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        if (resultsDiv) {
            resultsDiv.innerHTML = `<div style="color: #fff;">${result.message || 'No results'}</div>`;
        }
    } catch (error) {
        const errorMsg = `❌ Error: ${error.message}`;
        logErrorToTerminal(errorMsg);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="error-message" style="color: #ff6b6b;">
                    <button class="copy-error-btn" onclick="copyError('${escapeHtml(error.message)}', '${escapeHtml(error.stack || 'N/A')}')">📋 Copy</button>
                    ❌ Error: ${error.message}
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #888;">Stack Trace</summary>
                        <pre style="margin-top: 10px; font-size: 11px; color: #aaa;">${escapeHtml(error.stack || 'N/A')}</pre>
                    </details>
                </div>
            `;
        }
    }
}

/**
 * Copy Error to Clipboard
 */
async function copyError(message, stack = '') {
    const errorText = `Error: ${message}\n\nStack Trace:\n${stack}`;
    await copyToClipboard(errorText);
}

/**
 * Copy to Clipboard Helper
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback();
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopyFeedback();
            return true;
        } catch (e) {
            console.error('Failed to copy:', e);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Show Copy Feedback
 */
function showCopyFeedback() {
    // Find all copy buttons and show feedback
    const copyBtns = document.querySelectorAll('.copy-btn, .copy-error-btn');
    copyBtns.forEach(btn => {
        const originalText = btn.textContent;
        btn.classList.add('copied');
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = originalText;
        }, 2000);
    });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Add to Terminal Buffer
 */
function addToTerminalBuffer(text) {
    terminalBuffer.push(text);
    terminalContent += text + '\n';
    // Keep buffer size manageable (last 1000 lines)
    if (terminalBuffer.length > 1000) {
        terminalBuffer.shift();
    }
}

// Store original console methods to prevent infinite loops
let originalConsoleError = null;
let isLoggingError = false; // Guard flag to prevent recursion

/**
 * Log Error to Terminal
 */
function logErrorToTerminal(errorMsg) {
    // Prevent infinite recursion
    if (isLoggingError) {
        return;
    }
    
    try {
        isLoggingError = true;
        addToTerminalBuffer(errorMsg);
        
        if (terminal) {
            try {
                terminal.writeln('\n' + errorMsg);
            } catch (e) {
                // Terminal might not be ready
            }
        } else {
            // Fallback: use original console.error to avoid recursion
            if (originalConsoleError) {
                originalConsoleError(errorMsg);
            } else {
                // Last resort: direct DOM manipulation
                const terminalContentEl = document.getElementById('terminal-content');
                if (terminalContentEl) {
                    const errorDiv = document.createElement('div');
                    errorDiv.style.color = '#ff6b6b';
                    errorDiv.style.marginTop = '5px';
                    errorDiv.textContent = errorMsg;
                    terminalContentEl.appendChild(errorDiv);
                }
            }
        }
    } catch (e) {
        // Silently fail to prevent further errors
    } finally {
        isLoggingError = false;
    }
}

/**
 * Initialize Console Panel
 */
function initializeConsolePanel() {
    consolePanelInitialized = true;
    updateConsolePanel();
}

/**
 * Update Console Panel Display
 */
function updateConsolePanel() {
    const consoleOutputEl = document.getElementById('console-output');
    if (!consoleOutputEl || !consolePanelInitialized) return;
    
    if (consoleOutput.length === 0) {
        consoleOutputEl.innerHTML = '<div style="color: #888;">No console output yet...</div>';
        return;
    }
    
    const html = consoleOutput.map((entry, index) => {
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const type = entry.type || 'log';
        const message = escapeHtml(entry.message);
        const stack = entry.stack ? escapeHtml(entry.stack) : '';
        
        let color = '#d4d4d4';
        let icon = '📋';
        if (type === 'error') {
            color = '#ff6b6b';
            icon = '❌';
        } else if (type === 'warn') {
            color = '#ffa500';
            icon = '⚠️';
        } else if (type === 'info') {
            color = '#4ec9b0';
            icon = 'ℹ️';
        }
        
        return `
            <div class="console-entry" style="margin-bottom: 8px; padding: 8px; background: #252526; border-radius: 3px; border-left: 3px solid ${color};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="color: #888; font-size: 10px; margin-bottom: 4px;">${timestamp}</div>
                        <div style="color: ${color};">
                            ${icon} ${message}
                        </div>
                        ${stack ? `
                            <details style="margin-top: 5px;">
                                <summary style="cursor: pointer; color: #888; font-size: 10px;">Stack Trace</summary>
                                <pre style="margin-top: 5px; font-size: 10px; color: #aaa; white-space: pre-wrap; word-break: break-all;">${stack}</pre>
                            </details>
                        ` : ''}
                    </div>
                    <button class="copy-error-btn" onclick="copyConsoleEntry(${index})" style="padding: 4px 8px; font-size: 10px; margin-left: 10px;">📋</button>
                </div>
            </div>
        `;
    }).join('');
    
    consoleOutputEl.innerHTML = html;
    // Auto-scroll to bottom
    consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
}

/**
 * Add to Console Output
 */
function addToConsoleOutput(type, message, stack = '') {
    consoleOutput.push({
        type,
        message,
        stack,
        timestamp: Date.now()
    });
    
    // Keep last 500 entries
    if (consoleOutput.length > 500) {
        consoleOutput.shift();
    }
    
    updateConsolePanel();
}

/**
 * Copy Console Entry
 */
async function copyConsoleEntry(index) {
    const entry = consoleOutput[index];
    if (!entry) return;
    
    let text = `${entry.type.toUpperCase()}: ${entry.message}`;
    if (entry.stack) {
        text += `\n\nStack Trace:\n${entry.stack}`;
    }
    
    await copyToClipboard(text);
}

/**
 * Copy All Console
 */
async function copyAllConsole() {
    const text = consoleOutput.map(entry => {
        let line = `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.type.toUpperCase()}: ${entry.message}`;
        if (entry.stack) {
            line += `\n${entry.stack}`;
        }
        return line;
    }).join('\n\n');
    
    await copyToClipboard(text);
}

/**
 * Clear Console
 */
function clearConsole() {
    consoleOutput = [];
    updateConsolePanel();
}

/**
 * Setup Copy Functionality
 */
function setupCopyFunctionality() {
    // Copy terminal button
    const copyTerminalBtn = document.getElementById('copy-terminal-btn');
    if (copyTerminalBtn) {
        copyTerminalBtn.addEventListener('click', async () => {
            let textToCopy = terminalContent;
            if (terminal) {
                // Try to get selected text first, otherwise get all
                const selection = terminal.getSelection();
                if (selection) {
                    textToCopy = selection;
                } else {
                    textToCopy = terminalBuffer.join('\n') || terminalContent;
                }
            }
            await copyToClipboard(textToCopy);
        });
    }
    
    // Clear terminal button
    const clearTerminalBtn = document.getElementById('clear-terminal-btn');
    if (clearTerminalBtn) {
        clearTerminalBtn.addEventListener('click', () => {
            if (terminal) {
                terminal.clear();
                terminal.writeln('🚀 BEAST MODE IDE Terminal');
                terminal.writeln('============================================================');
                terminal.writeln('');
                terminal.writeln('Terminal cleared.');
                terminal.writeln('');
                terminal.writeln('$ ');
            }
            terminalBuffer = [];
            terminalContent = '';
            const terminalContentEl = document.getElementById('terminal-content');
            if (terminalContentEl) {
                terminalContentEl.innerHTML = '';
            }
        });
    }
    
    // Right-click context menu for terminal (copy selected)
    const terminalContentEl = document.getElementById('terminal-content');
    if (terminalContentEl) {
        terminalContentEl.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            const selection = window.getSelection().toString();
            if (selection) {
                await copyToClipboard(selection);
            }
        });
    }
}

/**
 * Intercept Console Errors
 */
function interceptConsoleErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;
    
    // Store original for use in logErrorToTerminal
    originalConsoleError = originalError;
    
    console.error = function(...args) {
        originalError.apply(console, args);
        const errorMsg = args.map(arg => {
            if (arg instanceof Error) {
                addToConsoleOutput('error', arg.message, arg.stack);
                return `❌ Error: ${arg.message}\nStack: ${arg.stack || 'N/A'}`;
            }
            const msg = String(arg);
            addToConsoleOutput('error', msg);
            return msg;
        }).join(' ');
        logErrorToTerminal(errorMsg);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        const warnMsg = args.map(arg => String(arg)).join(' ');
        addToConsoleOutput('warn', warnMsg);
        addToTerminalBuffer('⚠️ ' + warnMsg);
        if (terminal) {
            terminal.writeln('⚠️ ' + warnMsg);
        }
    };
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        const logMsg = args.map(arg => String(arg)).join(' ');
        addToConsoleOutput('log', logMsg);
    };
    
    console.info = function(...args) {
        originalInfo.apply(console, args);
        const infoMsg = args.map(arg => String(arg)).join(' ');
        addToConsoleOutput('info', infoMsg);
    };
    
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
        const errorMsg = `❌ Unhandled Error: ${event.message}\nFile: ${event.filename}:${event.lineno}:${event.colno}\nStack: ${event.error?.stack || 'N/A'}`;
        addToConsoleOutput('error', `Unhandled Error: ${event.message}`, event.error?.stack || `File: ${event.filename}:${event.lineno}:${event.colno}`);
        logErrorToTerminal(errorMsg);
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
        const stack = event.reason instanceof Error ? event.reason.stack : 'N/A';
        const errorMsg = `❌ Unhandled Promise Rejection: ${reason}\nStack: ${stack}`;
        addToConsoleOutput('error', `Unhandled Promise Rejection: ${reason}`, stack);
        logErrorToTerminal(errorMsg);
    });
}

// Make functions globally available
window.checkSecrets = checkSecrets;
window.checkArchitecture = checkArchitecture;
window.runSelfHealing = runSelfHealing;
window.queryOracle = queryOracle;
window.copyError = copyError;
window.copyToClipboard = copyToClipboard;
window.copyConsoleEntry = copyConsoleEntry;
window.copyAllConsole = copyAllConsole;
window.clearConsole = clearConsole;
