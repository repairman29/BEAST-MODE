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
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">👥 Team Workspace</CardTitle>
              <CardDescription className="text-slate-400">
                Shared dashboards and team quality metrics
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Overall Score</div>
            <div className="text-3xl font-bold text-white">{metrics.overallScore}/100</div>
            <div className="text-xs text-slate-500 mt-1">Team average</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Team Members</div>
            <div className="text-3xl font-bold text-cyan-400">{metrics.memberScores.length}</div>
            <div className="text-xs text-slate-500 mt-1">Active contributors</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Improving</div>
            <div className="text-3xl font-bold text-green-400">{metrics.trends.improving}</div>
            <div className="text-xs text-slate-500 mt-1">Members trending up</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Projects</div>
            <div className="text-3xl font-bold text-purple-400">{metrics.projectScores.length}</div>
            <div className="text-xs text-slate-500 mt-1">Active projects</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['overview', 'members', 'projects', 'missions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">🏆 Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topPerformers.map((performer, idx) => (
                  <div
                    key={performer.userId}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-slate-600 w-8">#{idx + 1}</div>
                      <div>
                        <div className="text-white font-semibold">{performer.userName}</div>
                        <div className="text-slate-400 text-sm">
                          {performer.improvement === '+' ? '📈 Improving' :
                           performer.improvement === '-' ? '📉 Declining' :
                           '➡️ Stable'}
                        </div>
                      </div>
                    </div>
                    <div className="text-cyan-400 font-bold text-lg">{performer.score}</div>
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
                {metrics.topIssues.map((issue, idx) => (
                  <div
                    key={idx}
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
                    <div className="text-slate-400 text-sm">
                      {issue.count} occurrences • {issue.affectedProjects} project(s)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">👥 Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.memberScores.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex-1">
                    <div className="text-white font-semibold">{member.userName}</div>
                    <div className="text-slate-400 text-sm mt-1">
                      {member.projects} project(s) • {member.issues} issue(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-cyan-400 font-bold text-lg">{member.score}/100</div>
                      <div className={`text-xs ${
                        member.trend === 'improving' ? 'text-green-400' :
                        member.trend === 'declining' ? 'text-red-400' :
                        'text-slate-400'
                      }`}>
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
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📁 Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.projectScores.map((project) => (
                <div
                  key={project.projectId}
                  className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex-1">
                    <div className="text-white font-semibold">{project.projectName}</div>
                    <div className="text-slate-400 text-sm mt-1">
                      {project.contributors} contributor(s) • Updated {new Date(project.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold text-lg">{project.score}/100</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'missions' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🎯 Collaborative Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">🎯</div>
              <div>No collaborative missions yet</div>
              <div className="text-sm mt-2">Create a mission to track team-wide improvements</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

