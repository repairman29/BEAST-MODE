/**
 * Error Boundary Component for BEAST MODE IDE
 * Catches errors and displays helpful error messages
 */

class ErrorBoundary {
    constructor() {
        this.errors = [];
    }

    /**
     * Catch and handle errors
     */
    catchError(error, errorInfo) {
        this.errors.push({
            error,
            errorInfo,
            timestamp: Date.now()
        });

        // Log to console
        console.error('Error Boundary caught:', error, errorInfo);

        // Display error in UI
        this.displayError(error, errorInfo);
    }

    /**
     * Display error in UI
     */
    displayError(error, errorInfo) {
        const errorContainer = document.getElementById('error-boundary-container');
        if (!errorContainer) {
            // Create error container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'error-boundary-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #3a1f1f;
                border-bottom: 3px solid #ff6b6b;
                padding: 15px 20px;
                z-index: 10000;
                color: #ff6b6b;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.insertBefore(container, document.body.firstChild);
        }

        const errorHtml = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <strong>⚠️ Error Caught by Error Boundary</strong>
                    <div style="margin-top: 5px; font-size: 13px;">
                        ${error.message || 'Unknown error'}
                    </div>
                    <details style="margin-top: 10px; font-size: 11px;">
                        <summary style="cursor: pointer; color: #888;">Stack Trace</summary>
                        <pre style="margin-top: 5px; color: #aaa; white-space: pre-wrap;">${error.stack || 'N/A'}</pre>
                    </details>
                </div>
                <div style="display: flex; gap: 10px; margin-left: 20px;">
                    <button onclick="window.errorBoundary?.copyError(${this.errors.length - 1})" 
                            style="padding: 5px 10px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        📋 Copy
                    </button>
                    <button onclick="window.errorBoundary?.dismissError()" 
                            style="padding: 5px 10px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        ✕ Dismiss
                    </button>
                    <button onclick="location.reload()" 
                            style="padding: 5px 10px; background: #00ff00; color: #000; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        🔄 Reload
                    </button>
                </div>
            </div>
        `;

        const container = document.getElementById('error-boundary-container');
        if (container) {
            container.innerHTML = errorHtml;
        }
    }

    /**
     * Copy error to clipboard
     */
    async copyError(index) {
        const error = this.errors[index];
        if (!error) return;

        const text = `Error: ${error.error.message}\n\nStack Trace:\n${error.error.stack || 'N/A'}\n\nComponent Stack:\n${error.errorInfo?.componentStack || 'N/A'}`;
        
        try {
            await navigator.clipboard.writeText(text);
            alert('✅ Error copied to clipboard!');
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    }

    /**
     * Dismiss error
     */
    dismissError() {
        const container = document.getElementById('error-boundary-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = [];
        const container = document.getElementById('error-boundary-container');
        if (container) {
            container.remove();
        }
    }
}

// Create global error boundary instance
window.errorBoundary = new ErrorBoundary();

// Catch unhandled errors
window.addEventListener('error', (event) => {
    window.errorBoundary.catchError(event.error, {
        componentStack: event.filename ? `File: ${event.filename}:${event.lineno}:${event.colno}` : 'N/A'
    });
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
    
    window.errorBoundary.catchError(error, {
        componentStack: 'Unhandled Promise Rejection'
    });
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
}
