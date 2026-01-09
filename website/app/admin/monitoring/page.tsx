'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Real-Time Monitoring Dashboard
 * 
 * Displays monitoring metrics for all models and requests
 */

interface MonitoringStats {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  cacheHitRate: number;
  byModel: Array<{
    modelId: string;
    requests: number;
    successRate: number;
    averageLatency: number;
    cacheHits: number;
  }>;
  recentRequests: Array<{
    id: string;
    modelId: string;
    success: boolean;
    latency: number;
    fromCache: boolean;
    timestamp: string;
  }>;
}

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/monitoring/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring stats');
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

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Real-Time Monitoring</h1>
          <p className="text-slate-400">Monitor all model requests, performance, and cache metrics</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={() => fetchStats()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            🔄 Refresh
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}
          >
            {autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Resume Auto-Refresh'}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-500/50 mb-6">
            <CardContent className="pt-6">
              <p className="text-red-400">❌ Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-900/90 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-400 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalRequests.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/90 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-400 mb-1">Success Rate</div>
                  <div className={`text-3xl font-bold ${
                    stats.successRate >= 0.95 ? 'text-green-400' :
                    stats.successRate >= 0.8 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {(stats.successRate * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/90 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-400 mb-1">Avg Latency</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {stats.averageLatency.toFixed(0)}ms
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/90 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-400 mb-1">Cache Hit Rate</div>
                  <div className={`text-3xl font-bold ${
                    stats.cacheHitRate >= 0.4 ? 'text-green-400' :
                    stats.cacheHitRate >= 0.2 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {(stats.cacheHitRate * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Model */}
            <Card className="bg-slate-900/90 border-slate-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Performance by Model</CardTitle>
                <CardDescription>Request metrics broken down by model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-300 font-semibold">Model</th>
                        <th className="text-center p-3 text-slate-300 font-semibold">Requests</th>
                        <th className="text-center p-3 text-slate-300 font-semibold">Success Rate</th>
                        <th className="text-center p-3 text-slate-300 font-semibold">Avg Latency</th>
                        <th className="text-center p-3 text-slate-300 font-semibold">Cache Hits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byModel.map((model, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="p-3">
                            <div className="font-medium text-white">{model.modelId}</div>
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            {model.requests.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={
                              model.successRate >= 0.95 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                              model.successRate >= 0.8 ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                              'bg-red-500/20 text-red-400 border-red-500/50'
                            }>
                              {(model.successRate * 100).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            {model.averageLatency.toFixed(0)}ms
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            {model.cacheHits} ({(model.cacheHits / model.requests * 100).toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                      {stats.byModel.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            No model data available yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="bg-slate-900/90 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Requests</CardTitle>
                <CardDescription>Last 20 requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <Badge className={
                          request.success
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border-red-500/50'
                        }>
                          {request.success ? '✅' : '❌'}
                        </Badge>
                        <div>
                          <div className="text-white font-medium">{request.modelId}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(request.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {request.fromCache && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                            Cache Hit
                          </Badge>
                        )}
                        <div className="text-slate-300 text-sm">
                          {request.latency}ms
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.recentRequests.length === 0 && (
                    <div className="text-center py-6 text-slate-500">
                      No recent requests
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
