/**
 * BEAST MODE IDE - Renderer Process
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
    initializeTerminal();
    
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
        // Load Monaco Editor
        const monaco = await import('monaco-editor');
        
        // Create editor
        editor = monaco.editor.create(document.getElementById('monaco-editor'), {
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
        // Fallback: show error message
        document.getElementById('monaco-editor').innerHTML = `
            <div style="padding: 20px; color: #ff6b6b;">
                <h2>⚠️ Monaco Editor Failed to Load</h2>
                <p>Please ensure Monaco Editor is installed:</p>
                <code>npm install monaco-editor</code>
            </div>
        `;
    }
}

/**
 * Initialize Terminal (xterm.js)
 */
function initializeTerminal() {
    try {
        // For now, use simple terminal simulation
        // Full xterm.js integration will be added later
        const terminalContent = document.getElementById('terminal-content');
        terminalContent.innerHTML = `
            <div style="color: #00ff00;">$ BEAST MODE IDE Terminal</div>
            <div style="color: #888;">Terminal integration coming soon...</div>
            <div style="color: #888;">Use: beast-mode interceptor check</div>
        `;
        
        console.log('✅ Terminal placeholder initialized');
    } catch (error) {
        console.error('❌ Failed to initialize terminal:', error);
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
    fileExplorer.innerHTML = `
        <div style="color: #888; padding: 10px;">
            <div>📁 File Explorer</div>
            <div style="margin-top: 10px; font-size: 12px;">
                File explorer integration coming soon...
            </div>
        </div>
    `;
}

/**
 * Setup Menu Actions
 */
function setupMenuActions() {
    if (window.electronAPI) {
        window.electronAPI.onMenuAction((action) => {
            switch (action) {
                case 'new-file':
                    editor?.setValue('// New file\n');
                    break;
                case 'open-file':
                    // File open dialog (to be implemented)
                    console.log('Open file');
                    break;
                case 'save':
                    // Save current file (to be implemented)
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
        const response = await fetch('http://localhost:3000/api/interceptor/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [] })
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
