"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export default function SelfImprovement() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingFixes, setApplyingFixes] = useState<Set<number>>(new Set());
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/beast-mode/self-improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = async (recommendation: any, index: number) => {
    setApplyingFixes(prev => new Set(prev).add(index));
    
    try {
      const response = await fetch('/api/beast-mode/self-improve/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation,
          fixType: recommendation.type || recommendation.title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }

      const result = await response.json();
      setAppliedFixes(prev => new Set(prev).add(index));
      
      // Show success message
      alert(`✅ Fix applied successfully! ${result.message || ''}`);
      
      // Refresh analysis after fix
      setTimeout(() => {
        handleAnalyze();
      }, 2000);
    } catch (err: any) {
      alert(`❌ Failed to apply fix: ${err.message}`);
    } finally {
      setApplyingFixes(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Self-Improvement Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400">
            Analyze this BEAST MODE website and get AI-powered recommendations for improvements.
          </p>
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-white text-black hover:bg-slate-100"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
                Analyzing...
              </span>
            ) : (
              'Analyze This Site'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="text-red-400">{error}</div>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Quality Score</div>
                  <div className="text-3xl font-bold text-gradient-cyan">{results.currentScore || 'N/A'}</div>
                  <div className="text-xs text-slate-500">/100</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Files Analyzed</div>
                  <div className="text-2xl font-bold text-white">{results.totalFiles || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Issues Found</div>
                  <div className="text-2xl font-bold text-white">{results.issues?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Recommendations</div>
                  <div className="text-2xl font-bold text-white">{results.recommendations?.length || 0}</div>
                </div>
              </div>

              {results.metrics && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-white font-semibold mb-3 text-sm">Codebase Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Total Lines</div>
                      <div className="text-white font-semibold">{results.totalLines?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Error Boundaries</div>
                      <div className={`font-semibold ${results.metrics.hasErrorBoundary ? 'text-green-400' : 'text-red-400'}`}>
                        {results.metrics.hasErrorBoundary ? '✓' : '✗'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Analytics</div>
                      <div className={`font-semibold ${results.metrics.hasAnalytics ? 'text-green-400' : 'text-red-400'}`}>
                        {results.metrics.hasAnalytics ? '✓' : '✗'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">SEO Metadata</div>
                      <div className={`font-semibold ${results.metrics.hasSEO ? 'text-green-400' : 'text-red-400'}`}>
                        {results.metrics.hasSEO ? '✓' : '✗'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Lazy Loading</div>
                      <div className={`font-semibold ${results.metrics.hasLazyLoading ? 'text-green-400' : 'text-red-400'}`}>
                        {results.metrics.hasLazyLoading ? '✓' : '✗'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results.issues && results.issues.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-white font-semibold mb-3">Issues Found</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.issues.slice(0, 10).map((issue: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                          issue.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          issue.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {issue.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium">{issue.type}</div>
                          <div className="text-slate-400 text-xs truncate">{issue.file}</div>
                          <div className="text-slate-300 text-sm mt-1">{issue.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.recommendations && results.recommendations.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-white font-semibold mb-3">Actionable Recommendations</h4>
                  <ul className="space-y-3">
                    {results.recommendations.map((rec: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
                        <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{rec.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <div className="text-slate-400 text-sm mb-2">{rec.description}</div>
                          {rec.action && (
                            <div className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-2 py-1 rounded mt-2">
                              💡 {rec.action}
                            </div>
                          )}
                          {rec.file && (
                            <div className="text-slate-500 text-xs mt-1">
                              File: <code className="bg-slate-800 px-1 rounded">{rec.file}</code>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {appliedFixes.has(idx) ? (
                            <div className="text-green-400 text-sm flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Applied
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleApplyFix(rec, idx)}
                              disabled={applyingFixes.has(idx)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {applyingFixes.has(idx) ? (
                                <span className="flex items-center gap-1">
                                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                  Applying...
                                </span>
                              ) : (
                                '🔧 Apply Fix'
                              )}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

