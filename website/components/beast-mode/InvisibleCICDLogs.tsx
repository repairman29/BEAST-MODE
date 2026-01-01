"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ScanLog {
  id: string;
  timestamp: string;
  type: 'lint' | 'test' | 'security';
  status: 'success' | 'warning' | 'error';
  issuesFound: number;
  issuesFixed: number;
  details: string;
}

export default function InvisibleCICDLogs() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lint' | 'test' | 'security'>('all');

  useEffect(() => {
    loadLogs();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/invisible-cicd/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        // Mock data
        setLogs([
          {
            id: '1',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            type: 'security',
            status: 'success',
            issuesFound: 2,
            issuesFixed: 2,
            details: 'Fixed hardcoded API key, removed // SECURITY: eval() disabled
// eval() usage'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            type: 'lint',
            status: 'success',
            issuesFound: 5,
            issuesFixed: 5,
            details: 'Fixed formatting, removed unused imports'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'test',
            status: 'warning',
            issuesFound: 1,
            issuesFixed: 0,
            details: 'Test coverage below threshold (85%)'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.type === filter);

  if (loading && logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Invisible CI/CD Logs</CardTitle>
            <CardDescription className="text-slate-400">
              Silent background scans and auto-fixes
            </CardDescription>
          </div>
          <Button
            onClick={loadLogs}
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['all', 'lint', 'test', 'security'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No logs found
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border ${
                  log.status === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : log.status === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        log.type === 'security'
                          ? 'border-red-500/30 text-red-400'
                          : log.type === 'test'
                          ? 'border-blue-500/30 text-blue-400'
                          : 'border-purple-500/30 text-purple-400'
                      }
                    >
                      {log.type}
                    </Badge>
                    <div className="text-sm text-slate-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'secondary'}
                    className={
                      log.status === 'success'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : log.status === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 mb-2">{log.details}</div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{log.issuesFound} issues found</span>
                  <span>{log.issuesFixed} issues fixed</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

