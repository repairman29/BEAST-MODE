"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface PerformanceMetrics {
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  totalRequests: number;
  requestsPerSecond: number;
}

interface RequestMetrics {
  total: number;
  success: number;
  failures: number;
  byModel: Record<string, number>;
  byEndpoint: Record<string, number>;
}

interface PerformanceData {
  performance: PerformanceMetrics;
  requests: RequestMetrics;
  timestamp: string;
}

export default function PerformanceMetricsDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // Every 30s
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  async function fetchPerformanceData() {
    try {
      setLoading(true);
      // Fetch from multiple sources for comprehensive metrics
      const [monitoringRes, latencyRes, performanceRes] = await Promise.all([
        fetch(`/api/models/custom/monitoring?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/optimization/latency`).catch(() => null),
        fetch(`/api/beast-mode/monitoring/performance?timeRange=${timeRange}`).catch(() => null)
      ]);
      
      const monitoring = monitoringRes ? await monitoringRes.json().catch(() => null) : null;
      const latency = latencyRes ? await latencyRes.json().catch(() => null) : null;
      const performance = performanceRes ? await performanceRes.json().catch(() => null) : null;
      
      // Combine data from all sources
      const response = monitoring || {};
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const result = await response.json();
      
      if (result.metrics) {
        setData({
          performance: {
            averageLatency: result.metrics.performance?.averageLatency || 0,
            p50Latency: result.metrics.performance?.p50Latency || 0,
            p95Latency: result.metrics.performance?.p95Latency || 0,
            p99Latency: result.metrics.performance?.p99Latency || 0,
            successRate: parseFloat(result.metrics.requests?.successRate?.replace('%', '') || '0'),
            totalRequests: result.metrics.requests?.total || 0,
            requestsPerSecond: 0 // Calculate from time range
          },
          requests: {
            total: result.metrics.requests?.total || 0,
            success: result.metrics.requests?.success || 0,
            failures: result.metrics.requests?.failures || 0,
            byModel: result.metrics.requests?.byModel || {},
            byEndpoint: result.metrics.requests?.byEndpoint || {}
          },
          timestamp: result.timestamp || new Date().toISOString()
        });
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatLatency(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getLatencyColor(latency: number): string {
    if (latency < 200) return 'text-green-600';
    if (latency < 500) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getSuccessRateColor(rate: number): string {
    if (rate >= 99) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center">Loading performance metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={fetchPerformanceData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">No performance data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Metrics Dashboard</h2>
        <div className="flex gap-2 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              30d
            </button>
          </div>
          <label className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Latency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <CardDescription>Mean response time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(data.performance.averageLatency)}`}>
              {formatLatency(data.performance.averageLatency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">P50 Latency</CardTitle>
            <CardDescription>Median response time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(data.performance.p50Latency)}`}>
              {formatLatency(data.performance.p50Latency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">P95 Latency</CardTitle>
            <CardDescription>95th percentile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(data.performance.p95Latency)}`}>
              {formatLatency(data.performance.p95Latency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">P99 Latency</CardTitle>
            <CardDescription>99th percentile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(data.performance.p99Latency)}`}>
              {formatLatency(data.performance.p99Latency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate & Requests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CardDescription>Percentage of successful requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(data.performance.successRate)}`}>
              {data.performance.successRate.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.requests.success} / {data.requests.total} requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <CardDescription>Requests in time range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.requests.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.requests.success} successful, {data.requests.failures} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Requests/Second</CardTitle>
            <CardDescription>Average throughput</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.requestsPerSecond > 0 
                ? data.performance.requestsPerSecond.toFixed(2)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests by Model */}
      {Object.keys(data.requests.byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requests by Model</CardTitle>
            <CardDescription>Distribution across models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.requests.byModel)
                .sort(([, a], [, b]) => b - a)
                .map(([model, count]) => (
                  <div key={model} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{model}</span>
                    <Badge variant="outline">{count.toLocaleString()}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests by Endpoint */}
      {Object.keys(data.requests.byEndpoint).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requests by Endpoint</CardTitle>
            <CardDescription>API endpoint usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.requests.byEndpoint)
                .sort(([, a], [, b]) => b - a)
                .map(([endpoint, count]) => (
                  <div key={endpoint} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{endpoint}</span>
                    <Badge variant="outline">{count.toLocaleString()}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh indicator */}
      <div className="text-sm text-gray-500 text-center">
        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
        {autoRefresh && ' • Auto-refreshing every 30s'}
      </div>
    </div>
  );
}
