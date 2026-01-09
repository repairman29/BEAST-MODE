'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BotFeedbackStats {
  totalBotFeedback: number;
  byBot: Record<string, number>;
  byOutcome: { success: number; failure: number };
  byRepo: Record<string, number>;
  recentActivity: Array<{
    id: string;
    botName: string;
    outcome: string;
    repo: string;
    timestamp: string;
  }>;
}

export default function BotFeedbackPage() {
  const [stats, setStats] = useState<BotFeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBotFeedbackStats();
    const interval = setInterval(loadBotFeedbackStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadBotFeedbackStats() {
    try {
      const response = await fetch('/api/feedback/bot-stats');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center">Loading bot feedback stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div>No bot feedback data available</div>
      </div>
    );
  }

  const total = stats.totalBotFeedback;
  const successRate = total > 0 ? (stats.byOutcome.success / total * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-950 text-slate-200 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Feedback Dashboard</h1>
        <p className="text-slate-400">Monitor feedback from all integrated bots</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.byOutcome.success}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.byOutcome.failure}</div>
          </CardContent>
        </Card>
      </div>

      {/* By Bot */}
      <Card className="bg-slate-800/50 border-slate-700/50 mb-8">
        <CardHeader>
          <CardTitle>Feedback by Bot</CardTitle>
          <CardDescription>Distribution of feedback across all bots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.byBot)
              .sort((a, b) => b[1] - a[1])
              .map(([bot, count]) => {
                const percentage = total > 0 ? (count / total * 100) : 0;
                return (
                  <div key={bot}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{bot}</span>
                      <span className="text-sm text-slate-400">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Top Repos */}
      <Card className="bg-slate-800/50 border-slate-700/50 mb-8">
        <CardHeader>
          <CardTitle>Top Repositories</CardTitle>
          <CardDescription>Repos with most bot feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.byRepo)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([repo, count]) => (
                <div key={repo} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-sm font-mono">{repo}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest bot feedback events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 20).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Badge variant={activity.outcome === 'success' ? 'default' : 'destructive'}>
                    {activity.outcome}
                  </Badge>
                  <span className="text-sm font-medium">{activity.botName}</span>
                  <span className="text-xs text-slate-400 font-mono">{activity.repo}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
