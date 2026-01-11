"use client";

/**
 * Interceptor Dashboard Component
 * 
 * Displays and manages commits intercepted by Brand/Reputation/Secret Interceptor.
 * Provides statistics, filtering, and status management for intercepted files.
 * 
 * Features:
 * - Real-time statistics (total, recent, critical, pending)
 * - Advanced filtering (repo, status, severity, search)
 * - Expandable commit cards with issue details
 * - Status management (reviewed, approved, rejected)
 * - Auto-refresh every 30 seconds
 * - Error handling and loading states
 * - Performance optimized with useMemo and useCallback
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface InterceptedCommit {
  id: string;
  repo_name: string;
  repo_path: string;
  file_path: string;
  file_content?: string;
  issues: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    name: string;
    file: string;
    line?: number;
    message: string;
  }>;
  reason: string;
  intercepted_at: string;
  status: 'intercepted' | 'reviewed' | 'approved' | 'rejected';
  metadata?: {
    file_size?: number;
    issue_count?: number;
    severities?: string[];
  };
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: Record<string, number>;
  recent: {
    last7Days: number;
    last30Days: number;
  };
  topRepos: Array<{
    repo_name: string;
    count: number;
  }>;
}

export default function InterceptorDashboard() {
  const [commits, setCommits] = useState<InterceptedCommit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load stats
      try {
        const statsResponse = await fetch('/api/intercepted-commits/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        } else {
          const errorData = await statsResponse.json().catch(() => ({}));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('beast-mode-notification', {
              detail: { type: 'error', message: `Failed to load stats: ${errorData.error || 'Unknown error'}` }
            }));
          }
        }
        } catch (statsError: unknown) {
        const errorMessage = statsError instanceof Error ? statsError.message : 'Unknown error';
        // Error logged via notification system
        setError('Failed to load statistics');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: { type: 'error', message: 'Failed to load statistics' }
          }));
        }
      }
      
      // Load commits
      try {
        const params = new URLSearchParams();
        if (selectedRepo) params.append('repo_name', selectedRepo);
        if (selectedStatus) params.append('status', selectedStatus);
        params.append('limit', '100');
        
        const commitsResponse = await fetch(`/api/intercepted-commits?${params.toString()}`);
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          setCommits(commitsData.data || []);
        } else {
          const errorData = await commitsResponse.json().catch(() => ({}));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('beast-mode-notification', {
              detail: { type: 'error', message: `Failed to load commits: ${errorData.error || 'Unknown error'}` }
            }));
          }
        }
      } catch (commitsError: unknown) {
        const errorMessage = commitsError instanceof Error ? commitsError.message : 'Unknown error';
        // Error logged via notification system
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: { type: 'error', message: 'Failed to load intercepted commits' }
          }));
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Error logged via notification system
      setError('Failed to load interceptor data. Please try again.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: { type: 'error', message: 'Failed to load interceptor data. Please try again.' }
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRepo, selectedStatus]);

  useEffect(() => {
    void loadData();
    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      void loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      const response = await fetch('/api/intercepted-commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      
      if (response.ok) {
        void loadData(); // Reload data
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: { type: 'success', message: `Status updated to ${status}` }
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: { type: 'error', message: `Failed to update status: ${errorData.error || 'Unknown error'}` }
          }));
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Error logged via notification system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: { type: 'error', message: 'Failed to update status. Please try again.' }
        }));
      }
    }
  }, [loadData]);

  const filteredCommits = useMemo(() => {
    return commits.filter(commit => {
      if (selectedRepo && commit.repo_name !== selectedRepo) return false;
      if (selectedStatus && commit.status !== selectedStatus) return false;
      if (selectedSeverity && !commit.issues.some(i => i.severity === selectedSeverity)) return false;
      if (searchQuery && !commit.file_path.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [commits, selectedRepo, selectedStatus, selectedSeverity, searchQuery]);

  const uniqueRepos = useMemo(() => {
    return Array.from(new Set(commits.map(c => c.repo_name))).sort();
  }, [commits]);

  if (loading && !stats) {
    return <LoadingState message="Loading intercepted commits..." />;
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6" role="main">
        <Card className="bg-red-950/30 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">{error}</p>
            <Button onClick={() => { setError(null); void loadData(); }} aria-label="Retry">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">🛡️ Interceptor Dashboard</h1>
          <p className="text-slate-400 mt-2">
            View and manage commits intercepted by Brand/Reputation/Secret Interceptor
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Total Intercepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.recent.last7Days}</div>
              <p className="text-xs text-slate-500 mt-1">Recent activity</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.bySeverity.critical}</div>
              <p className="text-xs text-slate-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">{stats.byStatus.intercepted || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Repository</label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
              >
                <option value="">All Repos</option>
                {uniqueRepos.map(repo => (
                  <option key={repo} value={repo}>{repo}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="text-sm text-slate-400 mb-2 block">Status</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="intercepted">Intercepted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="severity-filter" className="text-sm text-slate-400 mb-2 block">Severity</label>
              <select
                id="severity-filter"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                aria-label="Filter by severity"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="search-input" className="text-sm text-slate-400 mb-2 block">Search</label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                aria-label="Search intercepted commits"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intercepted Commits List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Intercepted Commits ({filteredCommits.length})</CardTitle>
          <CardDescription>
            Files that were blocked from being committed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCommits.length === 0 ? (
            <EmptyState
              title="No intercepted commits"
              description="All commits are safe! The interceptor hasn't blocked any files yet."
            />
          ) : (
            <div className="space-y-4">
              {filteredCommits.map(commit => (
                <Card
                  key={commit.id}
                  className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-cyan-400">{commit.file_path}</CardTitle>
                        <CardDescription className="mt-1">
                          {commit.repo_name} • {new Date(commit.intercepted_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            commit.status === 'intercepted' ? 'default' :
                            commit.status === 'reviewed' ? 'secondary' :
                            commit.status === 'approved' ? 'outline' : 'destructive'
                          }
                        >
                          {commit.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCommit(expandedCommit === commit.id ? null : commit.id)}
                        >
                          {expandedCommit === commit.id ? '▼' : '▶'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedCommit === commit.id && (
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Issues ({commit.issues.length})</h4>
                        <div className="space-y-2">
                          {commit.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded border ${
                                issue.severity === 'critical' ? 'bg-red-950/30 border-red-800' :
                                issue.severity === 'high' ? 'bg-orange-950/30 border-orange-800' :
                                issue.severity === 'medium' ? 'bg-yellow-950/30 border-yellow-800' :
                                'bg-slate-800 border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={
                                    issue.severity === 'critical' ? 'destructive' :
                                    issue.severity === 'high' ? 'default' :
                                    'secondary'
                                  }
                                >
                                  {issue.severity.toUpperCase()}
                                </Badge>
                                <span className="text-sm font-medium text-slate-200">{issue.name}</span>
                                {issue.line && (
                                  <span className="text-xs text-slate-500">Line {issue.line}</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{issue.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Reason</h4>
                        <p className="text-sm text-slate-400">{commit.reason}</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(commit.id, 'reviewed')}
                          disabled={commit.status === 'reviewed'}
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(commit.id, 'approved')}
                          disabled={commit.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(commit.id, 'rejected')}
                          disabled={commit.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
}
