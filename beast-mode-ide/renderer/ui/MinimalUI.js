/**
 * BEAST MODE IDE - Minimal UI
 * Jony Ive Inspired Design
 * 
 * Auto-hiding UI, clean editor view, contextual panels
 */

class MinimalUI {
    constructor() {
        this.titleBarVisible = true;
        this.statusBarVisible = true;
        this.panelVisible = false;
        this.focusMode = false;
        this.lastActivity = Date.now();
        
        this.init();
    }
    
    init() {
        this.createTitleBar();
        this.createStatusBar();
        this.setupAutoHide();
        this.setupFocusMode();
        this.setupPanelSystem();
    }
    
    /**
     * Create minimal title bar (auto-hides)
     */
    createTitleBar() {
        const titleBar = document.createElement('div');
        titleBar.id = 'minimal-title-bar';
        titleBar.className = 'minimal-title-bar';
        titleBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 44px;
            background: rgba(245, 245, 247, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(209, 209, 214, 0.5);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 1000;
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            font-size: 13px;
            font-weight: 500;
            color: #1D1D1F;
        `;
        
        titleBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 600;">BEAST MODE</span>
                <span style="color: #86868B;">IDE</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="color: #34C759; font-size: 11px;">Quality: 95</span>
                <span style="color: #86868B; font-size: 11px;">🛡️</span>
            </div>
        `;
        
        document.body.insertBefore(titleBar, document.body.firstChild);
        this.titleBar = titleBar;
    }
    
    /**
     * Create minimal status bar (auto-hides)
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.id = 'minimal-status-bar';
        statusBar.className = 'minimal-status-bar';
        statusBar.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 22px;
            background: rgba(245, 245, 247, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(209, 209, 214, 0.5);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            z-index: 1000;
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            font-size: 11px;
            color: #86868B;
        `;
        
        statusBar.innerHTML = `
            <span>Ready</span>
            <span>TypeScript</span>
        `;
        
        document.body.appendChild(statusBar);
        this.statusBar = statusBar;
    }
    
    /**
     * Setup auto-hide functionality
     */
    setupAutoHide() {
        let hideTimeout;
        
        const resetHide = () => {
            this.lastActivity = Date.now();
            this.showUI();
            
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (Date.now() - this.lastActivity > 3000) {
                    this.hideUI();
                }
            }, 3000);
        };
        
        // Track activity
        document.addEventListener('mousemove', resetHide);
        document.addEventListener('keydown', resetHide);
        document.addEventListener('click', resetHide);
        
        // Initial hide
        setTimeout(() => {
            if (Date.now() - this.lastActivity > 3000) {
                this.hideUI();
            }
        }, 3000);
    }
    
    /**
     * Show UI elements
     */
    showUI() {
        if (this.titleBar) {
            this.titleBar.style.opacity = '1';
            this.titleBar.style.transform = 'translateY(0)';
        }
        if (this.statusBar) {
            this.statusBar.style.opacity = '1';
            this.statusBar.style.transform = 'translateY(0)';
        }
    }
    
    /**
     * Hide UI elements
     */
    hideUI() {
        if (this.focusMode) return; // Don't hide in focus mode
        
        if (this.titleBar) {
            this.titleBar.style.opacity = '0';
            this.titleBar.style.transform = 'translateY(-100%)';
        }
        if (this.statusBar) {
            this.statusBar.style.opacity = '0';
            this.statusBar.style.transform = 'translateY(100%)';
        }
    }
    
    /**
     * Setup focus mode
     */
    setupFocusMode() {
        // Toggle focus mode with Cmd/Ctrl + K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleFocusMode();
            }
        });
    }
    
    /**
     * Toggle focus mode
     */
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        document.body.classList.toggle('focus-mode', this.focusMode);
        
        if (this.focusMode) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
    
    /**
     * Setup panel system
     */
    setupPanelSystem() {
        // Panel will be created by panel components
        // This is just the framework
    }
    
    /**
     * Show panel
     */
    showPanel(panelElement) {
        if (!panelElement) return;
        
        panelElement.classList.add('panel-visible');
        panelElement.classList.remove('panel-hidden');
        this.panelVisible = true;
    }
    
    /**
     * Hide panel
     */
    hidePanel(panelElement) {
        if (!panelElement) return;
        
        panelElement.classList.add('panel-hidden');
        panelElement.classList.remove('panel-visible');
        this.panelVisible = false;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.minimalUI = new MinimalUI();
    });
} else {
    window.minimalUI = new MinimalUI();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MinimalUI;
}
