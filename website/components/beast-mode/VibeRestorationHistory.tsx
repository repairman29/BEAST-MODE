"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface CodeState {
  id: string;
  timestamp: string;
  qualityScore: number;
  commitHash: string;
  description: string;
  isGood: boolean;
}

export default function VibeRestorationHistory() {
  const [states, setStates] = useState<CodeState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<CodeState | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/vibe-restoration/history');
      if (response.ok) {
        const data = await response.json();
        setStates(data.states || []);
      } else {
        // Mock data
        setStates([
          {
            id: '1',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            qualityScore: 87,
            commitHash: 'abc123',
            description: 'Last known good state',
            isGood: true
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            qualityScore: 92,
            commitHash: 'def456',
            description: 'High quality state',
            isGood: true
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            qualityScore: 75,
            commitHash: 'ghi789',
            description: 'Regression detected',
            isGood: false
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreToState = async (stateId: string) => {
    try {
      const response = await fetch(`/api/beast-mode/janitor/vibe-restoration/restore/${stateId}`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Code restored successfully!');
        loadHistory();
      }
    } catch (error) {
      console.error('Failed to restore:', error);
      alert('Failed to restore code state');
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

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Vibe Restoration History</CardTitle>
        <CardDescription className="text-slate-400">
          Track code quality over time and restore to last good state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {states.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No code states tracked yet. Enable Vibe Restoration to start tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {states.map((state) => (
              <div
                key={state.id}
                className={`p-4 rounded-lg border ${
                  state.isGood
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${
                      state.isGood ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {state.qualityScore}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {new Date(state.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">{state.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={state.isGood ? 'default' : 'secondary'}
                      className={
                        state.isGood
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                    >
                      {state.isGood ? 'Good' : 'Regression'}
                    </Badge>
                    {state.isGood && (
                      <Button
                        size="sm"
                        onClick={() => restoreToState(state.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Commit: {state.commitHash}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

