"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { scanResultsStore, ScanResult } from '../../lib/scan-results-store';

export default function GitHubScanForm() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedScans, setExpandedScans] = useState<Set<number>>(new Set());

  const handleScan = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Extract owner/repo from URL (supports various formats)
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/,
      /git@github\.com:([^\/]+)\/([^\/]+)\.git/
    ];

    let match = null;
    let owner = '';
    let repo = '';

    for (const pattern of patterns) {
      match = repoUrl.match(pattern);
      if (match) {
        [, owner, repo] = match;
        break;
      }
    }

    if (!match) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo or owner/repo');
      return;
    }

    const fullRepo = `${owner}/${repo}`;

    setIsScanning(true);
    setError(null);

    // Add scanning state
    const newScan: ScanResult = {
      repo: fullRepo,
      score: 0,
      issues: 0,
      improvements: 0,
      status: 'scanning'
    };
    setScanResults(prev => [newScan, ...prev]);

    try {
      const response = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: fullRepo, url: repoUrl })
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const data = await response.json();

      // Update with results
      const updatedScan: ScanResult = { ...newScan, ...data, status: 'completed' as const };
      setScanResults(prev => prev.map(s => 
        s.repo === fullRepo 
          ? updatedScan
          : s
      ));

      // Save to shared store for Quality tab
      scanResultsStore.addScan(updatedScan);
    } catch (err: any) {
      setError(err.message || 'Failed to scan repository');
      setScanResults(prev => prev.map(s => 
        s.repo === fullRepo 
          ? { ...s, status: 'error' as const }
          : s
      ));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Scan GitHub Repository</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              disabled={isScanning}
            />
            <Button 
              onClick={handleScan}
              disabled={isScanning}
              className="bg-white text-black hover:bg-slate-100"
            >
              {isScanning ? 'Scanning...' : 'Scan Repo'}
            </Button>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-semibold">Recent Scans</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScanResults([])}
              className="border-slate-800 text-slate-400 hover:bg-slate-900"
            >
              Clear All
            </Button>
          </div>
          {scanResults.map((result, idx) => {
            const isExpanded = expandedScans.has(idx);
            const toggleExpand = () => {
              const newExpanded = new Set(expandedScans);
              if (isExpanded) {
                newExpanded.delete(idx);
              } else {
                newExpanded.add(idx);
              }
              setExpandedScans(newExpanded);
            };

            return (
              <Card key={idx} className="bg-slate-900/90 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-semibold">{result.repo}</h4>
                        {result.status === 'completed' && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.score >= 80 ? 'bg-green-500/20 text-green-400' :
                            result.score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Work'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {result.status === 'scanning' && (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"></span>
                            Scanning repository...
                          </span>
                        )}
                        {result.status === 'completed' && (
                          <span className="flex items-center gap-2 text-green-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Scan completed
                          </span>
                        )}
                        {result.status === 'error' && (
                          <span className="flex items-center gap-2 text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Scan failed
                          </span>
                        )}
                      </p>
                    </div>
                    {result.status === 'completed' && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-3xl font-bold text-cyan-400">{result.score}</div>
                          <div className="text-xs text-slate-500">/100</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleExpand}
                          className="border-slate-800 text-slate-400 hover:bg-slate-900"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Hide Details
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Show Details
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Summary View (Always Visible) */}
                  {result.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-slate-950/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Issues Found</div>
                        <div className="text-xl font-semibold text-white">{result.issues}</div>
                      </div>
                      <div className="bg-slate-950/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Improvements</div>
                        <div className="text-xl font-semibold text-cyan-400">{result.improvements}</div>
                      </div>
                      {result.metrics && (
                        <>
                          <div className="bg-slate-950/50 rounded-lg p-3">
                            <div className="text-xs text-slate-500 mb-1">Files</div>
                            <div className="text-lg font-semibold text-white">{result.metrics.fileCount || 'N/A'}</div>
                          </div>
                          <div className="bg-slate-950/50 rounded-lg p-3">
                            <div className="text-xs text-slate-500 mb-1">Language</div>
                            <div className="text-lg font-semibold text-white">{result.metrics.language || 'N/A'}</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Expanded Details View */}
                  {result.status === 'completed' && isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
                      {/* Detailed Metrics */}
                      {result.metrics && (
                        <div>
                          <h5 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Repository Metrics</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Total Files</div>
                              <div className="text-2xl font-bold text-white">{result.metrics.fileCount || 0}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Code Files</div>
                              <div className="text-2xl font-bold text-cyan-400">{result.metrics.codeFileCount || 0}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Stars</div>
                              <div className="text-2xl font-bold text-yellow-400">{result.metrics.stars || 0}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Forks</div>
                              <div className="text-2xl font-bold text-purple-400">{result.metrics.forks || 0}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Open Issues</div>
                              <div className="text-2xl font-bold text-red-400">{result.metrics.openIssues || 0}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Primary Language</div>
                              <div className="text-lg font-semibold text-white">{result.metrics.language || 'N/A'}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Maintainability</div>
                              <div className="text-lg font-semibold text-green-400">{result.metrics.maintainability || 'N/A'}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Has README</div>
                              <div className="text-lg font-semibold text-white">
                                {result.metrics.hasReadme ? '✓ Yes' : '✗ No'}
                              </div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Has License</div>
                              <div className="text-lg font-semibold text-white">
                                {result.metrics.hasLicense ? '✓ Yes' : '✗ No'}
                              </div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Has Tests</div>
                              <div className="text-lg font-semibold text-white">
                                {result.metrics.hasTests ? '✓ Yes' : '✗ No'}
                              </div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Has CI/CD</div>
                              <div className="text-lg font-semibold text-white">
                                {result.metrics.hasCI ? '✓ Yes' : '✗ No'}
                              </div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Has Docker</div>
                              <div className="text-lg font-semibold text-white">
                                {result.metrics.hasDocker ? '✓ Yes' : '✗ No'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Issues Breakdown */}
                      {result.detectedIssues && result.detectedIssues.length > 0 && (
                        <div>
                          <h5 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            Issues Found ({result.detectedIssues.length})
                          </h5>
                          <div className="bg-slate-950/50 rounded-lg p-4 space-y-3">
                            {result.detectedIssues.map((issue: any, issueIdx: number) => (
                              <div 
                                key={issueIdx}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${
                                  issue.priority === 'high' 
                                    ? 'bg-red-500/10 border-red-500/20' 
                                    : issue.priority === 'medium'
                                    ? 'bg-amber-500/10 border-amber-500/20'
                                    : 'bg-blue-500/10 border-blue-500/20'
                                }`}
                              >
                                <svg 
                                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                    issue.priority === 'high' ? 'text-red-400' :
                                    issue.priority === 'medium' ? 'text-amber-400' :
                                    'text-blue-400'
                                  }`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="text-white font-medium">{issue.title}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      issue.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                      issue.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {issue.priority.toUpperCase()}
                                    </span>
                                    {issue.category && (
                                      <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded">
                                        {issue.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-400 text-sm">{issue.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Recommendations */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            Actionable Recommendations ({result.recommendations.length})
                          </h5>
                          <div className="space-y-3">
                            {result.recommendations.map((rec: any, recIdx: number) => (
                              <div 
                                key={recIdx} 
                                className={`p-4 rounded-lg border ${
                                  rec.priority === 'high' 
                                    ? 'bg-red-500/10 border-red-500/20' 
                                    : rec.priority === 'medium'
                                    ? 'bg-amber-500/10 border-amber-500/20'
                                    : 'bg-blue-500/10 border-blue-500/20'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                    rec.priority === 'high' ? 'bg-red-500/20' :
                                    rec.priority === 'medium' ? 'bg-amber-500/20' :
                                    'bg-blue-500/20'
                                  }`}>
                                    <span className={`text-xs font-bold ${
                                      rec.priority === 'high' ? 'text-red-400' :
                                      rec.priority === 'medium' ? 'text-amber-400' :
                                      'text-blue-400'
                                    }`}>
                                      {recIdx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                        rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {rec.priority.toUpperCase()}
                                      </span>
                                      {rec.category && (
                                        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                                          {rec.category}
                                        </span>
                                      )}
                                      {rec.file && (
                                        <span className="text-xs text-slate-400 font-mono">
                                          {rec.file}{rec.line && `:${rec.line}`}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-white font-medium mb-1">{rec.title || rec.message}</div>
                                    {rec.description && (
                                      <div className="text-slate-400 text-sm mt-1">{rec.description}</div>
                                    )}
                                    {!rec.description && rec.message && rec.message !== rec.title && (
                                      <div className="text-slate-400 text-sm mt-1">{rec.message}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Language Breakdown */}
                      {result.metrics?.languageBreakdown && Object.keys(result.metrics.languageBreakdown).length > 0 && (
                        <div>
                          <h5 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Language Breakdown</h5>
                          <div className="bg-slate-950/50 rounded-lg p-4">
                            <div className="space-y-2">
                              {Object.entries(result.metrics.languageBreakdown)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .slice(0, 5)
                                .map(([lang, bytes]: [string, any]) => (
                                  <div key={lang} className="flex items-center justify-between">
                                    <span className="text-slate-300 font-mono text-sm">{lang}</span>
                                    <span className="text-slate-500 text-sm">
                                      {typeof bytes === 'number' ? `${(bytes / 1024).toFixed(1)} KB` : bytes}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

