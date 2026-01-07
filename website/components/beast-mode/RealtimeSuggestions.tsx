'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Suggestion {
  text: string;
  type: string;
  score: number;
  source: string;
}

interface QualityHint {
  message: string | null;
  severity: 'info' | 'warning' | 'error';
  suggestion: string | null;
}

interface RealtimeSuggestionsProps {
  repo: string;
  filePath: string;
  content: string;
  cursorLine: number;
  cursorColumn: number;
  onSuggestionSelect?: (suggestion: string) => void;
}

export default function RealtimeSuggestions({
  repo,
  filePath,
  content,
  cursorLine,
  cursorColumn,
  onSuggestionSelect,
}: RealtimeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [qualityHint, setQualityHint] = useState<QualityHint | null>(null);
  const [loading, setLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    if (!enabled || !content || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/codebase/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          filePath,
          content,
          cursorLine,
          cursorColumn,
          useLLM,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setQualityHint(data.qualityHint || null);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [repo, filePath, content, cursorLine, cursorColumn, useLLM, enabled, loading]);

  // Debounce suggestions
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [content, cursorLine, cursorColumn, fetchSuggestions, enabled]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.text);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'llm':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'pattern':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (!enabled) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Real-Time Suggestions</CardTitle>
          <CardDescription className="text-slate-400">
            Inline code completion and quality hints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setEnabled(true)}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            Enable Suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Real-Time Suggestions</CardTitle>
            <CardDescription className="text-slate-400">
              Line {cursorLine}, Column {cursorColumn}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              AI
            </label>
            <Button
              onClick={() => setEnabled(false)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Disable
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quality Hint */}
          {qualityHint && qualityHint.message && (
            <div className={`p-3 rounded-lg border ${getSeverityColor(qualityHint.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{qualityHint.message}</p>
                  {qualityHint.suggestion && (
                    <p className="text-xs mt-1 opacity-80">{qualityHint.suggestion}</p>
                  )}
                </div>
                <Badge className={getSeverityColor(qualityHint.severity)}>
                  {qualityHint.severity}
                </Badge>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Suggestions ({suggestions.length})
              </p>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm text-white font-mono">{suggestion.text}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSourceColor(suggestion.source)}>
                        {suggestion.source}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {(suggestion.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Type: {suggestion.type}</span>
                    <span>•</span>
                    <span>Click to apply</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No suggestions available</p>
              <p className="text-xs mt-1">Start typing to get suggestions</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400">
              💡 Suggestions update as you type. Enable AI for better quality suggestions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

