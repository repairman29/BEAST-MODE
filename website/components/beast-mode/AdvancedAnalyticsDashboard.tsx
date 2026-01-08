"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AnalyticsData {
  quality: {
    trends: Array<{ date: string; score: number }>;
    average: number;
    distribution: Record<string, number>;
  };
  performance: {
    latency: Array<{ date: string; avg: number; p95: number; p99: number }>;
    throughput: Array<{ date: string; requests: number }>;
    successRate: number;
  };
  delivery: {
    featuresCompleted: number;
    avgTimeToCode: number;
    bugRate: number;
    productivityScore: number;
  };
  cost: {
    customModelCost: number;
    providerModelCost: number;
    savings: number;
    savingsPercent: number;
    trends: Array<{ date: string; cost: number; savings: number }>;
  };
  models: {
    topPerformers: Array<{ modelId: string; score: number; requests: number }>;
    qualityComparison: Record<string, number>;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'performance' | 'delivery' | 'cost' | 'models'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchAnalyticsData() {
    try {
      setLoading(true);
      
      // Fetch from multiple APIs
      const [qualityRes, performanceRes, deliveryRes, costRes, modelsRes] = await Promise.all([
        fetch(`/api/analytics/quality?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/analytics/performance?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/analytics/delivery?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/analytics/cost?timeRange=${timeRange}`).catch(() => null),
        fetch(`/api/analytics/models?timeRange=${timeRange}`).catch(() => null)
      ]);

      const quality = qualityRes ? await qualityRes.json().catch(() => null) : null;
      const performance = performanceRes ? await performanceRes.json().catch(() => null) : null;
      const delivery = deliveryRes ? await deliveryRes.json().catch(() => null) : null;
      const cost = costRes ? await costRes.json().catch(() => null) : null;
      const models = modelsRes ? await modelsRes.json().catch(() => null) : null;

      setData({
        quality: quality?.data || { trends: [], average: 0, distribution: {} },
        performance: performance?.data || { latency: [], throughput: [], successRate: 0 },
        delivery: delivery?.data || { featuresCompleted: 0, avgTimeToCode: 0, bugRate: 0, productivityScore: 0 },
        cost: cost?.data || { customModelCost: 0, providerModelCost: 0, savings: 0, savingsPercent: 0, trends: [] },
        models: models?.data || { topPerformers: [], qualityComparison: {} }
      });
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }

  function exportData() {
    if (!data) return;
    
    const exportObj = {
      timeRange,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={fetchAnalyticsData}
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
        <div className="text-center">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Advanced Analytics Dashboard</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'quality', 'performance', 'delivery', 'cost', 'models'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(data.quality.average * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.performance.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Features Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.delivery.featuresCompleted.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${data.cost.savings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {data.cost.savingsPercent.toFixed(1)}% savings
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>Quality scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              {data.quality.trends.length > 0 ? (
                <div className="space-y-2">
                  {data.quality.trends.map((trend) => (
                    <div key={trend.date} className="flex justify-between items-center p-2">
                      <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${trend.score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(trend.score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No quality data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latency Trends</CardTitle>
              <CardDescription>Response times over time</CardDescription>
            </CardHeader>
            <CardContent>
              {data.performance.latency.length > 0 ? (
                <div className="space-y-2">
                  {data.performance.latency.map((lat) => (
                    <div key={lat.date} className="flex justify-between items-center p-2">
                      <span className="text-sm">{new Date(lat.date).toLocaleDateString()}</span>
                      <div className="flex gap-4 text-sm">
                        <span>Avg: {lat.avg}ms</span>
                        <span>P95: {lat.p95}ms</span>
                        <span>P99: {lat.p99}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No performance data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Features Completed</div>
                <div className="text-2xl font-bold">{data.delivery.featuresCompleted}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Time to Code</div>
                <div className="text-2xl font-bold">{(data.delivery.avgTimeToCode / 1000).toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bug Rate</div>
                <div className="text-2xl font-bold">{data.delivery.bugRate.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Productivity Score</div>
                <div className="text-2xl font-bold">{data.delivery.productivityScore.toFixed(0)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Tab */}
      {activeTab === 'cost' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Custom Models</div>
                  <div className="text-2xl font-bold">${data.cost.customModelCost.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Provider Models</div>
                  <div className="text-2xl font-bold">${data.cost.providerModelCost.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-sm text-gray-500">Savings</div>
                  <div className="text-2xl font-bold text-green-600">${data.cost.savings.toFixed(2)}</div>
                  <div className="text-sm text-green-600">{data.cost.savingsPercent.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Models</CardTitle>
            </CardHeader>
            <CardContent>
              {data.models.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {data.models.topPerformers.map((model) => (
                    <div key={model.modelId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{model.modelId}</div>
                        <div className="text-sm text-gray-500">{model.requests} requests</div>
                      </div>
                      <div className="text-xl font-bold">{model.score.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No model data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
