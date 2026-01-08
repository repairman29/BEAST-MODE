"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Model {
  modelId: string;
  name: string;
  description: string;
  rating: number;
  downloads: number;
  category: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
}

export default function MarketplaceDashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'models' | 'templates'>('models');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery]);

  async function fetchData() {
    try {
      setLoading(true);
      
      if (activeTab === 'models') {
        const url = searchQuery 
          ? `/api/marketplace/models?q=${encodeURIComponent(searchQuery)}`
          : '/api/marketplace/models?popular=true';
        const res = await fetch(url);
        const data = await res.json();
        setModels(data.models || []);
      } else if (activeTab === 'templates') {
        const url = searchQuery
          ? `/api/marketplace/templates?q=${encodeURIComponent(searchQuery)}`
          : '/api/marketplace/templates';
        const res = await fetch(url);
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Model Marketplace</h1>
        <p className="text-slate-400">Discover and share AI models and templates</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models or templates..."
            className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
          />
        </div>

        <TabsContent value="models" className="space-y-4">
          {loading ? (
            <div className="text-slate-400">Loading models...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map(model => (
                <Card key={model.modelId} className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">{model.name}</CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Rating:</span>
                        <span className="text-yellow-400">⭐ {model.rating.toFixed(1)}/5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Downloads:</span>
                        <span className="text-slate-300">{model.downloads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-slate-300">{model.category}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {loading ? (
            <div className="text-slate-400">Loading templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-slate-300">{template.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Framework:</span>
                        <span className="text-slate-300">{template.framework}</span>
                      </div>
                      <Button className="w-full mt-4" size="sm">Use Template</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
