'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import InlineFeedbackButton from '@/components/feedback/InlineFeedbackButton';
import EnhancedFeedbackPrompt from '@/components/feedback/EnhancedFeedbackPrompt';
import { getQualityFeedbackTracker } from '@/lib/qualityFeedbackTracker';
import { QualityWidget } from '@/components/plg/QualityWidget';
import { RecommendationCards } from '@/components/plg/RecommendationCards';
import { getUserLimits, canAddRepo, canExport, canCompare, getUserTier } from '@/lib/freemium-limits';
import { isAuthenticated } from '@/lib/auth';

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
  predictionId?: string; // For feedback collection
  confidenceExplanation?: {
    score: number;
    level: 'very-high' | 'high' | 'medium' | 'low';
    explanation: string;
    factors: string[];
    recommendation: string;
  };
  factors?: Record<string, { value: number; importance: number }>;
  recommendations?: Array<{
    action: string;
    impact?: string;
    priority?: 'high' | 'medium' | 'low';
    estimatedGain?: number;
    categorization?: {
      type: 'quick-win' | 'high-impact' | 'strategic';
      roi: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
      timeframe: string;
      estimatedHours?: number;
    };
  }>;
  modelInfo?: {
    name: string;
    version: string;
    accuracy: string;
    trainingDate?: string;
    trainingSize?: number;
    features?: number;
  };
  cached?: boolean;
  latency?: number;
  error?: string;
}

