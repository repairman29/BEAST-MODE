"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface DashboardData {
  overallMetrics: {
    qualityScore: number;
    totalProjects: number;
    totalIssues: number;
    resolvedIssues: number;
    activeMembers: number;
    averageScore: number;
    trend: string;
    trendValue: number;
  };
  teamMetrics: {
    memberCount: number;
    activeMembers: number;
    averageScore: number;
    scoreDistribution: Record<string, number>;
    topPerformers: Array<{
      userId: string;
      userName: string;
      score: number;
    }>;
  };
  projectMetrics: Array<{
    projectId: string;
    projectName: string;
    score: number;
    issues: number;
    contributors: number;
    lastUpdated: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    userId: string;
    userName: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
  topIssues: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    projectId: string;
    count: number;
  }>;
  trends: {
    qualityScore: {
      direction: string;
      change: number;
      data: number[];
    };
    issues: {
      direction: string;
      change: number;
      data: number[];
    };
    resolvedIssues: {
      direction: string;
      change: number;
      data: number[];
    };
  };
}

interface SharedDashboardProps {
  dashboardId?: string;
  userId?: string;
}

export default function SharedDashboard({ dashboardId, userId }: SharedDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [dashboardId, timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dashboardId) params.append('dashboardId', dashboardId);
      params.append('action', 'data');
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/beast-mode/collaboration/dashboard?${params.toString()}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading dashboard...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No dashboard data available</div>
          <div className="text-sm text-slate-400">
            Create or select a shared dashboard to view team insights
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">📊 Shared Dashboard</CardTitle>
              <CardDescription className="text-slate-400">
                Team-wide visibility and collaborative insights
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
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
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Quality Score</div>
            <div className="text-3xl font-bold text-white">{data.overallMetrics.qualityScore}/100</div>
            <div className={`text-xs mt-1 ${
              data.overallMetrics.trend === 'improving' ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.overallMetrics.trendValue > 0 ? '+' : ''}{data.overallMetrics.trendValue} {data.overallMetrics.trend}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-cyan-400">{data.overallMetrics.totalProjects}</div>
            <div className="text-xs text-slate-500 mt-1">Active projects</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Issues</div>
            <div className="text-3xl font-bold text-orange-400">{data.overallMetrics.totalIssues}</div>
            <div className="text-xs text-slate-500 mt-1">
              {data.overallMetrics.resolvedIssues} resolved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Team Members</div>
            <div className="text-3xl font-bold text-purple-400">{data.overallMetrics.activeMembers}</div>
            <div className="text-xs text-slate-500 mt-1">Active contributors</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🏆 Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.teamMetrics.topPerformers.map((performer, idx) => (
                <div
                  key={performer.userId}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-slate-600 w-8">#{idx + 1}</div>
                    <div className="text-white font-semibold">{performer.userName}</div>
                  </div>
                  <div className="text-cyan-400 font-bold text-lg">{performer.score}/100</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">⚠️ Top Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">{issue.type}</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {issue.severity}
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm">{issue.message}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {issue.count} occurrence(s) • Project: {issue.projectId}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="text-white text-sm">
                    <span className="font-semibold">{activity.userName}</span>
                    {' '}
                    <span className="text-slate-400">{activity.action}</span>
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trends */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📈 Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-400 text-sm">Quality Score</div>
                  <div className={`text-sm font-semibold ${
                    data.trends.qualityScore.direction === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.trends.qualityScore.change > 0 ? '+' : ''}{data.trends.qualityScore.change}
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      data.trends.qualityScore.direction === 'up' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(data.trends.qualityScore.change) * 10)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-400 text-sm">Issues</div>
                  <div className={`text-sm font-semibold ${
                    data.trends.issues.direction === 'down' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.trends.issues.change > 0 ? '+' : ''}{data.trends.issues.change}
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      data.trends.issues.direction === 'down' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(data.trends.issues.change) * 5)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-400 text-sm">Resolved Issues</div>
                  <div className="text-sm font-semibold text-green-400">
                    +{data.trends.resolvedIssues.change}
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min(100, data.trends.resolvedIssues.change * 5)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

