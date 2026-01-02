"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Ensure React is in scope for JSX
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error monitoring
    if (typeof window !== 'undefined') {
      try {
        const { getErrorMonitor } = require('@/lib/error-monitoring');
        const errorMonitor = getErrorMonitor();
        errorMonitor.captureError(error, {
          component: 'ErrorBoundary',
          metadata: {
            componentStack: errorInfo.componentStack,
          },
        });
      } catch (e) {
        // Silently fail if error monitoring not available
        console.debug('Error monitoring not available:', e);
      }
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <Card className="bg-slate-900/95 border-red-500/50 max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-2">Error Details:</div>
                <div className="text-red-300 font-mono text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </div>
                {this.state.error?.stack && (
                  <details className="mt-3">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                      Show stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-slate-500 overflow-auto max-h-40 p-2 bg-slate-900 rounded">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Reload Page
                </Button>
              </div>

              <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
                💡 If this error persists, please report it to support@beastmode.dev
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export both default and named for compatibility
// Export the class component
export { ErrorBoundary };
export default ErrorBoundary;

// Also export a function wrapper for better Next.js compatibility
export function ErrorBoundaryWrapper({ children, fallback, onError }: Props) {
  return <ErrorBoundary fallback={fallback} onError={onError}>{children}</ErrorBoundary>;
}

