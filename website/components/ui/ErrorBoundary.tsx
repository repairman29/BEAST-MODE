"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Ensure React is in scope for JSX
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import SmartErrorDisplay from '../llm/SmartErrorDisplay';

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
        const { captureError } = require('@/lib/monitoring');
        captureError(error, {
          action: 'ErrorBoundary',
          metadata: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
          },
          severity: 'error'
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
          <SmartErrorDisplay
            error={this.state.error || new Error('An unexpected error occurred')}
            context={{
              code: this.state.errorInfo?.componentStack || '',
              userMessage: 'An error occurred in the application',
              technicalDetails: this.state.error?.stack
            }}
            onRetry={this.handleReset}
            showTechnical={true}
          />
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

