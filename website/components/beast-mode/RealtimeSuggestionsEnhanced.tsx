'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sparkles, Zap, X, Settings, CheckCircle2 } from 'lucide-react';

interface Suggestion {
  text: string;
  type: string;
  score: number;
  source: string;
  confidence?: number;
}

interface QualityHint {
  message: string | null;
  severity: 'info' | 'warning' | 'error';
  suggestion: string | null;
}

interface RealtimeSuggestionsEnhancedProps {
  repo: string;
  filePath: string;
  content: string;
  cursorLine: number;
  cursorColumn: number;
  onSuggestionSelect?: (suggestion: string) => void;
  compact?: boolean;
}

export default function RealtimeSuggestionsEnhanced({
  repo,
  filePath,
  content,
  cursorLine,
  cursorColumn,
  onSuggestionSelect,
  compact = false,
}: RealtimeSuggestionsEnhancedProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [qualityHint, setQualityHint] = useState<QualityHint | null>(null);
  const [loading, setLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [debounceMs, setDebounceMs] = useState(300);

  const fetchSuggestions = useCallback(async () => {
    if (!enabled || !content || loading) return;

    setLoading(true);
    try {
      const { fetchWithRetry } = require('@/lib/api-retry');
      const response = await fetchWithRetry('/api/codebase/suggestions', {
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
      }, {
        maxRetries: 2,
        initialDelay: 500
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setQualityHint(data.qualityHint || null);
        
        // Track analytics
        if (typeof window !== 'undefined' && data.suggestions?.length > 0) {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('realtime-suggestions', `${data.suggestions.length}-suggestions`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [repo, filePath, content, cursorLine, cursorColumn, useLLM, enabled, loading]);

  // Debounce suggestions with configurable delay
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, cursorLine, cursorColumn, fetchSuggestions, enabled, debounceMs]);

  // Keyboard navigation
  useEffect(() => {
    if (!enabled || suggestions.length === 0) {
      setSelectedIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setSelectedIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, enabled]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.text);
    }
    setSelectedIndex(-1);
    
    // Track analytics
    if (typeof window !== 'undefined') {
      const { getAnalytics } = require('@/lib/analytics');
      const analytics = getAnalytics();
      analytics.trackFeatureUse('realtime-suggestion-applied', suggestion.type);
      analytics.track('event', 'code', 'suggestion-applied', suggestion.source, Math.round(suggestion.score * 100));
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
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Real-Time Suggestions
          </CardTitle>
          <CardDescription className="text-slate-400">
            Inline code completion and quality hints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setEnabled(true)}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Enable Suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white font-medium">Suggestions</span>
            {loading && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {useLLM && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs">AI</Badge>}
            <Button
              onClick={() => setEnabled(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {suggestions.length > 0 && (
          <div className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left p-2 rounded text-xs font-mono bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 transition-colors ${
                  selectedIndex === index ? 'border-cyan-500 bg-cyan-500/10' : ''
                }`}
              >
                {suggestion.text.substring(0, 50)}{suggestion.text.length > 50 ? '...' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Real-Time Suggestions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Line {cursorLine}, Column {cursorColumn} • {filePath.split('/').pop()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              <span>AI</span>
            </label>
            <Button
              onClick={() => setEnabled(false)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Debounce Delay</span>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="100"
                  value={debounceMs}
                  onChange={(e) => setDebounceMs(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{debounceMs}ms</span>
              </div>
            </div>
          )}

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
              <span className="ml-3 text-slate-400 text-sm">Analyzing code...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Suggestions ({suggestions.length})
                </p>
                {selectedIndex >= 0 && (
                  <span className="text-xs text-slate-400">
                    Press Enter to apply • ↑↓ to navigate
                  </span>
                )}
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedIndex === index
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm text-white font-mono block break-all">
                        {suggestion.text}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge className={getSourceColor(suggestion.source)}>
                        {suggestion.source}
                      </Badge>
                      <span className="text-xs text-slate-500 min-w-[3rem] text-right">
                        {(suggestion.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Type: {suggestion.type}</span>
                    <span>•</span>
                    <span>Click or press Enter to apply</span>
                    {selectedIndex === index && (
                      <>
                        <span>•</span>
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">No suggestions available</p>
              <p className="text-xs mt-1">Start typing to get real-time suggestions</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400">
              💡 Suggestions update as you type. Enable AI for better quality suggestions. Use arrow keys to navigate.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
