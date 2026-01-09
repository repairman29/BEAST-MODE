'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Play, Settings, Clock, CheckCircle2 } from 'lucide-react';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface FineTuningJob {
  id: string;
  jobName: string;
  baseModelId: string;
  status: string;
  progress?: number;
  createdAt: string;
}

export default function FineTuningManagement() {
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch('/api/mlops/fine-tuning-enhanced?action=list-jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      // Error handled silently - UI will show empty state
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch fine-tuning jobs:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading fine-tuning jobs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fine-Tuning Management</h1>
          <p className="text-slate-400">Fine-tune models with your data for better performance</p>
        </div>
        <Button onClick={() => {/* TODO */}}>
          <Play className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No Fine-Tuning Jobs"
          description="Create a new fine-tuning job to improve model performance"
        />
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="bg-slate-900/90 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{job.jobName}</CardTitle>
                    <CardDescription>Base Model: {job.baseModelId}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    job.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {job.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Progress</span>
                      <span className="text-sm text-white">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
