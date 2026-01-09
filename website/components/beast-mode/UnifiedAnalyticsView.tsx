"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

/**
 * Unified Analytics View
 * 
 * Shows comprehensive analytics across:
 * - CLI sessions
 * - API usage
 * - Cursor/IDE sessions
 * - Web dashboard usage
 * 
 * All tied to user's GitHub account
 */
export default function UnifiedAnalyticsView() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/beast-mode/analytics/unified');
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please connect your GitHub account to view analytics');
          return;
        }
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      // Ensure consistent structure to prevent hydration issues
      setAnalytics({
        ...data,
        sessions: {
          cli: Array.isArray(data.sessions?.cli) ? data.sessions.cli : [],
          api: Array.isArray(data.sessions?.api) ? data.sessions.api : [],
          cursor: Array.isArray(data.sessions?.cursor) ? data.sessions.cursor : [],
          web: Array.isArray(data.sessions?.web) ? data.sessions.web : [],
        },
        summary: {
          totalSessions: data.summary?.totalSessions || 0,
          cliSessions: data.summary?.cliSessions || 0,
          apiCalls: data.summary?.apiCalls || 0,
          totalScans: data.summary?.totalScans || 0,
          ...data.summary,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading unified analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<span className="text-6xl">📊</span>}
          title="Analytics Unavailable"
          description={error}
          action={{
            label: 'Connect GitHub Account',
            onClick: () => window.location.href = '/dashboard?view=settings'
          }}
        />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <span className="text-3xl">📊</span>
                Unified Analytics
              </CardTitle>
              <CardDescription className="text-slate-400">
                Complete view of your BEAST MODE activity across CLI, API, Cursor, and Web
                {analytics.githubUsername && (
                  <span className="ml-2 text-cyan-400">• @{analytics.githubUsername}</span>
                )}
              </CardDescription>
            </div>
            <Button
              onClick={() => window.open('/docs/ANALYTICS', '_blank')}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              📚 Docs
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Sessions</div>
            <div className="text-3xl font-bold text-white">{analytics.summary.totalSessions || 0}</div>
            <div className="text-xs text-slate-500 mt-1">All platforms</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">CLI Sessions</div>
            <div className="text-3xl font-bold text-cyan-400">{analytics.summary.cliSessions || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Command line</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">API Calls</div>
            <div className="text-3xl font-bold text-green-400">{analytics.summary.apiCalls || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Programmatic</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Scans</div>
            <div className="text-3xl font-bold text-amber-400">{analytics.summary.totalScans || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Repositories</div>
          </CardContent>
        </Card>
      </div>

      {/* Session Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CLI Sessions */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span>💻</span>
              CLI Sessions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Command-line usage and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.sessions.cli.length > 0 ? (
              <div className="space-y-2">
                {analytics.sessions.cli.slice(0, 5).map((session: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">{session.command || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Recently'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {session.duration ? `${Math.round(session.duration / 1000)}s` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No CLI sessions yet
                <div className="text-xs mt-2">Run commands from terminal to see activity</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span>🔌</span>
              API Usage
            </CardTitle>
            <CardDescription className="text-slate-400">
              Programmatic API calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.sessions?.api?.length > 0 ? (
              <div className="space-y-2">
                {analytics.sessions.api.slice(0, 5).map((call: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">{call.endpoint || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {call.timestamp ? new Date(call.timestamp).toLocaleString() : 'Recently'}
                        </div>
                      </div>
                      <div className={`text-xs ${
                        call.status >= 200 && call.status < 300 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {call.status || 'OK'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No API calls yet
                <div className="text-xs mt-2">API usage will appear here</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {analytics.insights && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span>💡</span>
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.insights.mostUsedCommand && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Most Used Command</div>
                  <div className="text-lg font-semibold text-cyan-400">{analytics.insights.mostUsedCommand}</div>
                </div>
              )}
              {analytics.insights.mostScannedRepo && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Most Scanned Repo</div>
                  <div className="text-lg font-semibold text-cyan-400">{analytics.insights.mostScannedRepo}</div>
                </div>
              )}
              {analytics.insights.averageQualityScore !== null && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Average Quality Score</div>
                  <div className="text-lg font-semibold text-cyan-400">{analytics.insights.averageQualityScore}/100</div>
                </div>
              )}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Productivity Trend</div>
                <div className={`text-lg font-semibold ${
                  analytics.insights.productivityTrend === 'up' ? 'text-green-400' :
                  analytics.insights.productivityTrend === 'down' ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {analytics.insights.productivityTrend === 'up' ? '↑ Improving' :
                   analytics.insights.productivityTrend === 'down' ? '↓ Declining' :
                   '→ Stable'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message */}
      {analytics.message && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 text-center">
              {analytics.message}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



