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
      {/* Header - Enhanced */}
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <CardTitle className="text-white text-xl md:text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl">📊</span>
                </div>
                Shared Dashboard
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Team-wide visibility and collaborative insights
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'default' : 'outline'}
                  className={`transition-all duration-200 font-medium ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                      : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50'
                  }`}
                  size="sm"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Metrics - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Quality Score</div>
            <div className={`text-4xl font-bold mb-1 ${
              data.overallMetrics.qualityScore >= 80 ? 'text-green-400' :
              data.overallMetrics.qualityScore >= 60 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {data.overallMetrics.qualityScore}/100
            </div>
            <div className={`text-xs font-medium flex items-center gap-1 ${
              data.overallMetrics.trend === 'improving' ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.overallMetrics.trend === 'improving' ? '📈' : '📉'}
              {data.overallMetrics.trendValue > 0 ? '+' : ''}{data.overallMetrics.trendValue} {data.overallMetrics.trend}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Total Projects</div>
            <div className="text-4xl font-bold text-cyan-400 mb-1">{data.overallMetrics.totalProjects}</div>
            <div className="text-xs text-slate-500">Active projects</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-orange-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Issues</div>
            <div className="text-4xl font-bold text-orange-400 mb-1">{data.overallMetrics.totalIssues}</div>
            <div className="text-xs text-slate-500">
              {data.overallMetrics.resolvedIssues} resolved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-purple-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Team Members</div>
            <div className="text-4xl font-bold text-purple-400 mb-1">{data.overallMetrics.activeMembers}</div>
            <div className="text-xs text-slate-500">Active contributors</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers - Enhanced */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.teamMetrics.topPerformers.map((performer, idx) => (
                <div
                  key={performer.userId}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 text-yellow-400 border-2 border-yellow-500/50' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-500/30 to-slate-600/20 text-slate-400 border-2 border-slate-500/50' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-600/30 to-amber-700/20 text-amber-500 border-2 border-amber-600/50' :
                      'bg-slate-700/30 text-slate-500 border-2 border-slate-700/50'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="text-white font-semibold text-base">{performer.userName}</div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    performer.score >= 80 ? 'text-green-400' :
                    performer.score >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {performer.score}/100
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Issues - Enhanced */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              Top Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topIssues.map((issue) => {
                const isHigh = issue.severity === 'high';
                const isMedium = issue.severity === 'medium';
                
                return (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
                      isHigh
                        ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                        : isMedium
                        ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold text-base">{issue.type}</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${
                        isHigh ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        isMedium ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {issue.severity}
                      </div>
                    </div>
                    <div className="text-slate-300 text-sm mb-2">{issue.message}</div>
                    <div className="text-slate-500 text-xs flex items-center gap-2">
                      <span>📊 {issue.count} occurrence(s)</span>
                      <span>•</span>
                      <span>📁 Project: {issue.projectId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Enhanced */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">📋</span>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.map((activity, idx) => (
                <div
                  key={activity.id}
                  className="p-4 bg-slate-800/50 rounded-xl border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                      <span className="text-cyan-400 text-sm">
                        {activity.type === 'scan' ? '🔍' :
                         activity.type === 'fix' ? '🔧' :
                         activity.type === 'mission' ? '🎯' :
                         '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm leading-relaxed">
                        <span className="font-semibold text-cyan-400">{activity.userName}</span>
                        {' '}
                        <span className="text-slate-300">{activity.action}</span>
                        {activity.target && (
                          <>
                            {' '}
                            <span className="text-slate-400">{activity.target}</span>
                          </>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                        <span>🕐 {new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trends - Enhanced */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">📈</span>
              Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-300 text-sm font-medium">Quality Score</div>
                  <div className={`text-base font-bold flex items-center gap-1 ${
                    data.trends.qualityScore.direction === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.trends.qualityScore.direction === 'up' ? '📈' : '📉'}
                    {data.trends.qualityScore.change > 0 ? '+' : ''}{data.trends.qualityScore.change}
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      data.trends.qualityScore.direction === 'up' 
                        ? 'bg-gradient-to-r from-green-500 to-green-400' 
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(data.trends.qualityScore.change) * 10)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-300 text-sm font-medium">Issues</div>
                  <div className={`text-base font-bold flex items-center gap-1 ${
                    data.trends.issues.direction === 'down' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.trends.issues.direction === 'down' ? '📉' : '📈'}
                    {data.trends.issues.change > 0 ? '+' : ''}{data.trends.issues.change}
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      data.trends.issues.direction === 'down' 
                        ? 'bg-gradient-to-r from-green-500 to-green-400' 
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(data.trends.issues.change) * 5)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-300 text-sm font-medium">Resolved Issues</div>
                  <div className="text-base font-bold flex items-center gap-1 text-green-400">
                    📈 +{data.trends.resolvedIssues.change}
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
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

