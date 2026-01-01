"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface RefactoringRun {
  id: string;
  timestamp: string;
  issuesFixed: number;
  prsCreated: number;
  status: 'completed' | 'running' | 'failed';
  changes: Array<{
    file: string;
    type: string;
    description: string;
  }>;
}

export default function RefactoringHistory() {
  const [runs, setRuns] = useState<RefactoringRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<RefactoringRun | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/refactoring/history');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      } else {
        // Mock data
        setRuns([
          {
            id: '1',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            issuesFixed: 23,
            prsCreated: 5,
            status: 'completed',
            changes: [
              { file: 'src/utils/api.js', type: 'security', description: 'Removed hardcoded API key' },
              { file: 'src/components/Login.jsx', type: 'duplicate', description: 'Removed duplicate login function' },
              { file: 'src/hooks/useAuth.js', type: 'quality', description: 'Improved error handling' }
            ]
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
            issuesFixed: 15,
            prsCreated: 3,
            status: 'completed',
            changes: [
              { file: 'src/api/database.js', type: 'architecture', description: 'Moved DB logic to API route' },
              { file: 'src/components/Profile.jsx', type: 'quality', description: 'Fixed unused variable' }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading history...</div>
        </CardContent>
      </Card>
    );
  }

  if (selectedRun) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Refactoring Run Details</CardTitle>
              <CardDescription className="text-slate-400">
                {new Date(selectedRun.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Button
              onClick={() => setSelectedRun(null)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{selectedRun.issuesFixed}</div>
              <div className="text-xs text-slate-400">Issues Fixed</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">{selectedRun.prsCreated}</div>
              <div className="text-xs text-slate-400">PRs Created</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <Badge
                variant={selectedRun.status === 'completed' ? 'default' : 'secondary'}
                className={
                  selectedRun.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-slate-800 text-slate-400'
                }
              >
                {selectedRun.status}
              </Badge>
              <div className="text-xs text-slate-400 mt-2">Status</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white mb-3">Changes Made</div>
            <div className="space-y-2">
              {selectedRun.changes.map((change, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-sm font-semibold text-white">{change.file}</div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        change.type === 'security'
                          ? 'border-red-500/30 text-red-400'
                          : change.type === 'architecture'
                          ? 'border-blue-500/30 text-blue-400'
                          : 'border-green-500/30 text-green-400'
                      }`}
                    >
                      {change.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">{change.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Refactoring History</CardTitle>
        <CardDescription className="text-slate-400">
          View past refactoring runs and their results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No refactoring runs yet. Enable Silent Refactoring to start.
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-white">
                    {new Date(run.timestamp).toLocaleString()}
                  </div>
                  <Badge
                    variant={run.status === 'completed' ? 'default' : 'secondary'}
                    className={
                      run.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>{run.issuesFixed} issues fixed</span>
                  <span>{run.prsCreated} PRs created</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

