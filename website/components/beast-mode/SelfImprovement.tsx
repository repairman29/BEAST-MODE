"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { getAnalytics } from '../../lib/analytics';

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
    // Ask user about git operations
    const shouldCommit = confirm('Apply fix and commit changes to git?');
    const shouldPush = shouldCommit && confirm('Push to remote repository?');
    const shouldDeploy = shouldPush && confirm('Deploy to production? (This will trigger deployment)');

    setApplyingFixes(prev => new Set(prev).add(index));
    
    try {
      const response = await fetch('/api/beast-mode/self-improve/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation,
          fixType: recommendation.type || recommendation.title,
          gitOptions: {
            commit: shouldCommit,
            push: shouldPush,
            deploy: shouldDeploy
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }

      const result = await response.json();
      
      if (result.success) {
        setAppliedFixes(prev => new Set(prev).add(index));
        
        // Trigger gamification event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-gamification', { detail: { action: 'fix' } }));
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `✨ Fix applied! +20 XP!`
            }
          }));
        }
        
        // Build detailed success message
        let message = `✅ Fix applied!\n\n`;
        
        if (result.filesModified && result.filesModified.length > 0) {
          message += `Modified ${result.filesModified.length} file(s):\n${result.filesModified.slice(0, 3).map((f: string) => `  • ${f}`).join('\n')}${result.filesModified.length > 3 ? `\n  ... and ${result.filesModified.length - 3} more` : ''}\n\n`;
        }
        
        // Add git information
        if (result.git) {
          if (result.git.committed) {
            message += `📦 Git: ${result.git.message}`;
            if (result.git.commitHash) {
              message += `\n   Commit: ${result.git.commitHash.substring(0, 7)}`;
            }
          } else if (result.git.error) {
            message += `\n⚠️ Git: ${result.git.message}`;
          }
        }
        
        alert(message);
        
        // Refresh analysis after fix
        setTimeout(() => {
          handleAnalyze();
        }, 2000);
      } else {
        throw new Error(result.error || result.message || 'Failed to apply fix');
      }
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
    <div className="w-full max-w-7xl space-y-6 mx-auto pt-4 animate-in fade-in duration-500">
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-slate-700/50 card-polish stagger-item shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-xl md:text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl">✨</span>
                </div>
                Auto-Fix Code Issues
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                One click fixes common issues automatically. Code fixed. Git committed. You're done. It's like magic, but real. 🪄
              </CardDescription>
            </div>
            {results && (
              <div className="hidden md:flex flex-col items-end gap-1">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Fixed</div>
                <div className="text-2xl font-bold text-green-400">{appliedFixes.size}</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white smooth-transition hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none px-8 py-3 text-base font-semibold shadow-lg shadow-cyan-500/20"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                <span className="animate-pulse">Analyzing...</span>
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Analyze This Site
              </>
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
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-slate-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                <span className="text-xl">📊</span>
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Quality Score</div>
                  <div className={`text-4xl font-bold mb-1 ${
                    (results.currentScore || 0) >= 80 ? 'text-green-400' :
                    (results.currentScore || 0) >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {results.currentScore || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">/100</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Files Analyzed</div>
                  <div className="text-4xl font-bold text-white mb-1">{results.totalFiles || 0}</div>
                  <div className="text-xs text-slate-500">scanned</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-red-500/50 transition-all duration-200">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Issues Found</div>
                  <div className="text-4xl font-bold text-red-400 mb-1">{results.issues?.length || 0}</div>
                  <div className="text-xs text-slate-500">needs attention</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/50 transition-all duration-200">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Recommendations</div>
                  <div className="text-4xl font-bold text-green-400 mb-1">{results.recommendations?.length || 0}</div>
                  <div className="text-xs text-slate-500">available</div>
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
                <div className="pt-6 border-t border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      <span className="text-xl">💡</span>
                      Actionable Recommendations
                    </h4>
                    <div className="text-xs text-slate-500">
                      {appliedFixes.size} of {results.recommendations.length} applied
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {results.recommendations.map((rec: any, idx: number) => {
                      const isApplied = appliedFixes.has(idx);
                      const isApplying = applyingFixes.has(idx);
                      
                      return (
                        <li 
                          key={idx} 
                          className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
                            isApplied
                              ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30'
                              : 'bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            rec.priority === 'high' ? 'bg-red-500/20' :
                            rec.priority === 'medium' ? 'bg-amber-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <span className={`text-lg ${
                              rec.priority === 'high' ? 'text-red-400' :
                              rec.priority === 'medium' ? 'text-amber-400' :
                              'text-blue-400'
                            }`}>
                              {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-white font-semibold text-base">{rec.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                                rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {rec.priority}
                              </span>
                              {isApplied && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-semibold border border-green-500/30">
                                  ✓ Applied
                                </span>
                              )}
                            </div>
                            <div className="text-slate-300 text-sm mb-3 leading-relaxed">{rec.description}</div>
                            {rec.action && (
                              <div className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20 mb-2">
                                💡 {rec.action}
                              </div>
                            )}
                            {rec.file && (
                              <div className="text-slate-500 text-xs mt-2">
                                📄 File: <code className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{rec.file}</code>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {isApplied ? (
                              <div className="text-green-400 text-sm flex items-center gap-1 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Applied
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleApplyFix(rec, idx)}
                                disabled={isApplying}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white smooth-transition hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none shadow-lg shadow-green-500/20 font-semibold"
                              >
                                {isApplying ? (
                                  <span className="flex items-center gap-1">
                                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    <span className="animate-pulse">Applying...</span>
                                  </span>
                                ) : (
                                  <>
                                    <span className="mr-1">🔧</span>
                                    Apply Fix
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
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

