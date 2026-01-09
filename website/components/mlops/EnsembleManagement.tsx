'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Settings, TrendingUp, Activity } from 'lucide-react';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface EnsembleConfig {
  id: string;
  name: string;
  description?: string;
  modelIds: string[];
  ensembleType: string;
  weights: Record<string, number>;
  isActive: boolean;
  createdAt: string;
}

export default function EnsembleManagement() {
  const [configs, setConfigs] = useState<EnsembleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'configs' | 'predictions' | 'performance'>('configs');

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      setLoading(true);
      const res = await fetch('/api/mlops/ensemble?action=list-configs');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Failed to fetch ensemble configs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading ensemble configurations..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ensemble Management</h1>
          <p className="text-slate-400">Manage multi-model ensembles for improved predictions</p>
        </div>
        <Button onClick={() => {/* TODO: Create new config */}}>
          <Plus className="w-4 h-4 mr-2" />
          New Ensemble
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configs">Configurations</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {configs.length === 0 ? (
            <EmptyState
              title="No Ensemble Configurations"
              description="Create your first ensemble to combine multiple models"
            />
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id} className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{config.name}</CardTitle>
                        <CardDescription>{config.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isActive && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                            Active
                          </span>
                        )}
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-slate-400">Type: </span>
                        <span className="text-sm text-white">{config.ensembleType}</span>
                      </div>
                      <div>
                        <span className="text-sm text-slate-400">Models: </span>
                        <span className="text-sm text-white">{config.modelIds.length}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Activity className="w-4 h-4 mr-2" />
                          View Performance
                        </Button>
                        <Button variant="outline" size="sm">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Predictions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictions">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Ensemble Predictions</CardTitle>
              <CardDescription>View predictions from ensemble models</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Predictions Yet"
                description="Ensemble predictions will appear here once models start making predictions"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
              <CardDescription>Track ensemble model performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Performance Data"
                description="Performance metrics will appear here as ensembles are used"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
