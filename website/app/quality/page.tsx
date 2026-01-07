'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Quality Dashboard MVP
 * 
 * User Stories:
 * - "As a developer, I want to see quality scores for multiple repos at once"
 * - "As a team lead, I want to compare repo quality across my organization"
 * - "As a recruiter, I want to assess candidate repo quality quickly"
 */

interface QualityResult {
  repo: string;
  quality: number;
  confidence: number;
  percentile: number;
  factors?: Record<string, { value: number; importance: number }>;
  recommendations?: Array<{ action: string; impact?: string }>;
  cached?: boolean;
  latency?: number;
}

export default function QualityDashboard() {
  const [repos, setRepos] = useState<string[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [results, setResults] = useState<QualityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/repos/quality/monitoring');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const addRepo = () => {
    if (repoInput.trim() && !repos.includes(repoInput.trim())) {
      setRepos([...repos, repoInput.trim()]);
      setRepoInput('');
    }
  };

  const removeRepo = (repo: string) => {
    setRepos(repos.filter(r => r !== repo));
  };

  const analyzeRepos = async () => {
    if (repos.length === 0) return;

    setLoading(true);
    setResults([]);

    try {
      const promises = repos.map(async (repo) => {
        try {
          const res = await fetch('/api/repos/quality', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo })
          });

          if (!res.ok) {
            throw new Error(`Failed to analyze ${repo}`);
          }

          const data = await res.json();
          return {
            repo,
            ...data,
            quality: data.quality || 0,
            confidence: data.confidence || 0,
            percentile: data.percentile || 0
          };
        } catch (error: any) {
          return {
            repo,
            quality: 0,
            confidence: 0,
            percentile: 0,
            error: error.message
          };
        }
      });

      const results = await Promise.all(promises);
      setResults(results);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to analyze repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.7) return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (quality >= 0.4) return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-red-400 bg-red-500/20 border-red-500/50';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.7) return 'High Quality';
    if (quality >= 0.4) return 'Moderate';
    return 'Low Quality';
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quality Dashboard</h1>
          <p className="text-slate-400">
            Analyze and compare repository quality scores powered by XGBoost ML model (R² = 1.000)
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Total Requests</div>
                <div className="text-2xl font-bold text-white">
                  {stats.metrics?.totalRequests || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Cache Hit Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {stats.metrics?.cacheHitRate || '0%'}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Avg Latency</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {stats.metrics?.averageLatency?.toFixed(0) || 0}ms
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">P95 Latency</div>
                <div className="text-2xl font-bold text-purple-400">
                  {stats.metrics?.p95Latency?.toFixed(0) || 0}ms
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="bg-slate-900/90 border-slate-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Add Repositories</CardTitle>
              <CardDescription>Enter repos in format: owner/repo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRepo()}
                  placeholder="facebook/react"
                  className="flex-1"
                />
                <Button onClick={addRepo} className="bg-cyan-600 hover:bg-cyan-700">
                  Add
                </Button>
              </div>

              {repos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Repositories ({repos.length}):</div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {repos.map((repo) => (
                      <div
                        key={repo}
                        className="flex items-center justify-between bg-slate-800/50 rounded p-2"
                      >
                        <span className="text-sm text-slate-300">{repo}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRepo(repo)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={analyzeRepos}
                disabled={repos.length === 0 || loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              >
                {loading ? 'Analyzing...' : `Analyze ${repos.length} Repo${repos.length !== 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="bg-slate-900/90 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Quality Results</CardTitle>
              <CardDescription>
                {results.length > 0
                  ? `${results.length} repos analyzed`
                  : 'Add repos and click Analyze to see results'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-400">Analyzing repositories...</p>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">No results yet. Add repos and analyze!</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-4">
                  {/* Sort by quality */}
                  {[...results]
                    .sort((a, b) => b.quality - a.quality)
                    .map((result) => (
                      <Card
                        key={result.repo}
                        className="bg-slate-800/50 border-slate-700"
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {result.repo}
                              </h3>
                              {result.cached && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
                                  Cached
                                </Badge>
                              )}
                              {result.latency && (
                                <span className="text-xs text-slate-500 ml-2">
                                  {result.latency}ms
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-3xl font-bold mb-1 ${getQualityColor(result.quality).split(' ')[0]}`}>
                                {(result.quality * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400">
                                {getQualityLabel(result.quality)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Confidence</div>
                              <div className="text-sm font-semibold text-slate-300">
                                {(result.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Percentile</div>
                              <div className="text-sm font-semibold text-slate-300">
                                {result.percentile.toFixed(0)}th
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Status</div>
                              <div className="text-sm font-semibold text-green-400">
                                {result.error ? 'Error' : 'Success'}
                              </div>
                            </div>
                          </div>

                          {result.factors && Object.keys(result.factors).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-2">Top Factors:</div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(result.factors)
                                  .slice(0, 5)
                                  .map(([factor, data]: [string, any]) => (
                                    <Badge
                                      key={factor}
                                      className="bg-slate-700/50 text-slate-300 border-slate-600"
                                    >
                                      {factor.replace(/([A-Z])/g, ' $1').trim()}: {data.value?.toFixed(0) || 0}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {result.recommendations && result.recommendations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-2">Recommendations:</div>
                              <ul className="space-y-1">
                                {result.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-300">
                                    • {rec.action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.error && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-sm text-red-400">Error: {result.error}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

