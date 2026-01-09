'use client';

import { useState, useEffect } from 'react';

interface MonitoringMetrics {
  requests: {
    total: number;
    success: number;
    failures: number;
    successRate: string;
    byModel: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  performance: {
    averageLatency: string;
    p50Latency: string;
    p95Latency: string;
    p99Latency: string;
  };
  costs: {
    customModelCost: string;
    providerModelCost: string;
    savings: string;
    savingsPercent: string;
  };
  errors: Array<{
    modelId: string;
    endpoint: string;
    error: string;
    timestamp: string;
  }>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}

export default function CustomModelDashboard() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/models/custom/monitoring');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data.metrics);
      setHealth(data.health);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading monitoring data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <h2 className="text-red-400 font-semibold mb-2">Error Loading Metrics</h2>
            <p className="text-slate-400">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Custom Model Monitoring</h1>
              <p className="text-slate-400">
                Real-time metrics and health status for custom AI models
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Last Updated</div>
              <div className="text-lg font-mono">
                {lastUpdate.toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">Live</span>
              </div>
            </div>
          </div>

          {/* Health Status */}
          {health && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(health.status)}/20 border ${getStatusColor(health.status)}/50`}>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(health.status)}`}></div>
              <span className="font-semibold capitalize">{health.status}</span>
              {health.issues.length > 0 && (
                <span className="text-sm text-slate-300 ml-2">
                  ({health.issues.length} issue{health.issues.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {!metrics && (
          <div className="text-center py-12 text-slate-400">
            No metrics available yet. Start using custom models to see metrics.
          </div>
        )}

        {metrics && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Requests */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">Total Requests</div>
                <div className="text-3xl font-bold mb-1">{metrics.requests.total.toLocaleString()}</div>
                <div className="text-sm text-slate-500">
                  {metrics.requests.success} success, {metrics.requests.failures} failed
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">Success Rate</div>
                <div className="text-3xl font-bold mb-1">{metrics.requests.successRate}</div>
                <div className="text-sm text-slate-500">
                  {metrics.requests.success} / {metrics.requests.total}
                </div>
              </div>

              {/* Average Latency */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">Average Latency</div>
                <div className="text-3xl font-bold mb-1">{metrics.performance.averageLatency}</div>
                <div className="text-sm text-slate-500">
                  P95: {metrics.performance.p95Latency}
                </div>
              </div>

              {/* Cost Savings */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">Cost Savings</div>
                <div className="text-3xl font-bold mb-1 text-green-400">{metrics.costs.savings}</div>
                <div className="text-sm text-slate-500">
                  {metrics.costs.savingsPercent} vs provider models
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Latency Percentiles */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <h2 className="text-xl font-semibold mb-4">Latency Percentiles</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">P50 (Median)</span>
                    <span className="text-lg font-mono">{metrics.performance.p50Latency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">P95</span>
                    <span className="text-lg font-mono">{metrics.performance.p95Latency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">P99</span>
                    <span className="text-lg font-mono">{metrics.performance.p99Latency}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Custom Model Cost</span>
                    <span className="text-lg font-mono">{metrics.costs.customModelCost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Provider Model Cost</span>
                    <span className="text-lg font-mono">{metrics.costs.providerModelCost}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-green-400 font-semibold">Total Savings</span>
                    <span className="text-lg font-mono text-green-400">{metrics.costs.savings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests by Model */}
            {Object.keys(metrics.requests.byModel).length > 0 && (
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 mb-8">
                <h2 className="text-xl font-semibold mb-4">Requests by Model</h2>
                <div className="space-y-2">
                  {Object.entries(metrics.requests.byModel)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, count]) => (
                      <div key={model} className="flex justify-between items-center">
                        <span className="text-slate-300 font-mono text-sm">{model}</span>
                        <span className="text-lg font-semibold">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Errors */}
            {metrics.errors.length > 0 && (
              <div className="bg-slate-900 rounded-lg p-6 border border-red-500/50 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-red-400">Recent Errors</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {metrics.errors.map((err, idx) => (
                    <div key={idx} className="bg-slate-800 rounded p-3 border border-red-500/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-mono text-sm text-red-400">{err.modelId}</div>
                          <div className="text-xs text-slate-500 mt-1">{err.endpoint}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(err.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-slate-300">{err.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Issues */}
            {health && health.issues.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-yellow-400">Health Issues</h2>
                <ul className="space-y-2">
                  {health.issues.map((issue, idx) => (
                    <li key={idx} className="text-slate-300">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
