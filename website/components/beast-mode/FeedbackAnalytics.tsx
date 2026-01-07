'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';

interface FeedbackStats {
  stats: {
    totalPredictions: number;
    withActuals: number;
    withoutActuals: number;
    feedbackRate: number;
    autoCollected?: number;
    manualCollected?: number;
    targetRate: number;
    health: 'healthy' | 'needs-attention' | 'critical';
  };
  byService: Record<string, {
    total: number;
    recent: number;
    old: number;
    withContext: number;
  }>;
  needingFeedback: number;
}

export default function FeedbackAnalytics() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/feedback/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-slate-400">Loading feedback analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-red-400">Failed to load feedback analytics: {error || 'Unknown error'}</div>
        </CardContent>
      </Card>
    );
  }

  const feedbackRate = stats.stats.feedbackRate;
  const targetRate = stats.stats.targetRate;
  const progress = Math.min(100, (feedbackRate / targetRate) * 100);
  const healthColor = {
    healthy: 'text-green-400 bg-green-500/20 border-green-500/50',
    'needs-attention': 'text-amber-400 bg-amber-500/20 border-amber-500/50',
    critical: 'text-red-400 bg-red-500/20 border-red-500/50'
  }[stats.stats.health] || 'text-slate-400';

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center gap-2">
          📊 Feedback Analytics
        </CardTitle>
        <CardDescription className="text-slate-400">
          ML prediction feedback collection metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Total Predictions</div>
            <div className="text-2xl font-bold text-white">{stats.stats.totalPredictions.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">With Feedback</div>
            <div className="text-2xl font-bold text-green-400">{stats.stats.withActuals.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Feedback Rate</div>
            <div className="text-2xl font-bold text-cyan-400">{(feedbackRate * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Health Status</div>
            <Badge className={healthColor}>{stats.stats.health}</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Progress to Target ({(targetRate * 100).toFixed(0)}%)</span>
            <span className="text-sm text-slate-400">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Feedback Collection Breakdown */}
        {(stats.stats.autoCollected !== undefined || stats.stats.manualCollected !== undefined) && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-sm font-semibold text-white mb-3">Collection Methods</div>
            <div className="grid grid-cols-2 gap-4">
              {stats.stats.autoCollected !== undefined && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Auto-Collected</div>
                  <div className="text-lg font-bold text-cyan-400">{stats.stats.autoCollected}</div>
                </div>
              )}
              {stats.stats.manualCollected !== undefined && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Manual</div>
                  <div className="text-lg font-bold text-green-400">{stats.stats.manualCollected}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* By Service */}
        {Object.keys(stats.byService).length > 0 && (
          <div>
            <div className="text-sm font-semibold text-white mb-3">Feedback by Service</div>
            <div className="space-y-2">
              {Object.entries(stats.byService).map(([service, data]) => (
                <div key={service} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{service}</span>
                    <span className="text-xs text-slate-400">{data.total} predictions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Recent (24h)</div>
                      <div className="text-cyan-400 font-semibold">{data.recent}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Old (>7d)</div>
                      <div className="text-amber-400 font-semibold">{data.old}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">With Context</div>
                      <div className="text-green-400 font-semibold">{data.withContext}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {feedbackRate < targetRate && (
          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
            <div className="text-sm font-semibold text-amber-400 mb-2">💡 Recommendations</div>
            <ul className="text-xs text-amber-300 space-y-1 list-disc list-inside">
              <li>Verify predictionId flow in all services</li>
              <li>Check feedback collection triggers</li>
              <li>Review service logs for errors</li>
              <li>Ensure feedback UI is accessible</li>
              {stats.needingFeedback > 0 && (
                <li>{stats.needingFeedback} predictions need feedback</li>
              )}
            </ul>
          </div>
        )}

        {/* Training Readiness */}
        {stats.stats.withActuals >= 50 && (
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
            <div className="text-sm font-semibold text-green-400 mb-1">✅ Ready to Train!</div>
            <div className="text-xs text-green-300">
              {stats.stats.withActuals} predictions with feedback - sufficient for model training
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

