"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface TeamMember {
  userId: string;
  userName: string;
  score: number;
  projects: number;
  issues: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface TeamMetrics {
  overallScore: number;
  memberScores: TeamMember[];
  projectScores: Array<{
    projectId: string;
    projectName: string;
    score: number;
    contributors: number;
    lastUpdated: string;
  }>;
  trends: {
    improving: number;
    declining: number;
    stable: number;
  };
  topIssues: Array<{
    type: string;
    count: number;
    severity: string;
    affectedProjects: number;
  }>;
  topPerformers: Array<{
    userId: string;
    userName: string;
    score: number;
    improvement: string;
  }>;
}

interface TeamWorkspaceProps {
  workspaceId?: string;
  userId?: string;
}

export default function TeamWorkspace({ workspaceId, userId }: TeamWorkspaceProps) {
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'missions'>('overview');

  useEffect(() => {
    fetchMetrics();
  }, [workspaceId, timeRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('action', 'metrics');
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/beast-mode/collaboration/workspace?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch team metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading team metrics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No team workspace found</div>
          <div className="text-sm text-slate-400">
            Create a workspace to start collaborating with your team
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
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl">👥</span>
                </div>
                Team Workspace
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Shared dashboards and team quality metrics
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
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
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

      {/* Overview Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Overall Score</div>
            <div className="text-4xl font-bold text-white mb-1">{metrics.overallScore}/100</div>
            <div className="text-xs text-slate-500">Team average</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Team Members</div>
            <div className="text-4xl font-bold text-cyan-400 mb-1">{metrics.memberScores.length}</div>
            <div className="text-xs text-slate-500">Active contributors</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-green-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Improving</div>
            <div className="text-4xl font-bold text-green-400 mb-1">{metrics.trends.improving}</div>
            <div className="text-xs text-slate-500">Members trending up</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-2 border-slate-700/50 hover:border-purple-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
          <CardContent className="p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Projects</div>
            <div className="text-4xl font-bold text-purple-400 mb-1">{metrics.projectScores.length}</div>
            <div className="text-xs text-slate-500">Active projects</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Enhanced */}
      <div className="flex gap-2 border-b-2 border-slate-800/50">
        {(['overview', 'members', 'projects', 'missions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 relative ${
              activeTab === tab
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {metrics.topPerformers.map((performer, idx) => (
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
                      <div>
                        <div className="text-white font-semibold text-base">{performer.userName}</div>
                        <div className="text-slate-400 text-sm flex items-center gap-1">
                          {performer.improvement === '+' ? '📈 Improving' :
                           performer.improvement === '-' ? '📉 Declining' :
                           '➡️ Stable'}
                        </div>
                      </div>
                    </div>
                    <div className="text-cyan-400 font-bold text-xl">{performer.score}</div>
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
                {metrics.topIssues.map((issue, idx) => {
                  const isHigh = issue.severity === 'high';
                  const isMedium = issue.severity === 'medium';
                  
                  return (
                    <div
                      key={idx}
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
                      <div className="text-slate-300 text-sm">
                        {issue.count} occurrences • {issue.affectedProjects} project(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">👥</span>
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.memberScores.map((member, idx) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-5 bg-slate-800/50 rounded-xl border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex-1">
                    <div className="text-white font-semibold text-base mb-1">{member.userName}</div>
                    <div className="text-slate-400 text-sm flex items-center gap-2">
                      <span>📁 {member.projects} project(s)</span>
                      <span>•</span>
                      <span>⚠️ {member.issues} issue(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        member.score >= 80 ? 'text-green-400' :
                        member.score >= 60 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {member.score}/100
                      </div>
                      <div className={`text-xs font-medium flex items-center gap-1 ${
                        member.trend === 'improving' ? 'text-green-400' :
                        member.trend === 'declining' ? 'text-red-400' :
                        'text-slate-400'
                      }`}>
                        {member.trend === 'improving' ? '📈' : member.trend === 'declining' ? '📉' : '➡️'}
                        {member.trend}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">📁</span>
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.projectScores.map((project, idx) => (
                <div
                  key={project.projectId}
                  className="flex items-center justify-between p-5 bg-slate-800/50 rounded-xl border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex-1">
                    <div className="text-white font-semibold text-base mb-1">{project.projectName}</div>
                    <div className="text-slate-400 text-sm flex items-center gap-2">
                      <span>👥 {project.contributors} contributor(s)</span>
                      <span>•</span>
                      <span>🕐 Updated {new Date(project.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    project.score >= 80 ? 'text-green-400' :
                    project.score >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {project.score}/100
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'missions' && (
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 border-slate-700/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Collaborative Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <div className="text-7xl mb-6 animate-bounce">🎯</div>
              <div className="text-xl font-semibold text-slate-300 mb-3">No collaborative missions yet</div>
              <div className="text-sm text-slate-400 max-w-md mx-auto">
                Create a mission to track team-wide improvements. Every mission completed makes your team stronger! 🚀
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


