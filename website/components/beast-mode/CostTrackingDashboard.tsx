"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface CostMetrics {
  customModelCost: number;
  providerModelCost: number;
  savings: number;
  savingsPercent: number;
  totalRequests: number;
  customRequests: number;
  providerRequests: number;
  avgCostPerRequest: number;
}

interface PerformanceMetrics {
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
}

interface CostTrackingData {
  costs: CostMetrics;
  performance: PerformanceMetrics;
  byModel: Array<{
    modelId: string;
    requests: number;
    cost: number;
    avgLatency: number;
  }>;
  timeRange: string;
}

export default function CostTrackingDashboard() {
  const [data, setData] = useState<CostTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchCostData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCostData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchCostData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/models/custom/monitoring?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cost data');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching cost data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  }

  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center">Loading cost data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={fetchCostData}
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
        <div className="text-center">No cost data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cost Tracking Dashboard</h2>
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
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custom Model Cost</CardTitle>
            <CardDescription>Total spent on custom models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.costs.customModelCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Provider Model Cost</CardTitle>
            <CardDescription>Would have cost with providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.costs.providerModelCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <CardDescription>Money saved using custom models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.costs.savings)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatPercent(data.costs.savingsPercent)} savings
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
            <CardDescription>Average cost per API call</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.costs.avgCostPerRequest)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Request Breakdown</CardTitle>
          <CardDescription>Custom vs Provider model usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Requests</span>
              <Badge variant="outline">{data.costs.totalRequests.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Custom Model Requests</span>
              <Badge variant="outline" className="bg-green-100">
                {data.costs.customRequests.toLocaleString()} ({formatPercent((data.costs.customRequests / data.costs.totalRequests) * 100)})
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Provider Model Requests</span>
              <Badge variant="outline" className="bg-red-100">
                {data.costs.providerRequests.toLocaleString()} ({formatPercent((data.costs.providerRequests / data.costs.totalRequests) * 100)})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Response time and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-500">Avg Latency</div>
              <div className="text-xl font-bold">{data.performance.averageLatency.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">P50 Latency</div>
              <div className="text-xl font-bold">{data.performance.p50Latency.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">P95 Latency</div>
              <div className="text-xl font-bold">{data.performance.p95Latency.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">P99 Latency</div>
              <div className="text-xl font-bold">{data.performance.p99Latency.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xl font-bold">{formatPercent(data.performance.successRate)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost by Model */}
      {data.byModel && data.byModel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
            <CardDescription>Breakdown of costs per model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byModel.map((model) => (
                <div key={model.modelId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{model.modelId}</div>
                    <div className="text-sm text-gray-500">
                      {model.requests} requests • {model.avgLatency.toFixed(0)}ms avg
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(model.cost)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh indicator */}
      <div className="text-sm text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refreshes every 30s
      </div>
    </div>
  );
}
