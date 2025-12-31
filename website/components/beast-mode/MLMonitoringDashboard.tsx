"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

/**
 * ML Monitoring Dashboard
 * Real-time monitoring for ML system performance
 * 
 * Month 3: Week 3 - Monitoring Dashboard UI
 */
function MLMonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/ml/monitoring');
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }
      const data = await response.json();
      setDashboardData(data.dashboard || data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching monitoring data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '🚨';
      default:
        return '❓';
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-400">Loading monitoring data...</div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-400">Error: {error}</div>
        <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-xl font-semibold text-slate-300 mb-2">ML Monitoring Not Active</div>
            <div className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              ML monitoring tracks how well BEAST MODE's AI predictions are performing. 
              This helps us improve code quality recommendations and issue detection.
            </div>
            <div className="text-xs text-slate-500 max-w-md mx-auto">
              <strong>What this means:</strong> BEAST MODE is still working! This dashboard just shows 
              internal ML system metrics. Your quality scans, recommendations, and auto-fixes work independently.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const health = dashboardData.health || {};
  const predictions = dashboardData.predictions || {};
  const alerts = dashboardData.alerts || {};
  const services = dashboardData.services || {};

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header - Enhanced */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">ML System Monitoring</h2>
          </div>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Real-time performance and health metrics</p>
          <div className="mt-3 p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 rounded-xl">
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-cyan-400">What's being monitored:</strong> BEAST MODE uses machine learning to predict code quality, 
              identify potential issues, and recommend improvements. This dashboard shows how well our AI predictions are performing 
              in real-time—helping us make better recommendations for your code.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded w-4 h-4 accent-cyan-500"
            />
            Auto-refresh
          </label>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline" 
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Health Status - Enhanced */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-2 border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg font-bold flex items-center gap-3">
            <span className={`text-2xl ${getHealthColor(health.status)}`}>{getHealthIcon(health.status)}</span>
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Status</div>
              <div className={`text-3xl font-bold ${getHealthColor(health.status)}`}>
                {health.status?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Health Score</div>
              <div className="text-3xl font-bold text-cyan-400">
                {health.score ? Math.round(health.score) : 'N/A'}/100
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/50 transition-all duration-200">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Uptime</div>
              <div className="text-3xl font-bold text-white">
                {dashboardData.uptime?.formatted || '0s'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Metrics - Enhanced */}
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
            <span className="text-xl">📊</span>
            Prediction Performance
          </CardTitle>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            These metrics show how many quality predictions BEAST MODE has made for code analysis, 
            issue detection, and improvement recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl p-5 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Total Predictions</div>
              <div className="text-4xl font-bold text-white mt-2 mb-1">
                {predictions.total?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-slate-500">Quality & issue predictions</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl p-5 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">ML Model Predictions</div>
              <div className="text-4xl font-bold text-cyan-400 mt-2 mb-1">
                {predictions.mlModel?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-slate-500">
                {predictions.total > 0 
                  ? `${((predictions.mlModel / predictions.total) * 100).toFixed(1)}% of total`
                  : '0%'} • AI-powered
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl p-5 border-2 border-slate-700/50 hover:border-red-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Error Rate</div>
              <div className="text-4xl font-bold text-red-400 mt-2 mb-1">
                {predictions.errorRate 
                  ? `${(predictions.errorRate * 100).toFixed(2)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-slate-500">
                {predictions.errors || 0} errors • Prediction failures
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl p-5 border-2 border-slate-700/50 hover:border-yellow-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Avg Latency</div>
              <div className="text-4xl font-bold text-yellow-400 mt-2 mb-1">
                {predictions.avgLatency 
                  ? `${predictions.avgLatency.toFixed(0)}ms`
                  : '0ms'}
              </div>
              <div className="text-xs text-slate-500">Prediction response time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.total > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-red-400">🚨</span>
              Alerts ({alerts.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.recent?.slice(0, 5).map((alert: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    alert.severity === 'critical'
                      ? 'bg-red-900/20 border-red-500/50'
                      : 'bg-yellow-900/20 border-yellow-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-white">{alert.type}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        alert.severity === 'critical'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-black'
                      }`}
                    >
                      {alert.severity?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Service Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(services.integrations || {}).map(([service, status]: [string, any]) => (
              <div
                key={service}
                className={`p-3 rounded border ${
                  status.available
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-red-900/20 border-red-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{status.available ? '✅' : '❌'}</span>
                  <div>
                    <div className="font-semibold text-white capitalize">{service}</div>
                    <div className="text-xs text-slate-400">{status.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(services.integrations || {}).length === 0 && (
            <div className="text-center text-slate-400 py-4">No services registered</div>
          )}
        </CardContent>
      </Card>

      {/* Models */}
      {dashboardData.models && dashboardData.models.loaded > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">ML Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-400 mb-2">
              Loaded: {dashboardData.models.loaded} models
            </div>
            {Object.keys(dashboardData.models.performance || {}).length > 0 && (
              <div className="space-y-2">
                {Object.entries(dashboardData.models.performance).map(([modelId, perf]: [string, any]) => (
                  <div key={modelId} className="p-3 bg-slate-700 rounded">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-white">{modelId}</div>
                      <div className="text-sm text-slate-400">
                        {perf.predictions} predictions
                      </div>
                    </div>
                    {perf.avgAccuracy && (
                      <div className="text-xs text-slate-400 mt-1">
                        Avg Accuracy: {(perf.avgAccuracy * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MLMonitoringDashboard;

