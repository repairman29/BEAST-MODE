'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface QualityDetailModalProps {
  open: boolean;
  repo: {
    repo: string;
    quality?: number;
    confidence?: number;
    percentile?: number;
    factors?: Record<string, { value: number; importance: number }>;
    recommendations?: Array<{
      action: string;
      impact: string;
      priority: 'high' | 'medium' | 'low';
      insight: string;
      actionable: string;
      estimatedGain?: number;
    }>;
    cached?: boolean;
    error?: string;
  } | null;
  onClose: () => void;
}

export default function QualityDetailModal({ open, repo, onClose }: QualityDetailModalProps) {
  if (!open || !repo) return null;

  const getQualityColor = (quality: number) => {
    if (quality >= 0.7) return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (quality >= 0.4) return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-red-400 bg-red-500/20 border-red-500/50';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.7) return 'High Quality';
    if (quality >= 0.4) return 'Moderate Quality';
    return 'Low Quality';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const factors = repo.factors || {};
  const recommendations = repo.recommendations || [];
  const sortedFactors = Object.entries(factors)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (b.importance || 0) - (a.importance || 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="bg-slate-900 border-slate-800 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl font-bold">{repo.repo}</CardTitle>
              <div className="mt-2 flex items-center gap-3">
                {repo.quality !== undefined && repo.quality !== null ? (
                  <>
                    <Badge className={getQualityColor(repo.quality)}>
                      {(repo.quality * 100).toFixed(1)}% Quality
                    </Badge>
                    <span className="text-sm text-slate-400">{getQualityLabel(repo.quality)}</span>
                    {repo.percentile !== undefined && (
                      <span className="text-sm text-slate-400">
                        {repo.percentile.toFixed(0)}th percentile
                      </span>
                    )}
                    {repo.confidence !== undefined && (
                      <span className="text-sm text-slate-400">
                        {((repo.confidence || 0) * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-red-400">No quality data available</span>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              ✕ Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {repo.error ? (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-2">Error</p>
              <p className="text-slate-300 text-sm">{repo.error}</p>
            </div>
          ) : (
            <>
              {/* Quality Score Breakdown */}
              {repo.quality !== undefined && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quality Score Breakdown</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">Overall Quality</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        {(repo.quality * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          repo.quality >= 0.7
                            ? 'bg-green-500'
                            : repo.quality >= 0.4
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${repo.quality * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Confidence:</span>
                        <span className="ml-2 text-white font-semibold">
                          {((repo.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Percentile:</span>
                        <span className="ml-2 text-white font-semibold">
                          {repo.percentile !== undefined ? `${repo.percentile.toFixed(0)}th` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>
                        {repo.cached ? (
                          <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
                            Cached
                          </Badge>
                        ) : (
                          <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs">
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contributing Factors */}
              {sortedFactors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Contributing Factors</h3>
                  <div className="space-y-3">
                    {sortedFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 font-medium">
                            {factor.name
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim()}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">Value: {factor.value.toFixed(2)}</span>
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                              {(factor.importance * 100).toFixed(1)}% impact
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(factor.importance * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intelligence & Insights */}
              {recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Intelligence & Insights</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Actionable recommendations to improve your repository quality
                  </p>
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority.toUpperCase()}
                              </Badge>
                              <span className="text-white font-semibold text-base">{rec.action}</span>
                              {rec.estimatedGain && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                                  +{(rec.estimatedGain * 100).toFixed(0)}% quality
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 mb-2 font-medium">{rec.impact}</p>
                            <div className="bg-slate-900/50 rounded p-3 mb-2 border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Why This Matters</p>
                              <p className="text-sm text-slate-300">{rec.insight}</p>
                            </div>
                            <div className="bg-cyan-500/10 rounded p-3 border border-cyan-500/30">
                              <p className="text-xs text-cyan-400 mb-1 font-semibold uppercase tracking-wider">What To Do</p>
                              <p className="text-sm text-cyan-300">{rec.actionable}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {sortedFactors.length === 0 && recommendations.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>No detailed information available for this repository.</p>
                  <p className="text-sm mt-2">Try analyzing the repository again to get more details.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

