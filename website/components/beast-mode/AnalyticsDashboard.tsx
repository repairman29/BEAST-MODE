"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { getAnalytics } from '../../lib/analytics';

interface AnalyticsMetrics {
  totalEvents: number;
  totalSessions: number;
  uniqueUsers: number;
  featureUsage: Record<string, number>;
  tabViews: Record<string, number>;
  scans: number;
  fixes: number;
  missions: number;
  pluginInstalls: number;
  avgSessionDuration: number;
  avgActionsPerSession: number;
  avgTabsPerSession: number;
  visitors: number;
  users: number;
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
    updateEngagementMetrics();
    
    // Update engagement metrics every 10 seconds
    const interval = setInterval(updateEngagementMetrics, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/beast-mode/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEngagementMetrics = () => {
    const analytics = getAnalytics();
    const engagement = analytics.getEngagementMetrics();
    setEngagementMetrics(engagement);
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

  if (!metrics) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No analytics data yet</div>
          <div className="text-sm text-slate-400">
            Analytics data will appear as users interact with BEAST MODE
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📊 Analytics Dashboard</CardTitle>
          <CardDescription className="text-slate-400">
            Privacy-first analytics - no PII collected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['1d', '7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'default' : 'outline'}
                className={timeRange === range ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                size="sm"
              >
                {range === '1d' ? '24h' : range === '7d' ? '7d' : range === '30d' ? '30d' : '90d'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Session Engagement */}
      {engagementMetrics && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🎯 Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatDuration(engagementMetrics.sessionDuration)}
                </div>
                <div className="text-xs text-slate-400">Session Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {engagementMetrics.totalEvents}
                </div>
                <div className="text-xs text-slate-400">Total Actions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {engagementMetrics.actionsPerMinute.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">Actions/Min</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {engagementMetrics.tabsVisited}
                </div>
                <div className="text-xs text-slate-400">Tabs Visited</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{metrics.totalSessions}</div>
            <div className="text-sm text-slate-400 mt-1">Total Sessions</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{metrics.uniqueUsers}</div>
            <div className="text-sm text-slate-400 mt-1">Unique Users</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{metrics.scans}</div>
            <div className="text-sm text-slate-400 mt-1">Scans</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{metrics.fixes}</div>
            <div className="text-sm text-slate-400 mt-1">Fixes Applied</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🔥 Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(metrics.featureUsage).length === 0 ? (
            <div className="text-center py-8 text-slate-400">No feature usage data yet</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(metrics.featureUsage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([feature, count]) => (
                  <div key={feature} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-slate-300">{feature}</span>
                    <span className="text-cyan-400 font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Views */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📑 Tab Views</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(metrics.tabViews).length === 0 ? (
            <div className="text-center py-8 text-slate-400">No tab view data yet</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(metrics.tabViews)
                .sort(([, a], [, b]) => b - a)
                .map(([tab, count]) => (
                  <div key={tab} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <span className="text-slate-300 capitalize">{tab}</span>
                    <span className="text-cyan-400 font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📈 Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {formatDuration(metrics.avgSessionDuration)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Avg Session Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.avgActionsPerSession.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Avg Actions/Session</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.avgTabsPerSession.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Avg Tabs/Session</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

