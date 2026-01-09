"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getAnalytics } from '@/lib/analytics';
import { TrendingUp, Users, MousePointerClick, Clock, Target, Zap } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [currentEngagement, setCurrentEngagement] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchCurrentEngagement();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchCurrentEngagement();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchAnalytics() {
    try {
      const response = await fetch(`/api/beast-mode/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function fetchCurrentEngagement() {
    const analytics = getAnalytics();
    const engagement = analytics.getEngagementMetrics();
    setCurrentEngagement(engagement);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-slate-400 text-center py-8">
              No analytics data available yet. Start using BEAST MODE to see metrics!
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversionRate = metrics.visitors > 0 
    ? ((metrics.users / metrics.visitors) * 100).toFixed(1)
    : '0';

  const topFeatures = Object.entries(metrics.featureUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topTabs = Object.entries(metrics.tabViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">User engagement and feature usage insights</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeRange('24h')}
          className={`px-4 py-2 rounded-lg ${
            timeRange === '24h'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Last 24 Hours
        </button>
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-4 py-2 rounded-lg ${
            timeRange === '7d'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-4 py-2 rounded-lg ${
            timeRange === '30d'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Active user sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">User interactions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.floor(metrics.avgSessionDuration / 60000)}m
            </div>
            <p className="text-xs text-slate-500 mt-1">Average duration</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{conversionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">Visitor to user</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Session Engagement */}
      {currentEngagement && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Current Session
            </CardTitle>
            <CardDescription>Your current session engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-400">Duration</div>
                <div className="text-lg font-semibold text-white">
                  {currentEngagement.sessionDurationMinutes}m
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Actions</div>
                <div className="text-lg font-semibold text-white">
                  {currentEngagement.totalEvents}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Tabs Visited</div>
                <div className="text-lg font-semibold text-white">
                  {currentEngagement.tabsVisited}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Features Used</div>
                <div className="text-lg font-semibold text-white">
                  {currentEngagement.featuresUsed}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Usage & Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Features */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Top Features</CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFeatures.length > 0 ? (
                topFeatures.map(([feature, count]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{feature}</div>
                    </div>
                    <div className="text-cyan-400 font-semibold">{count}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No feature usage data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Tabs */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Top Navigation</CardTitle>
            <CardDescription>Most visited tabs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTabs.length > 0 ? (
                topTabs.map(([tab, count]) => (
                  <div key={tab} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{tab}</div>
                    </div>
                    <div className="text-cyan-400 font-semibold">{count}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No navigation data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Metrics */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Action Metrics
          </CardTitle>
          <CardDescription>Key user actions tracked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">{metrics.scans}</div>
              <div className="text-sm text-slate-400 mt-1">Scans</div>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{metrics.fixes}</div>
              <div className="text-sm text-slate-400 mt-1">Fixes Applied</div>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{metrics.missions}</div>
              <div className="text-sm text-slate-400 mt-1">Missions</div>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{metrics.pluginInstalls}</div>
              <div className="text-sm text-slate-400 mt-1">Plugin Installs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
