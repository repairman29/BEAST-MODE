'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import EnsembleManagement from './EnsembleManagement';
import NASManagement from './NASManagement';
import FineTuningManagement from './FineTuningManagement';
import { getAnalytics } from '@/lib/analytics';

export default function AdvancedMLFeatures() {
  const [activeTab, setActiveTab] = useState<'ensemble' | 'nas' | 'fine-tuning' | 'cross-domain' | 'caching'>('ensemble');
  const analytics = getAnalytics();

  useEffect(() => {
    // Track page view
    analytics.track('advanced_ml', 'navigation', 'view', activeTab);
  }, [activeTab, analytics]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    analytics.track('advanced_ml', 'navigation', 'tab_changed', `${activeTab}_to_${tab}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Advanced ML Features</h1>
        <p className="text-slate-400">Powerful machine learning capabilities for enhanced predictions</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ensemble">Ensembles</TabsTrigger>
          <TabsTrigger value="nas">NAS</TabsTrigger>
          <TabsTrigger value="fine-tuning">Fine-Tuning</TabsTrigger>
          <TabsTrigger value="cross-domain">Cross-Domain</TabsTrigger>
          <TabsTrigger value="caching">Caching</TabsTrigger>
        </TabsList>

        <TabsContent value="ensemble">
          <EnsembleManagement />
        </TabsContent>

        <TabsContent value="nas">
          <NASManagement />
        </TabsContent>

        <TabsContent value="fine-tuning">
          <FineTuningManagement />
        </TabsContent>

        <TabsContent value="cross-domain">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Cross-Domain Learning</CardTitle>
              <CardDescription>Transfer knowledge across domains</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Cross-domain learning features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Advanced Caching</CardTitle>
              <CardDescription>Predictive caching for improved performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Advanced caching features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
