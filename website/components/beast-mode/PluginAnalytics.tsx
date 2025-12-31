"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface AnalyticsData {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  mostUsedPlugins: Array<{
    pluginId: string;
    pluginName: string;
    executions: number;
    successRate: number;
  }>;
  usageByDay: Array<{
    date: string;
    executions: number;
    successes: number;
    failures: number;
  }>;
  usageByPlugin: Array<{
    pluginId: string;
    pluginName: string;
    executions: number;
    lastUsed: string;
  }>;
}

interface PluginAnalyticsProps {
  userId?: string;
  pluginId?: string;
}

export default function PluginAnalytics({ userId, pluginId }: PluginAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [userId, pluginId, timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (pluginId) params.append('pluginId', pluginId);
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/beast-mode/marketplace/analytics?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
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
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <div className="text-4xl mb-2">📊</div>
            <div>No analytics data available yet</div>
            <div className="text-sm mt-2">Start using plugins to see analytics!</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">📊 Plugin Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Usage statistics and performance metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'default' : 'outline'}
                  className={
                    timeRange === range
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }
                  size="sm"
                >
                  {range === 'all' ? 'All Time' : range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

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
              {(analytics.successRate ?? 0).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Successful executions</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Avg Execution Time</div>
            <div className="text-3xl font-bold text-cyan-400">
              {(() => {
                const time = analytics.averageExecutionTime ?? 0;
                return time < 1000
                  ? `${time}ms`
                  : `${(time / 1000).toFixed(2)}s`;
              })()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Average per execution</div>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Plugins */}
      {analytics.mostUsedPlugins && analytics.mostUsedPlugins.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔥 Most Used Plugins</CardTitle>
            <CardDescription className="text-slate-400">
              Your top plugins by execution count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostUsedPlugins.slice(0, 5).map((plugin, idx) => (
                <div
                  key={plugin.pluginId}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-slate-600 w-8">#{idx + 1}</div>
                    <div>
                      <div className="text-white font-semibold">{plugin.pluginName}</div>
                      <div className="text-slate-400 text-sm">
                        {plugin.executions ?? 0} execution{(plugin.executions ?? 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      (plugin.successRate ?? 0) >= 95 ? 'text-green-400' :
                      (plugin.successRate ?? 0) >= 80 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {(plugin.successRate ?? 0).toFixed(1)}%
                    </div>
                    <div className="text-slate-500 text-xs">success rate</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Over Time */}
      {analytics.usageByDay && analytics.usageByDay.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📈 Usage Over Time</CardTitle>
            <CardDescription className="text-slate-400">
              Daily execution trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.usageByDay.slice(-14).map((day) => {
                const maxExecutions = Math.max(...analytics.usageByDay.map(d => d.executions ?? 0), 0);
                const dayExecutions = day.executions ?? 0;
                const barWidth = maxExecutions > 0 ? (dayExecutions / maxExecutions) * 100 : 0;
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-300">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-slate-400">
                        {dayExecutions} exec • {day.successes ?? 0} ✓ • {day.failures ?? 0} ✗
                      </div>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-cyan-500 rounded"
                        style={{ width: `${barWidth}%` }}
                        title={`${dayExecutions} executions`}
                      />
                      <div
                        className="bg-green-500 rounded"
                        style={{ width: `${maxExecutions > 0 ? ((day.successes ?? 0) / maxExecutions) * 100 : 0}%` }}
                        title={`${day.successes ?? 0} successes`}
                      />
                      <div
                        className="bg-red-500 rounded"
                        style={{ width: `${maxExecutions > 0 ? ((day.failures ?? 0) / maxExecutions) * 100 : 0}%` }}
                        title={`${day.failures ?? 0} failures`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage by Plugin */}
      {analytics.usageByPlugin && analytics.usageByPlugin.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔌 Plugin Usage Breakdown</CardTitle>
            <CardDescription className="text-slate-400">
              Execution count by plugin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.usageByPlugin.map((plugin) => (
                <div
                  key={plugin.pluginId}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div>
                    <div className="text-white font-semibold">{plugin.pluginName}</div>
                    <div className="text-slate-400 text-sm">
                      Last used: {plugin.lastUsed ? new Date(plugin.lastUsed).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold text-lg">
                    {plugin.executions ?? 0}
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

