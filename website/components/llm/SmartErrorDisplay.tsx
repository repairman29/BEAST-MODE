"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw, Home, Sparkles, Loader2 } from 'lucide-react';
import ErrorDisplay from '../ui/ErrorDisplay';

interface SmartErrorDisplayProps {
  error: Error | unknown;
  context?: {
    code?: string;
    statusCode?: number;
    userMessage?: string;
    recoveryAction?: {
      label: string;
      action: () => void;
    };
    technicalDetails?: string;
  };
  onRetry?: () => void;
  showTechnical?: boolean;
}

export default function SmartErrorDisplay({ 
  error, 
  context, 
  onRetry,
  showTechnical = false 
}: SmartErrorDisplayProps) {
  const [enhancedError, setEnhancedError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);

  useEffect(() => {
    // Auto-enhance error on mount
    if (error && context?.code) {
      enhanceError();
    }
  }, [error]);

  const enhanceError = async () => {
    if (!error || !context?.code) return;

    setIsEnhancing(true);
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const response = await fetch('/api/llm/error-enhancement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMessage,
          context: context.userMessage || 'An error occurred in the application',
          code: context.code,
          options: {
            includeFix: true,
            includeContext: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEnhancedError(data.enhanced?.message || data.enhanced);
        setShowEnhanced(true);
      }
    } catch (err) {
      console.warn('Failed to enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorDisplay 
        error={error} 
        context={context} 
        onRetry={onRetry}
        showTechnical={showTechnical}
      />
      
      {context?.code && (
        <Card className="bg-slate-900/90 border-blue-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white text-sm">AI-Enhanced Explanation</CardTitle>
              </div>
              {!showEnhanced && !isEnhancing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={enhanceError}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Enhance Error
                </Button>
              )}
            </div>
          </CardHeader>
          {isEnhancing && (
            <CardContent>
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing error with AI...</span>
              </div>
            </CardContent>
          )}
          {showEnhanced && enhancedError && (
            <CardContent>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {enhancedError}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnhanced(false)}
                className="mt-3"
              >
                Hide Enhanced Explanation
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
