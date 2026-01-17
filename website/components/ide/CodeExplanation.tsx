'use client';

/**
 * Code Explanation Component
 * 
 * Explains code blocks, errors, and algorithms with visual aids
 */

import { useState, useEffect } from 'react';

interface CodeExplanationProps {
  code: string;
  language?: string;
  explanation?: string;
  onClose?: () => void;
}

export default function CodeExplanation({
  code,
  language = 'typescript',
  explanation,
  onClose,
}: CodeExplanationProps) {
  const [isLoading, setIsLoading] = useState(!explanation);
  const [explanationText, setExplanationText] = useState(explanation || '');

  // Fetch explanation if not provided
  useEffect(() => {
    if (!explanation && code) {
      fetch('/api/beast-mode/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
        .then(res => res.json())
        .then(data => {
          setExplanationText(data.explanation || 'No explanation available');
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to get explanation:', err);
          setExplanationText('Failed to generate explanation');
          setIsLoading(false);
        });
    }
  }, [code, language, explanation]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Code Explanation</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ×
          </button>
        )}
      </div>

      {/* Code */}
      <div className="bg-slate-950 rounded border border-slate-700 p-3">
        <div className="text-xs text-slate-400 mb-2">Code ({language}):</div>
        <pre className="text-xs text-slate-300 overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>

      {/* Explanation */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Explanation:</div>
        {isLoading ? (
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Generating explanation...</span>
          </div>
        ) : (
          <div className="bg-slate-800 rounded border border-slate-700 p-3">
            <div className="text-sm text-slate-200 whitespace-pre-wrap">
              {explanationText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