export default function QualityDashboard() {
  const [repos, setRepos] = useState<string[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [results, setResults] = useState<QualityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<Record<string, any>>({});
  const [loadingTrends, setLoadingTrends] = useState<Record<string, boolean>>({});
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'authenticated' | 'pro'>('free');
  const [userLimits, setUserLimits] = useState<any>(null);
  const [isAuth, setIsAuth] = useState(false);

  // Load stats and user tier on mount
  useEffect(() => {
    fetchStats();
    loadUserTier();
    
    // Initialize quality feedback tracker
    const tracker = getQualityFeedbackTracker();
    
    // Track time spent viewing results
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      if (results.length > 0 && timeSpent >= 3000) {
        // User spent time viewing results, infer positive feedback
        results.forEach(result => {
          if (result.predictionId) {
            tracker.trackTimeSpent(result.predictionId, result.repo, timeSpent);
          }
        });
      }
    };
  }, []);

  const loadUserTier = async () => {
    const tier = await getUserTier();
    const limits = await getUserLimits();
    const auth = await isAuthenticated();
    setUserTier(tier);
    setUserLimits(limits);
    setIsAuth(auth);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/repos/quality/monitoring');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const addRepo = async () => {
    if (!repoInput.trim()) return;
    
    // Check freemium limits
    const check = await canAddRepo(repos.length);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    
    if (!repos.includes(repoInput.trim())) {
      setRepos([...repos, repoInput.trim()]);
      setRepoInput('');
    }
  };

  const removeRepo = (repo: string) => {
    setRepos(repos.filter(r => r !== repo));
  };

  const fetchTrends = async (repo: string) => {
    if (trends[repo] || loadingTrends[repo]) return;

    setLoadingTrends(prev => ({ ...prev, [repo]: true }));

    try {
      const res = await fetch('/api/repos/quality/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, days: 90 })
      });

      if (res.ok) {
        const data = await res.json();
        setTrends(prev => ({ ...prev, [repo]: data }));
      }
    } catch (error) {
      console.error(`Failed to fetch trends for ${repo}:`, error);
    } finally {
      setLoadingTrends(prev => ({ ...prev, [repo]: false }));
    }
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
          
          // Fetch trends for this repo
          fetchTrends(repo);
          
          return {
            repo,
            ...data,
            quality: data.quality || 0,
            confidence: data.confidence || 0,
            percentile: data.percentile || 0,
            predictionId: data.predictionId // Store for feedback collection
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

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'very-high':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'high':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'low':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getCategoryBadgeColor = (type: string) => {
    switch (type) {
      case 'quick-win':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'high-impact':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'strategic':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getROIColor = (roi: string) => {
    switch (roi) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-amber-400';
      case 'low':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
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

        {/* Freemium Banner */}
        {userTier === 'free' && repos.length >= 2 && (
          <Card className="bg-cyan-900/20 border-cyan-500/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    🚀 Unlock Unlimited Repos
                  </h3>
                  <p className="text-sm text-slate-300">
                    You've used {repos.length} of {userLimits?.maxRepos || 3} free repos. Sign in for unlimited access, export, and comparison features.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // TODO: Navigate to sign in
                    alert('Sign in feature coming soon!');
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap"
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="bg-slate-900/90 border-slate-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Add Repositories</CardTitle>
              <CardDescription>
                Enter repos in format: owner/repo
                {userTier === 'free' && userLimits && (
                  <span className="block mt-1 text-xs text-amber-400">
                    Free: {repos.length}/{userLimits.maxRepos} repos
                  </span>
                )}
              </CardDescription>
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
                          {/* Quality Widget - PLG Component */}
                          <div className="mb-6">
                            <QualityWidget repo={result.repo} platform="beast-mode" />
                          </div>

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

                          {/* Model Info Badge */}
                          {result.modelInfo && (
                            <div className="mb-4 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.modelInfo.name} {result.modelInfo.version}
                              </Badge>
                              <span className="text-xs text-slate-400">{result.modelInfo.accuracy}</span>
                              {result.modelInfo.trainingDate && (
                                <span className="text-xs text-slate-500">
                                  Trained: {new Date(result.modelInfo.trainingDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Inline Feedback Button */}
                          {result.predictionId && (
                            <div className="mb-4 flex items-center justify-between pt-2 border-t border-slate-700">
                              <span className="text-xs text-slate-400">Was this prediction helpful?</span>
                              <InlineFeedbackButton
                                predictionId={result.predictionId}
                                predictedValue={result.quality}
                                serviceName="beast-mode"
                                compact={true}
                              />
                            </div>
                          )}

                          {/* Confidence Explanation */}
                          {result.confidenceExplanation && (
                            <Card className="bg-blue-500/10 border-blue-500/30 mb-4">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getConfidenceBadgeColor(result.confidenceExplanation.level)}>
                                    {result.confidenceExplanation.level.replace('-', ' ')}
                                  </Badge>
                                  <span className="text-sm text-slate-400">
                                    Confidence: {(result.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">
                                  {result.confidenceExplanation.explanation}
                                </p>
                                {result.confidenceExplanation.factors && result.confidenceExplanation.factors.length > 0 && (
                                  <div className="text-xs text-slate-400 mb-2">
                                    Factors: {result.confidenceExplanation.factors.join(', ')}
                                  </div>
                                )}
                                <div className="text-xs text-cyan-400 italic">
                                  💡 {result.confidenceExplanation.recommendation}
                                </div>
                              </CardContent>
                            </Card>
                          )}

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
                              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Top Quality Factors</div>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(result.factors)
                                  .sort((a, b) => (b[1].importance || 0) - (a[1].importance || 0))
                                  .slice(0, 10)
                                  .map(([factor, data]: [string, any]) => (
                                    <div key={factor} className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                      <div className="text-xs text-slate-300 font-medium capitalize mb-1">
                                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                                      </div>
                                      <div className="text-xs text-blue-400">
                                        Value: {typeof data.value === 'number' ? data.value.toFixed(0) : data.value}
                                      </div>
                                      {data.importance && (
                                        <div className="text-xs text-slate-500 mt-1">
                                          Impact: {(data.importance * 100).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations - Using PLG Component */}
                          {result.recommendations && result.recommendations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Recommendations</div>
                              <RecommendationCards 
                                repo={result.repo} 
                                platform="beast-mode"
                                limit={5}
                              />
                            </div>
                          )}

                          {/* Trends Visualization */}
                          {trends[result.repo] && trends[result.repo].trends && trends[result.repo].trends.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Quality Trends (90 days)</div>
                              
                              {/* Trend Stats */}
                              {trends[result.repo].statistics && (
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                    <div className="text-xs text-slate-400 mb-1">Trend</div>
                                    <div className={`text-sm font-semibold flex items-center gap-1 ${
                                      trends[result.repo].statistics.trend === 'improving' ? 'text-green-400' :
                                      trends[result.repo].statistics.trend === 'declining' ? 'text-red-400' :
                                      'text-slate-400'
                                    }`}>
                                      {trends[result.repo].statistics.trend === 'improving' ? '📈' :
                                       trends[result.repo].statistics.trend === 'declining' ? '📉' : '➡️'}
                                      {trends[result.repo].statistics.trend}
                                    </div>
                                  </div>
                                  <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                    <div className="text-xs text-slate-400 mb-1">Change</div>
                                    <div className={`text-sm font-semibold ${
                                      trends[result.repo].statistics.trendValue > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {trends[result.repo].statistics.trendValue > 0 ? '+' : ''}
                                      {(trends[result.repo].statistics.trendValue * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                  <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                    <div className="text-xs text-slate-400 mb-1">Data Points</div>
                                    <div className="text-sm font-semibold text-slate-300">
                                      {trends[result.repo].statistics.count}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Simple Line Chart (using CSS) */}
                              <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                                <div className="relative h-32">
                                  {trends[result.repo].trends.length > 1 && (
                                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id={`gradient-${result.repo}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      {/* Grid lines */}
                                      {[0, 25, 50, 75, 100].map(y => (
                                        <line
                                          key={y}
                                          x1="0"
                                          y1={120 - (y * 1.2)}
                                          x2="400"
                                          y2={120 - (y * 1.2)}
                                          stroke="rgb(51, 65, 85)"
                                          strokeWidth="0.5"
                                          opacity="0.5"
                                        />
                                      ))}
                                      {/* Trend line */}
                                      <polyline
                                        points={trends[result.repo].trends.map((t: any, i: number) => {
                                          const x = (i / (trends[result.repo].trends.length - 1)) * 400;
                                          const y = 120 - (t.quality * 120);
                                          return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="rgb(34, 211, 238)"
                                        strokeWidth="2"
                                      />
                                      {/* Area under curve */}
                                      <polygon
                                        points={`0,120 ${trends[result.repo].trends.map((t: any, i: number) => {
                                          const x = (i / (trends[result.repo].trends.length - 1)) * 400;
                                          const y = 120 - (t.quality * 120);
                                          return `${x},${y}`;
                                        }).join(' ')} 400,120`}
                                        fill={`url(#gradient-${result.repo})`}
                                      />
                                      {/* Current point */}
                                      {trends[result.repo].trends.length > 0 && (() => {
                                        const last = trends[result.repo].trends[trends[result.repo].trends.length - 1];
                                        const x = 400;
                                        const y = 120 - (last.quality * 120);
                                        return (
                                          <circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="rgb(34, 211, 238)"
                                            stroke="rgb(15, 23, 42)"
                                            strokeWidth="2"
                                          />
                                        );
                                      })()}
                                    </svg>
                                  )}
                                  {trends[result.repo].trends.length <= 1 && (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                      Not enough data for trend visualization
                                    </div>
                                  )}
                                </div>
                                {/* X-axis labels */}
                                {trends[result.repo].trends.length > 1 && (
                                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                                    <span>
                                      {new Date(trends[result.repo].trends[0].date).toLocaleDateString()}
                                    </span>
                                    <span>
                                      {new Date(trends[result.repo].trends[trends[result.repo].trends.length - 1].date).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Comparative Analysis */}
                          {result.comparativeAnalysis && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Comparative Analysis</div>
                              
                              {/* Comparison Stats */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                  <div className="text-xs text-slate-400 mb-1">vs Average</div>
                                  <div className={`text-sm font-semibold ${
                                    result.comparativeAnalysis.comparison.vsAverage > 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {result.comparativeAnalysis.comparison.vsAverage > 0 ? '+' : ''}
                                    {(result.comparativeAnalysis.comparison.vsAverage * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                  <div className="text-xs text-slate-400 mb-1">Percentile</div>
                                  <div className="text-sm font-semibold text-cyan-400">
                                    {result.comparativeAnalysis.percentile.toFixed(0)}th
                                  </div>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                  <div className="text-xs text-slate-400 mb-1">Similar Repos</div>
                                  <div className="text-sm font-semibold text-slate-300">
                                    {result.comparativeAnalysis.similarReposCount}
                                  </div>
                                </div>
                              </div>

                              {/* Differentiators */}
                              {result.comparativeAnalysis.differentiators && result.comparativeAnalysis.differentiators.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs text-slate-400 mb-2">Key Differentiators:</div>
                                  <div className="space-y-2">
                                    {result.comparativeAnalysis.differentiators.map((diff: any, idx: number) => (
                                      <div key={idx} className={`bg-slate-800/50 rounded p-2 border ${
                                        diff.type === 'strength' ? 'border-green-500/50' : 'border-red-500/50'
                                      }`}>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-slate-300 capitalize">
                                            {diff.feature.replace(/([A-Z])/g, ' $1').trim()}
                                          </span>
                                          <Badge className={
                                            diff.type === 'strength'
                                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                              : 'bg-red-500/20 text-red-400 border-red-500/50'
                                          }>
                                            {diff.type === 'strength' ? '✓' : '⚠'} {Math.abs(diff.percentDifference).toFixed(0)}%
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                          You: {diff.value.toFixed(0)} | Avg: {diff.average.toFixed(0)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Insights */}
                              {result.comparativeAnalysis.insights && result.comparativeAnalysis.insights.length > 0 && (
                                <div>
                                  <div className="text-xs text-slate-400 mb-2">Insights:</div>
                                  <div className="space-y-2">
                                    {result.comparativeAnalysis.insights.map((insight: any, idx: number) => (
                                      <div key={idx} className={`bg-slate-800/50 rounded p-2 border ${
                                        insight.type === 'excellent' ? 'border-green-500/50' :
                                        insight.type === 'improvement' ? 'border-red-500/50' :
                                        'border-blue-500/50'
                                      }`}>
                                        <div className="text-xs text-slate-300 mb-1">{insight.message}</div>
                                        <div className="text-xs text-cyan-400 italic">{insight.action}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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

