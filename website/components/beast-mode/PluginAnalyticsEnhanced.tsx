"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface PluginAnalyticsData {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  mostPopularPlugins: Array<{
    pluginId: string;
    name: string;
    executions: number;
    successRate: number;
  }>;
  usageTrends: Array<{
    date: string;
    executions: number;
    successRate: number;
  }>;
  pluginBreakdown: Record<string, {
    executions: number;
    successRate: number;
    averageTime: number;
    errors: number;
  }>;
}

interface PluginAnalyticsEnhancedProps {
  userId?: string;
}

export default function PluginAnalyticsEnhanced({ userId }: PluginAnalyticsEnhancedProps) {
  const [analytics, setAnalytics] = useState<PluginAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [userId, timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/beast-mode/marketplace/analytics?userId=${userId || 'demo-user'}&timeRange=${timeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No analytics data yet</div>
          <div className="text-sm text-slate-400">
            Start using plugins to see usage statistics and performance metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <CardTitle className="text-white text-lg">Plugin Analytics</CardTitle>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              className={
                timeRange === range
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Total Executions</div>
            <div className="text-3xl font-bold text-white">
              {(analytics.totalExecutions ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">All plugins combined</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Success Rate</div>
            <div className="text-3xl font-bold text-green-400">
              {((analytics.successRate ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Successful executions</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Avg Execution Time</div>
            <div className="text-3xl font-bold text-cyan-400">
              {(analytics.averageExecutionTime ?? 0).toFixed(0)}ms
            </div>
            <div className="text-xs text-slate-500 mt-1">Average across all plugins</div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Plugins */}
      {analytics.mostPopularPlugins && analytics.mostPopularPlugins.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔥 Most Popular Plugins</CardTitle>
            <CardDescription className="text-slate-400">
              Top plugins by execution count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostPopularPlugins.slice(0, 5).map((plugin, idx) => (
                <div
                  key={plugin.pluginId}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-slate-600 w-8">#{idx + 1}</div>
                    <div>
                      <div className="text-white font-semibold">{plugin.name}</div>
                      <div className="text-slate-400 text-xs">
                        {plugin.executions.toLocaleString()} executions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      {((plugin.successRate ?? 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-slate-500 text-xs">success rate</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Trends Chart (Simple Bar Chart) */}
      {analytics.usageTrends && analytics.usageTrends.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📈 Usage Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Execution trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.usageTrends.slice(-14).map((trend, idx) => {
                const maxExecutions = Math.max(
                  ...analytics.usageTrends.map((t) => t.executions),
                  1
                );
                const percentage = (trend.executions / maxExecutions) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="text-slate-400 text-xs w-20 text-right">
                      {new Date(trend.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-full h-6 relative">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-6 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-semibold">
                        {trend.executions}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs w-16 text-right">
                      {((trend.successRate ?? 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plugin Breakdown */}
      {analytics.pluginBreakdown && Object.keys(analytics.pluginBreakdown).length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔍 Plugin Breakdown</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed metrics per plugin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.pluginBreakdown).map(([pluginId, metrics]) => (
                <div
                  key={pluginId}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">{pluginId}</div>
                    <div className="text-green-400 font-semibold">
                      {((metrics.successRate ?? 0) * 100).toFixed(1)}% success
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400 text-xs">Executions</div>
                      <div className="text-white font-semibold">
                        {metrics.executions.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">Avg Time</div>
                      <div className="text-white font-semibold">
                        {metrics.averageTime.toFixed(0)}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">Errors</div>
                      <div className="text-red-400 font-semibold">{metrics.errors}</div>
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

