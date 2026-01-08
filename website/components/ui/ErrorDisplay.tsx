"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { EnhancedErrorHandler } from '@/lib/error-handler';

interface ErrorDisplayProps {
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

export default function ErrorDisplay({ 
  error, 
  context, 
  onRetry,
  showTechnical = false 
}: ErrorDisplayProps) {
  const formatted = EnhancedErrorHandler.formatError(error, context);

  return (
    <Card className="bg-slate-900/90 border-slate-800 max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <CardTitle className="text-white">Something went wrong</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">{formatted.message}</p>
        
        {formatted.recovery && (
          <div className="flex gap-2">
            <Button
              onClick={() => formatted.recovery!.action()}
              className="flex-1"
            >
              {formatted.recovery.label === 'Retry' && <RefreshCw className="w-4 h-4 mr-2" />}
              {formatted.recovery.label === 'Go Home' && <Home className="w-4 h-4 mr-2" />}
              {formatted.recovery.label}
            </Button>
            {onRetry && formatted.recovery.label !== 'Retry' && (
              <Button variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        )}

        {showTechnical && formatted.technical && (
          <details className="mt-4">
            <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
              Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-slate-800 rounded text-xs text-slate-400 overflow-auto">
              {formatted.technical}
              {formatted.code && `\nError Code: ${formatted.code}`}
              {formatted.statusCode && `\nStatus: ${formatted.statusCode}`}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
