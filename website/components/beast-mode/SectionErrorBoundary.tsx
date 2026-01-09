"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Section-level Error Boundary
 * Wraps individual dashboard sections to prevent one section's error from crashing the entire dashboard
 */
export class SectionErrorBoundary extends Component<Props, State> {
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
    console.error(`[SectionErrorBoundary] Error in ${this.props.sectionName || 'section'}:`, error, errorInfo);
    
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error monitoring
    if (typeof window !== 'undefined') {
      try {
        const { getErrorMonitor } = require('../../lib/error-monitoring');
        const errorMonitor = getErrorMonitor();
        errorMonitor.captureError(error, {
          component: this.props.sectionName || 'SectionErrorBoundary',
          metadata: {
            componentStack: errorInfo.componentStack,
            section: this.props.sectionName
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-red-950/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              {this.props.sectionName ? `${this.props.sectionName} Error` : 'Section Error'}
            </CardTitle>
            <CardDescription className="text-red-300">
              Something went wrong in this section. The rest of the dashboard is still working.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="p-4 bg-slate-900/50 rounded border border-slate-800">
                <div className="text-sm font-mono text-red-400 mb-2">
                  {this.state.error.message}
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-400 cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-slate-700 text-slate-300"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
