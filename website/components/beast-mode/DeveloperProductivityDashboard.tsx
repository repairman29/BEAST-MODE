"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface DeveloperMetrics {
  developerId: string;
  developerName: string;
  featuresCompleted: number;
  avgTimePerFeature: number;
  avgQuality: number;
  bugRate: number;
  productivityScore: number;
}

interface ProductivityData {
  developers: DeveloperMetrics[];
  overall: {
    totalFeatures: number;
    avgTimePerFeature: number;
    avgQuality: number;
    avgBugRate: number;
  };
  trends: Array<{
    date: string;
    featuresCompleted: number;
    avgQuality: number;
  }>;
}

export default function DeveloperProductivityDashboard() {
  const [data, setData] = useState<ProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchProductivityData();
    const interval = setInterval(fetchProductivityData, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchProductivityData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery/productivity?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch productivity data');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching productivity data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function getProductivityColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center">Loading productivity metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={fetchProductivityData}
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
        <div className="text-center">No productivity data available</div>
      </div>
    );
  }

  // Sort developers by productivity score
  const sortedDevelopers = [...data.developers].sort(
    (a, b) => b.productivityScore - a.productivityScore
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Developer Productivity Dashboard</h2>
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

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <CardDescription>Features completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.totalFeatures.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Time/Feature</CardTitle>
            <CardDescription>Average generation time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(data.overall.avgTimePerFeature)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
            <CardDescription>Average code quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.overall.avgQuality * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Bug Rate</CardTitle>
            <CardDescription>Bugs per feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.avgBugRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Leaderboard</CardTitle>
          <CardDescription>Ranked by productivity score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedDevelopers.map((dev, index) => (
              <div 
                key={dev.developerId} 
                className={`flex justify-between items-center p-4 rounded ${
                  index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400' : 
                    index === 1 ? 'bg-gray-300' : 
                    index === 2 ? 'bg-orange-300' : 'bg-gray-200'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{dev.developerName || dev.developerId}</div>
                    <div className="text-sm text-gray-500">
                      {dev.featuresCompleted} features • {formatTime(dev.avgTimePerFeature)} avg
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Quality</div>
                    <div className="font-medium">{(dev.avgQuality * 100).toFixed(1)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Bug Rate</div>
                    <div className="font-medium">{dev.bugRate.toFixed(2)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Score</div>
                    <div className={`text-xl font-bold ${getProductivityColor(dev.productivityScore)}`}>
                      {dev.productivityScore.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      {data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productivity Trends</CardTitle>
            <CardDescription>Features and quality over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.trends.map((trend) => (
                <div key={trend.date} className="flex justify-between items-center p-2">
                  <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex gap-4">
                    <span className="text-sm">{trend.featuresCompleted} features</span>
                    <span className="text-sm font-medium">
                      Quality: {(trend.avgQuality * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.developers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-2">👨‍💻</div>
            <div className="text-lg font-semibold">No developer data yet</div>
            <div className="text-sm text-gray-500 mt-2">
              Productivity metrics will appear as developers generate features
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
