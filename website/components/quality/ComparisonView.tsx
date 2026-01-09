'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Comparison View Component
 * 
 * Side-by-side comparison of multiple repositories
 */

interface QualityResult {
  repo: string;
  quality: number;
  confidence: number;
  percentile: number;
  factors?: Record<string, { value: number; importance: number }>;
  recommendations?: Array<{
    action: string;
    priority?: string;
    categorization?: {
      type: string;
      roi: string;
      effort: string;
    };
  }>;
}

interface ComparisonViewProps {
  results: QualityResult[];
  onClose: () => void;
}

export function ComparisonView({ results, onClose }: ComparisonViewProps) {
  if (results.length < 2) {
    return null;
  }

  const sortedResults = [...results].sort((a, b) => b.quality - a.quality);
  const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const avgPercentile = results.reduce((sum, r) => sum + r.percentile, 0) / results.length;

  const getQualityColor = (quality: number) => {
    if (quality >= 0.7) return 'text-green-400';
    if (quality >= 0.4) return 'text-amber-400';
    return 'text-red-400';
  };

  const getQualityBadgeColor = (quality: number) => {
    if (quality >= 0.7) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (quality >= 0.4) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  // Get common factors across all repos
  const allFactorKeys = new Set<string>();
  results.forEach(r => {
    if (r.factors) {
      Object.keys(r.factors).forEach(key => allFactorKeys.add(key));
    }
  });

  const commonFactors = Array.from(allFactorKeys).slice(0, 10); // Top 10 common factors

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl">Repository Comparison</CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              ✕ Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="text-sm text-slate-400 mb-1">Average Quality</div>
                <div className={`text-3xl font-bold ${getQualityColor(avgQuality)}`}>
                  {(avgQuality * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="text-sm text-slate-400 mb-1">Average Confidence</div>
                <div className="text-3xl font-bold text-cyan-400">
                  {(avgConfidence * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="text-sm text-slate-400 mb-1">Average Percentile</div>
                <div className="text-3xl font-bold text-purple-400">
                  {avgPercentile.toFixed(0)}th
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-300 font-semibold">Repository</th>
                  <th className="text-center p-3 text-slate-300 font-semibold">Quality</th>
                  <th className="text-center p-3 text-slate-300 font-semibold">Confidence</th>
                  <th className="text-center p-3 text-slate-300 font-semibold">Percentile</th>
                  <th className="text-center p-3 text-slate-300 font-semibold">Rank</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result, idx) => (
                  <tr key={result.repo} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-medium text-white">{result.repo}</div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={getQualityBadgeColor(result.quality)}>
                        {(result.quality * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center text-slate-300">
                      {(result.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-center text-slate-300">
                      {result.percentile.toFixed(0)}th
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                        #{idx + 1}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Factor Comparison */}
          {commonFactors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Factor Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-semibold">Factor</th>
                      {results.map((result) => (
                        <th key={result.repo} className="text-center p-3 text-slate-300 font-semibold text-sm">
                          {result.repo.split('/')[1]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commonFactors.map((factor) => (
                      <tr key={factor} className="border-b border-slate-800">
                        <td className="p-3 text-slate-300 text-sm">
                          {factor.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        {results.map((result) => {
                          const factorData = result.factors?.[factor];
                          const value = factorData?.value ?? 0;
                          const importance = factorData?.importance ?? 0;
                          return (
                            <td key={result.repo} className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm text-white">
                                  {typeof value === 'number' ? (value * 100).toFixed(0) + '%' : 'N/A'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {importance > 0 ? `(${(importance * 100).toFixed(0)}%)` : ''}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Top Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result) => (
                <Card key={result.repo} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">{result.repo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.recommendations?.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="text-sm text-slate-300">
                          • {rec.action}
                          {rec.priority && (
                            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs">
                              {rec.priority}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {(!result.recommendations || result.recommendations.length === 0) && (
                        <div className="text-sm text-slate-500">No recommendations</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
