'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ValidationReportProps {
  repo: string;
  generatedFiles: Array<{
    fileName: string;
    code: string;
    language: string;
  }>;
  originalQuality?: number;
  onValidationComplete?: (validation: any) => void;
}

export default function QualityValidationReport({
  repo,
  generatedFiles,
  originalQuality,
  onValidationComplete,
}: ValidationReportProps) {
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (generatedFiles && generatedFiles.length > 0) {
      validateCode();
    }
  }, [repo, generatedFiles]);

  const validateCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/repos/quality/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          generatedFiles,
          originalQuality: { quality: originalQuality || 0 },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate code');
      }

      const data = await response.json();
      setValidation(data.validation);

      if (onValidationComplete) {
        onValidationComplete(data.validation);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (score >= 0.6) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quality Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quality Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!validation) {
    return null;
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Quality Validation Report</CardTitle>
            <CardDescription className="text-slate-400">
              Comprehensive quality assessment of generated code
            </CardDescription>
          </div>
          <Badge className={getScoreBadge(validation.score)}>
            {validation.passed ? '✅ PASSED' : '❌ FAILED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">Overall Quality Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(validation.score)}`}>
                {(validation.score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  validation.score >= 0.8 ? 'bg-green-500' :
                  validation.score >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${validation.score * 100}%` }}
              />
            </div>
          </div>

          {/* Before/After Comparison */}
          {validation.beforeAfter && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Quality Improvement</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Before</div>
                  <div className="text-lg font-bold text-slate-400">
                    {(validation.beforeAfter.before * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">After</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {(validation.beforeAfter.after * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Improvement</div>
                  <div className={`text-lg font-bold ${
                    validation.beforeAfter.improvement > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validation.beforeAfter.improvement > 0 ? '+' : ''}
                    {(validation.beforeAfter.improvement * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Breakdown */}
          {validation.metrics && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Quality Metrics</h3>
              <div className="space-y-2">
                {validation.metrics.syntax && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Syntax Validation</span>
                    <Badge className={getScoreBadge(validation.metrics.syntax.score)}>
                      {(validation.metrics.syntax.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {validation.metrics.patterns && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Pattern Matching</span>
                    <Badge className={getScoreBadge(validation.metrics.patterns.score)}>
                      {(validation.metrics.patterns.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {validation.metrics.quality && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Code Quality</span>
                    <Badge className={getScoreBadge(validation.metrics.quality.overallScore || 0)}>
                      {((validation.metrics.quality.overallScore || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {validation.metrics.tests && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Test Coverage</span>
                    <Badge className={getScoreBadge(validation.metrics.tests.score)}>
                      {(validation.metrics.tests.coverage * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {validation.metrics.security && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Security</span>
                    <Badge className={getScoreBadge(validation.metrics.security.score)}>
                      {(validation.metrics.security.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {validation.metrics.documentation && (
                  <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm text-slate-400">Documentation</span>
                    <Badge className={getScoreBadge(validation.metrics.documentation.score)}>
                      {(validation.metrics.documentation.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issues */}
          {validation.issues && validation.issues.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-3">
                Issues ({validation.issues.length})
              </h3>
              <div className="space-y-2">
                {validation.issues.map((issue: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-red-400">{issue.file}</div>
                        <div className="text-xs text-slate-400 mt-1">{issue.issue}</div>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                        {issue.severity || issue.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-3">
                Warnings ({validation.warnings.length})
              </h3>
              <div className="space-y-2">
                {validation.warnings.map((warning: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-amber-500/10 border border-amber-500/30 rounded"
                  >
                    <div className="text-sm text-amber-400">{warning.issue}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {validation.recommendations && validation.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">
                Recommendations ({validation.recommendations.length})
              </h3>
              <div className="space-y-2">
                {validation.recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-cyan-400">{rec.action}</div>
                        <div className="text-xs text-slate-400 mt-1">{rec.reason}</div>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                        {rec.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <Button
              onClick={validateCode}
              variant="outline"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Re-validate
            </Button>
            {!validation.passed && (
              <Button
                onClick={() => {
                  // Trigger improvement generation
                  console.log('Generate improvements for issues');
                }}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              >
                Fix Issues
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

