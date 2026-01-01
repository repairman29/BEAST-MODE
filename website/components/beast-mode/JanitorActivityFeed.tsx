"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Activity {
  id: string;
  timestamp: string;
  type: 'refactor' | 'enforcement' | 'restore' | 'test' | 'scan' | 'config';
  feature: string;
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: any;
}

export default function JanitorActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
    // Poll for new activities every 10 seconds
    const interval = setInterval(loadActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        // Mock data
        setActivities([
          {
            id: '1',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            type: 'refactor',
            feature: 'Silent Refactoring',
            message: 'Fixed 23 issues, created 5 PRs',
            status: 'success',
            details: { issuesFixed: 23, prsCreated: 5 }
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            type: 'enforcement',
            feature: 'Architecture Enforcement',
            message: 'Blocked 3 violations: secrets in code',
            status: 'success',
            details: { violationsBlocked: 3 }
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'scan',
            feature: 'Invisible CI/CD',
            message: 'Security scan completed: 2 issues fixed',
            status: 'success',
            details: { issuesFound: 2, issuesFixed: 2 }
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            type: 'test',
            feature: 'Vibe Ops',
            message: 'Test "User can login" passed',
            status: 'success',
            details: { testDescription: 'User can login' }
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            type: 'config',
            feature: 'Silent Refactoring',
            message: 'Configuration updated: Overnight mode enabled',
            status: 'info',
            details: { config: { overnightMode: true } }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      refactor: '🧹',
      enforcement: '🛡️',
      restore: '⏮️',
      test: '🤖',
      scan: '👻',
      config: '⚙️'
    };
    return icons[type] || '📝';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-green-400 border-green-500/30 bg-green-500/10',
      warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      error: 'text-red-400 border-red-500/30 bg-red-500/10',
      info: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    };
    return colors[status] || 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  if (loading && activities.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading activity feed...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Activity Feed</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time updates from all janitor features
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {['all', 'refactor', 'enforcement', 'test', 'scan'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  filter === f
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No activities yet
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border ${getStatusColor(activity.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-white">
                        {activity.feature}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300 mb-2">
                      {activity.message}
                    </div>
                    {activity.details && (
                      <div className="text-xs text-slate-500 mt-2">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: <span className="text-slate-400">{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

