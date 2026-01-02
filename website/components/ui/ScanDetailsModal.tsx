"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { ConfirmDialog, AlertDialog } from './ConfirmDialog';

interface ScanDetailsModalProps {
  open: boolean;
  scan: any;
  onClose: () => void;
  onApplyFix?: (issue: any) => void;
  onExport?: () => void;
  onScanAgain?: () => void;
}

export function ScanDetailsModal({
  open,
  scan,
  onClose,
  onApplyFix,
  onExport,
  onScanAgain
}: ScanDetailsModalProps) {
  const [applyingFix, setApplyingFix] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [pendingFix, setPendingFix] = useState<any>(null);
  const [alertData, setAlertData] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' }>({
    title: '',
    message: '',
    variant: 'info'
  });

  if (!open || !scan) return null;

  const handleFix = async (issue: any) => {
    setPendingFix(issue);
    setShowConfirmDialog(true);
  };

  const confirmFix = async () => {
    setShowConfirmDialog(false);
    if (!pendingFix) return;

    const issue = pendingFix;
    setApplyingFix(issue.title || issue.type || 'fix');
    
    try {
      console.log('🔧 [ScanDetailsModal] Applying fix:', issue);
      console.log('   Issue title:', issue.title);
      console.log('   Issue type:', issue.type);
      console.log('   Issue category:', issue.category);
      
      // Map issue to a fix type that the API understands
      // The API looks for keywords in the title: "Error Boundary", "console.log", "error handling", "SEO", "Analytics"
      let fixTitle = issue.title || issue.type || '';
      const category = issue.category || '';
      const description = issue.description || issue.message || '';
      
      // Try to map based on category or description if title doesn't match
      if (!fixTitle.toLowerCase().includes('error boundary') && 
          !fixTitle.toLowerCase().includes('console') &&
          !fixTitle.toLowerCase().includes('error handling') &&
          !fixTitle.toLowerCase().includes('seo') &&
          !fixTitle.toLowerCase().includes('analytics')) {
        
        // Try to infer from category or description
        if (category === 'error-handling' || description.toLowerCase().includes('error boundary')) {
          fixTitle = 'Add Error Boundary';
        } else if (description.toLowerCase().includes('console.log') || description.toLowerCase().includes('console')) {
          fixTitle = 'Remove console.log statements';
        } else if (description.toLowerCase().includes('error handling') || description.toLowerCase().includes('try catch')) {
          fixTitle = 'Add error handling';
        } else if (category === 'seo' || description.toLowerCase().includes('seo') || description.toLowerCase().includes('metadata')) {
          fixTitle = 'Enhance SEO metadata';
        } else if (category === 'analytics' || description.toLowerCase().includes('analytics') || description.toLowerCase().includes('tracking')) {
          fixTitle = 'Add Analytics';
        }
      }
      
      console.log('   Mapped fix title:', fixTitle);

      const response = await fetch('/api/beast-mode/self-improve/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: {
            ...issue,
            title: fixTitle // Use mapped title
          },
          fixType: fixTitle,
          gitOptions: {
            commit: false,
            push: false,
            deploy: false
          }
        })
      });

      console.log('   Response status:', response.status);
      console.log('   Response ok:', response.ok);

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          console.log('   Error response text:', text);
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('   Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ [ScanDetailsModal] Fix application failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          issue: issue.title || issue.type
        });
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ [ScanDetailsModal] Fix application result:', result);
      
      if (result.success) {
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
        
        let message = `✅ Fix applied!\n\n`;
        if (result.filesModified && result.filesModified.length > 0) {
          message += `Modified ${result.filesModified.length} file(s):\n${result.filesModified.slice(0, 3).map((f: string) => `  • ${f}`).join('\n')}${result.filesModified.length > 3 ? `\n  ... and ${result.filesModified.length - 3} more` : ''}`;
        }
        
        if (result.git && result.git.committed) {
          message += `\n\n📦 Git: ${result.git.message}`;
          if (result.git.commitHash) {
            message += `\n   Commit: ${result.git.commitHash.substring(0, 7)}`;
          }
        }
        
        setAlertData({
          title: 'Fix Applied Successfully',
          message,
          variant: 'success'
        });
        setShowAlertDialog(true);

        // Call the callback if provided
        if (onApplyFix) {
          onApplyFix(issue);
        }
      } else {
        // If the fix type is unknown, provide helpful error message
        const errorMsg = result.error || result.message || 'Failed to apply fix';
        if (errorMsg.includes('Unknown fix type') || errorMsg.includes('not yet implemented')) {
          throw new Error(
            `This fix type is not yet supported.\n\n` +
            `Supported fix types:\n` +
            `• Error Boundary\n` +
            `• Remove console.log statements\n` +
            `• Add error handling\n` +
            `• Enhance SEO metadata\n` +
            `• Add Analytics\n\n` +
            `Your issue: "${issue.title || issue.type || 'Unknown'}"\n\n` +
            `We're working on adding more fix types. Check back soon!`
          );
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      // Extract error message properly
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === 'object') {
        // Try to stringify the error object
        try {
          errorMessage = JSON.stringify(err, null, 2);
        } catch {
          errorMessage = String(err);
        }
      }
      
      console.error('❌ [ScanDetailsModal] Error applying fix:', {
        error: err,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        message: err?.message,
        errorProperty: err?.error,
        stack: err?.stack,
        issue: issue.title || issue.type,
        fullError: err
      });
      
      // Log the full error for debugging
      console.error('   Full error details:', err);
      
      setAlertData({
        title: 'Failed to Apply Fix',
        message: `❌ ${errorMessage}\n\nIssue: ${issue.title || issue.type || 'Unknown'}\n\nCheck the browser console (F12) for more details.`,
        variant: 'error'
      });
      setShowAlertDialog(true);
    } finally {
      setApplyingFix(null);
      setPendingFix(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card 
        className="bg-slate-900/95 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="sticky top-0 bg-slate-900/95 z-10 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <div>{scan.repo || 'Scan Details'}</div>
                  <div className="text-sm text-slate-400 font-normal mt-1">
                    {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Recently scanned'}
                  </div>
                </div>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onScanAgain && (
                <Button
                  onClick={onScanAgain}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  🔄 Scan Again
                </Button>
              )}
              {onExport && (
                <Button
                  onClick={onExport}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  📥 Export
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Score Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Quality Score</div>
              <div className={`text-4xl font-bold ${
                scan.score >= 80 ? 'text-green-400' : scan.score >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {scan.score || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">/100</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Issues</div>
              <div className="text-4xl font-bold text-red-400">{scan.issues || 0}</div>
              <div className="text-xs text-slate-500 mt-1">found</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Improvements</div>
              <div className="text-4xl font-bold text-cyan-400">{scan.improvements || 0}</div>
              <div className="text-xs text-slate-500 mt-1">available</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Files</div>
              <div className="text-4xl font-bold text-white">{scan.metrics?.totalFiles || scan.totalFiles || 0}</div>
              <div className="text-xs text-slate-500 mt-1">analyzed</div>
            </div>
          </div>

          {/* Metrics */}
          {scan.metrics && (
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>📈</span>
                Codebase Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Test Coverage</div>
                  <div className={`font-semibold mt-1 ${
                    scan.metrics.coverage >= 70 ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {scan.metrics.coverage || 0}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Maintainability</div>
                  <div className={`font-semibold mt-1 ${
                    scan.metrics.maintainability >= 80 ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {scan.metrics.maintainability || 0}/100
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Has Tests</div>
                  <div className={`font-semibold mt-1 ${
                    scan.metrics.hasTests ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {scan.metrics.hasTests ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Has CI/CD</div>
                  <div className={`font-semibold mt-1 ${
                    scan.metrics.hasCI ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {scan.metrics.hasCI ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Issues */}
          {scan.detectedIssues && scan.detectedIssues.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>🐛</span>
                Detected Issues ({scan.detectedIssues.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scan.detectedIssues.map((issue: any, idx: number) => {
                  // Use a component for expandable issues
                  return <ExpandableIssue key={idx} issue={issue} onApplyFix={onApplyFix} applyingFix={applyingFix} handleFix={handleFix} />;
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {scan.recommendations && scan.recommendations.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>💡</span>
                Recommendations ({scan.recommendations.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scan.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {rec.priority || 'low'}
                          </span>
                          <span className="text-white font-semibold">{rec.title || 'Recommendation'}</span>
                        </div>
                        {rec.description && (
                          <div className="text-slate-300 text-sm mb-2">{rec.description}</div>
                        )}
                        {rec.action && (
                          <div className="text-cyan-400 text-sm font-mono bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20 mb-2">
                            💡 {rec.action}
                          </div>
                        )}
                        {rec.file && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>📄</span>
                            <code className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                              {rec.file}
                            </code>
                          </div>
                        )}
                      </div>
                      {onApplyFix && (
                        <Button
                          onClick={() => handleFix(rec)}
                          disabled={applyingFix === (rec.title || rec.type)}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white flex-shrink-0 disabled:opacity-50"
                        >
                          {applyingFix === (rec.title || rec.type) ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                              <span className="animate-pulse">Applying...</span>
                            </span>
                          ) : (
                            '🔧 Apply'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
              🔍 View Raw Scan Data
            </summary>
            <pre className="mt-3 text-xs text-slate-500 overflow-auto max-h-64 p-3 bg-slate-900 rounded border border-slate-700">
              {JSON.stringify(scan, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmDialog
        open={showConfirmDialog}
        title="Apply Fix"
        message={pendingFix ? `Apply fix for: ${pendingFix.title || pendingFix.type || 'this issue'}?\n\nThis will modify files in your codebase.` : ''}
        onConfirm={confirmFix}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingFix(null);
        }}
        variant="default"
      />
      
      <AlertDialog
        open={showAlertDialog}
        title={alertData.title}
        message={alertData.message}
        variant={alertData.variant}
        onClose={() => {
          setShowAlertDialog(false);
          setAlertData({ title: '', message: '', variant: 'info' });
        }}
      />
    </div>
  );
}

// Expandable Issue Component
function ExpandableIssue({ issue, onApplyFix, applyingFix, handleFix }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              issue.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              issue.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {issue.priority || 'low'}
            </span>
            <span className="text-white font-semibold">{issue.title || issue.type || 'Issue'}</span>
            {issue.category && (
              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-900 rounded">
                {issue.category}
              </span>
            )}
          </div>
          {issue.description && (
            <div className="text-slate-300 text-sm mb-2">{issue.description}</div>
          )}
          {issue.message && (
            <div className="text-slate-400 text-sm mb-2">{issue.message}</div>
          )}
          {issue.file && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>📄</span>
              <code className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                {issue.file}{issue.line ? `:${issue.line}` : ''}
              </code>
            </div>
          )}
          {issue.expectedPath && !issue.file && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>📍</span>
              <code className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                Expected: {issue.expectedPath}
              </code>
            </div>
          )}
          
          {/* Expandable Context Section */}
          {issue.context && (
            <div className="mt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-2"
              >
                <span>{isExpanded ? '▼' : '▶'}</span>
                <span>{isExpanded ? 'Hide' : 'Show'} Context & Details</span>
              </button>
              {isExpanded && (
                <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-slate-700/50">
                  {/* Suggestion */}
                  {issue.context.suggestion && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                      <div className="text-xs text-cyan-400 font-semibold mb-1">💡 Suggestion</div>
                      <div className="text-sm text-slate-300">{issue.context.suggestion}</div>
                    </div>
                  )}
                  
                  {/* Checked Paths */}
                  {issue.context.checkedPaths && issue.context.checkedPaths.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Checked Paths:</div>
                      <div className="flex flex-wrap gap-1">
                        {issue.context.checkedPaths.map((path: string, pIdx: number) => (
                          <code key={pIdx} className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            {path}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Checked Patterns */}
                  {issue.context.checkedPatterns && issue.context.checkedPatterns.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Checked Patterns:</div>
                      <div className="flex flex-wrap gap-1">
                        {issue.context.checkedPatterns.map((pattern: string, pIdx: number) => (
                          <code key={pIdx} className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            {pattern}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Expected Files */}
                  {issue.context.expectedFiles && issue.context.expectedFiles.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Expected Files:</div>
                      <div className="flex flex-wrap gap-1">
                        {issue.context.expectedFiles.map((file: string, fIdx: number) => (
                          <code key={fIdx} className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            {file}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Metrics */}
                  {issue.context.metrics && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Metrics:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(issue.context.metrics).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">{key}:</span>{' '}
                            <span className="text-slate-200">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Repository Context */}
                  {issue.context.repository && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Repository Info:</div>
                      <div className="space-y-1 text-xs">
                        {issue.context.repository.defaultBranch && (
                          <div className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">Default Branch:</span>{' '}
                            <code className="text-slate-200">{issue.context.repository.defaultBranch}</code>
                          </div>
                        )}
                        {issue.context.repository.url && (
                          <div className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">URL:</span>{' '}
                            <a href={issue.context.repository.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                              {issue.context.repository.url}
                            </a>
                          </div>
                        )}
                        {issue.context.repository.issuesUrl && (
                          <div className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">Issues:</span>{' '}
                            <a href={issue.context.repository.issuesUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                              View Issues
                            </a>
                          </div>
                        )}
                        {issue.context.repository.languages && issue.context.repository.languages.length > 0 && (
                          <div className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">Languages:</span>{' '}
                            <span className="text-slate-200">{issue.context.repository.languages.join(', ')}</span>
                          </div>
                        )}
                        {issue.context.repository.primaryLanguage && (
                          <div className="bg-slate-800 px-2 py-1 rounded">
                            <span className="text-slate-400">Primary Language:</span>{' '}
                            <span className="text-slate-200">{issue.context.repository.primaryLanguage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {onApplyFix && issue.fixable !== false && (
          <Button
            onClick={() => handleFix(issue)}
            disabled={applyingFix === (issue.title || issue.type)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 disabled:opacity-50"
          >
            {applyingFix === (issue.title || issue.type) ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                <span className="animate-pulse">Fixing...</span>
              </span>
            ) : (
              '🔧 Fix'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

