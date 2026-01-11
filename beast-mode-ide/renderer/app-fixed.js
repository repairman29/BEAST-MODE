/**
 * BEAST MODE IDE - Renderer Process (Fixed)
 * Main application logic for Electron IDE
 */

// Initialize Monaco Editor
let editor;
let terminal;

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
    
    console.log('✅ BEAST MODE IDE Ready!');
});

/**
 * Initialize Monaco Editor
 */
async function initializeMonacoEditor() {
    try {
        // Try direct Monaco import first (simpler, more reliable)
        const monaco = await import('monaco-editor');
        
        const container = document.getElementById('monaco-editor');
        if (!container) {
            throw new Error('monaco-editor container not found');
        }
        
        // Create editor
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
    } catch (error) {
        console.error('❌ Failed to initialize Monaco Editor:', error);
        const container = document.getElementById('monaco-editor');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; color: #ff6b6b;">
                    <h2>⚠️ Monaco Editor Failed to Load</h2>
                    <p>Error: ${error.message}</p>
                    <p>Please ensure Monaco Editor is installed:</p>
                    <code>npm install monaco-editor</code>
                </div>
            `;
        }
    }
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
            const { Terminal } = await import('xterm');
            const { FitAddon } = await import('xterm-addon-fit');
            await import('xterm/css/xterm.css');
            
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
            terminal.writeln('🚀 BEAST MODE IDE Terminal');
            terminal.writeln('============================================================');
            terminal.writeln('');
            terminal.writeln('Welcome! Terminal is ready.');
            terminal.writeln('');
            terminal.writeln('$ ');
            
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
        const terminalContent = document.getElementById('terminal-content');
        if (terminalContent) {
            terminalContent.innerHTML = `
                <div style="color: #ff6b6b; padding: 10px;">
                    ⚠️ Terminal failed to load: ${error.message}
                </div>
            `;
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
                resultsDiv.innerHTML = `
                    <div style="color: #ff6b6b;">
                        ❌ Found ${result.issues?.length || 0} issue(s)
                    </div>
                `;
            }
        }
    } catch (error) {
        if (resultsDiv) {
            resultsDiv.innerHTML = `<div style="color: #ff6b6b;">❌ Error: ${error.message}</div>`;
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
        if (resultsDiv) {
            resultsDiv.innerHTML = `<div style="color: #ff6b6b;">❌ Error: ${error.message}</div>`;
        }
    }
}

// Make functions globally available
window.checkSecrets = checkSecrets;
window.checkArchitecture = checkArchitecture;
window.runSelfHealing = runSelfHealing;
window.queryOracle = queryOracle;
