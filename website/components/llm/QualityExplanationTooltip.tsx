"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { HelpCircle, Sparkles, Loader2, X } from 'lucide-react';

interface QualityExplanationTooltipProps {
  score: number;
  code?: string;
  issues?: string[];
  repo?: string;
  filePath?: string;
  children?: React.ReactNode;
}

export default function QualityExplanationTooltip({
  score,
  code,
  issues = [],
  repo,
  filePath,
  children
}: QualityExplanationTooltipProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchExplanation = async () => {
    if (explanation || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm/quality-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          code: code || '',
          issues,
          options: {
            repo,
            filePath
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation || 'No explanation available');
      }
    } catch (error) {
      console.warn('Failed to fetch quality explanation:', error);
      setExplanation('Unable to generate explanation at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !explanation && !isLoading) {
      fetchExplanation();
    }
  };

  return (
    <div className="relative inline-block">
      <div onClick={() => handleOpenChange(!isOpen)}>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => handleOpenChange(false)}
          />
          {/* Popover */}
          <div className="absolute z-50 w-80 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="font-semibold text-white text-sm">Quality Score Explanation</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating explanation...</span>
                </div>
              )}

              {!isLoading && explanation && (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </div>
              )}

              {!isLoading && !explanation && (
                <div className="text-slate-400 text-sm">
                  Click to generate explanation
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
