"use client";

import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: 'default' | 'minimal' | 'card';
  className?: string;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Retry',
  variant = 'default',
  className = ''
}: ErrorMessageProps) {
  const content = (
    <div className={`text-center ${className}`}>
      <div className="text-red-400 text-lg mb-2">
        {variant === 'minimal' ? '⚠️' : '❌'} {title}
      </div>
      <p className="text-slate-400 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {retryText}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`p-4 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {content}
    </div>
  );
}

