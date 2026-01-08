"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface MonitoringData {
  errors: {
    total: number;
    rate: number;
    recent: Array<{
      id: string;
      message: string;
      timestamp: string;
      severity: 'error' | 'warning' | 'info';
      endpoint?: string;
    }>;
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    requestsPerSecond: number;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'performance' | 'availability';
    message: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
    resolved: boolean;
  }>;
  health: {
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'down';
      uptime: number;
      lastCheck: string;
    }>;
  };
}

export default function ProductionMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Every 30s
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  async function fetchMonitoringData() {
    try {
      setLoading(true);
      
      // Fetch from multiple monitoring endpoints
      const [errorsRes, performanceRes, alertsRes, healthRes] = await Promise.all([
        fetch(`/api/monitoring/metrics?type=errors&timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/monitoring/metrics?type=performance&timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/monitoring/alerts?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/health/services`).catch(() => null)
      ]);

      const errors = errorsRes ? await errorsRes.json().catch(() => null) : null;
      const performance = performanceRes ? await performanceRes.json().catch(() => null) : null;
      const alerts = alertsRes ? await alertsRes.json().catch(() => null) : null;
      const health = healthRes ? await healthRes.json().catch(() => null) : null;

      setData({
        errors: {
          total: errors?.data?.total || 0,
          rate: errors?.data?.rate || 0,
          recent: errors?.data?.recent || []
        },
        performance: {
          averageLatency: performance?.data?.averageLatency || 0,
          p95Latency: performance?.data?.p95Latency || 0,
          p99Latency: performance?.data?.p99Latency || 0,
          requestsPerSecond: performance?.data?.requestsPerSecond || 0
        },
        alerts: alerts?.data?.alerts || [],
        health: {
          status: health?.status || 'unknown',
          services: health?.services || {}
        }
      });

      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center">Loading monitoring data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={fetchMonitoringData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">No monitoring data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Production Monitoring</h1>
        <div className="flex gap-2 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
          <label className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-300">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Health Status */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(data.health.status)}`}></span>
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.health.services).map(([service, info]) => (
              <div key={service} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(info.status)}`}></span>
                <div>
                  <div className="text-white font-semibold capitalize">{service}</div>
                  <div className="text-slate-400 text-sm">{info.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Active Alerts</CardTitle>
            <CardDescription>Critical issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.filter(a => !a.resolved).map(alert => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-800 rounded border border-slate-700 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-white font-semibold">{alert.type}</span>
                    </div>
                    <div className="text-slate-300 text-sm">{alert.message}</div>
                    <div className="text-slate-500 text-xs mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Resolve</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Error Rate</CardTitle>
            <CardDescription>Errors per hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {data.errors.rate.toFixed(2)}
            </div>
            <div className="text-slate-400 text-sm mt-2">
              Total: {data.errors.total} errors
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
            <CardDescription>Average latency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {data.performance.averageLatency.toFixed(0)}ms
            </div>
            <div className="text-slate-400 text-sm mt-2">
              P95: {data.performance.p95Latency.toFixed(0)}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {data.errors.recent.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Errors</CardTitle>
            <CardDescription>Latest error occurrences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.errors.recent.slice(0, 10).map(err => (
                <div
                  key={err.id}
                  className="p-3 bg-slate-800 rounded border border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(err.severity)}>
                          {err.severity}
                        </Badge>
                        {err.endpoint && (
                          <span className="text-slate-400 text-xs">{err.endpoint}</span>
                        )}
                      </div>
                      <div className="text-slate-300 text-sm">{err.message}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {new Date(err.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
