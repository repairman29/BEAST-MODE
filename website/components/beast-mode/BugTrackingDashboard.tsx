"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface BugMetrics {
  total: number;
  byFeature: Array<{
    feature: string;
    bugs: number;
    rate: number;
  }>;
  byCategory: {
    syntax: number;
    logic: number;
    performance: number;
    security: number;
    other: number;
  };
  trends: Array<{
    date: string;
    count: number;
    rate: number;
  }>;
  averageRate: number;
}

export default function BugTrackingDashboard() {
  const [data, setData] = useState<BugMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchBugData();
    const interval = setInterval(fetchBugData, 60000); // Every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchBugData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery/bug-tracking?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bug data');
      }
      
      const result = await response.json();
      setData(result.bugs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching bug data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getRateColor(rate: number): string {
    if (rate < 2) return 'text-green-600';
    if (rate < 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <LoadingState message="Loading bug tracking data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<span className="text-6xl">🐛</span>}
          title="Failed to load bug tracking data"
          description={error}
          action={{
            label: 'Retry',
            onClick: fetchBugData
          }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<span className="text-6xl">🐛</span>}
          title="No bug tracking data available"
          description="Bug tracking data will appear here as features are generated and tested."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bug Tracking Dashboard</h2>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
            <CardDescription>Bugs in time range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Bug Rate</CardTitle>
            <CardDescription>Bugs per feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRateColor(data.averageRate)}`}>
              {data.averageRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Features Tracked</CardTitle>
            <CardDescription>Features with bug data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.byFeature.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bugs by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Bugs by Category</CardTitle>
          <CardDescription>Distribution of bug types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Syntax</div>
              <div className="text-2xl font-bold">{data.byCategory.syntax}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Logic</div>
              <div className="text-2xl font-bold">{data.byCategory.logic}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Performance</div>
              <div className="text-2xl font-bold">{data.byCategory.performance}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Security</div>
              <div className="text-2xl font-bold">{data.byCategory.security}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Other</div>
              <div className="text-2xl font-bold">{data.byCategory.other}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bugs by Feature */}
      {data.byFeature.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bugs by Feature</CardTitle>
            <CardDescription>Bug rates per feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byFeature
                .sort((a, b) => b.rate - a.rate)
                .map((feature) => (
                  <div key={feature.feature} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{feature.feature}</div>
                      <div className="text-sm text-gray-500">{feature.bugs} bugs</div>
                    </div>
                    <div className={`text-lg font-bold ${getRateColor(feature.rate)}`}>
                      {feature.rate.toFixed(2)}%
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bug Trends</CardTitle>
            <CardDescription>Bug rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.trends.map((trend) => (
                <div key={trend.date} className="flex justify-between items-center p-2">
                  <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex gap-4">
                    <span className="text-sm">{trend.count} bugs</span>
                    <span className={`text-sm font-medium ${getRateColor(trend.rate)}`}>
                      {trend.rate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.total === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-2">🐛</div>
            <div className="text-lg font-semibold">No bugs tracked yet</div>
            <div className="text-sm text-gray-500 mt-2">
              Bug tracking will appear here as features are generated and tested
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
