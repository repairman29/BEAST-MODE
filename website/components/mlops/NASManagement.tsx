'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Play, Search, TrendingUp, CheckCircle2 } from 'lucide-react';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface NASRun {
  id: string;
  name: string;
  searchStrategy: string;
  objective: string;
  status: string;
  maxTrials: number;
  currentTrial: number;
  bestScore?: number;
  createdAt: string;
}

export default function NASManagement() {
  const [runs, setRuns] = useState<NASRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'runs' | 'architectures' | 'results'>('runs');

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    try {
      setLoading(true);
      const res = await fetch('/api/mlops/nas?action=list-runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (error) {
      // Error handled silently - UI will show empty state
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch NAS runs:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading NAS runs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Neural Architecture Search</h1>
          <p className="text-slate-400">Automatically discover optimal model architectures</p>
        </div>
        <Button onClick={() => {/* TODO: Start new search */}}>
          <Play className="w-4 h-4 mr-2" />
          Start Search
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="runs">Search Runs</TabsTrigger>
          <TabsTrigger value="architectures">Architectures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          {runs.length === 0 ? (
            <EmptyState
              title="No Search Runs"
              description="Start a new architecture search to find optimal models"
            />
          ) : (
            <div className="grid gap-4">
              {runs.map((run) => (
                <Card key={run.id} className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{run.name}</CardTitle>
                        <CardDescription>
                          {run.searchStrategy} • {run.objective}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          run.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Progress</span>
                        <span className="text-sm text-white">
                          {run.currentTrial} / {run.maxTrials} trials
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(run.currentTrial / run.maxTrials) * 100}%` }}
                        />
                      </div>
                      {run.bestScore && (
                        <div className="flex items-center gap-2 mt-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-white">Best Score: {run.bestScore.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="architectures">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Discovered Architectures</CardTitle>
              <CardDescription>View architectures found during search</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Architectures Yet"
                description="Architectures will appear here as search runs complete"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Search Results</CardTitle>
              <CardDescription>Compare performance of discovered architectures</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Results Yet"
                description="Results will appear here as search runs complete"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
