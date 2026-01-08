"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  connectedAt?: string;
}

export default function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'github-actions' | 'gitlab' | 'bitbucket' | 'slack' | 'jira'>('overview');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    try {
      setLoading(true);
      
      if (activeTab === 'github-actions') {
        const res = await fetch('/api/integrations/github-actions');
        const data = await res.json();
        setWorkflows(data.workflows || []);
      } else if (activeTab === 'gitlab') {
        const res = await fetch('/api/integrations/gitlab');
        const data = await res.json();
        setWorkflows(data.pipelines || []);
      } else if (activeTab === 'bitbucket') {
        const res = await fetch('/api/integrations/bitbucket');
        const data = await res.json();
        setWorkflows(data.pipelines || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const integrationTypes = [
    { id: 'github-actions', name: 'GitHub Actions', icon: '⚙️', description: 'CI/CD workflows' },
    { id: 'gitlab', name: 'GitLab', icon: '🦊', description: 'GitLab CI/CD' },
    { id: 'bitbucket', name: 'Bitbucket', icon: '🔷', description: 'Bitbucket Pipelines' },
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Notifications' },
    { id: 'jira', name: 'Jira', icon: '🎯', description: 'Issue tracking' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-slate-400">Connect and manage your development tools</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="github-actions">GitHub</TabsTrigger>
          <TabsTrigger value="gitlab">GitLab</TabsTrigger>
          <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
          <TabsTrigger value="slack">Slack</TabsTrigger>
          <TabsTrigger value="jira">Jira</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationTypes.map(type => (
              <Card key={type.id} className="bg-slate-900/90 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    {type.name}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Connect</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="github-actions" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">GitHub Actions Workflows</CardTitle>
              <CardDescription>Manage CI/CD workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading workflows...</div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => {/* Create workflow */}}>
                    + Create Workflow
                  </Button>
                  <div className="space-y-2">
                    {workflows.map(workflow => (
                      <Card key={workflow.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{workflow.name}</h3>
                              <p className="text-slate-400 text-sm">{workflow.repo}</p>
                            </div>
                            <Button variant="outline" size="sm">View YAML</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gitlab" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">GitLab Pipelines</CardTitle>
              <CardDescription>Manage GitLab CI/CD</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading pipelines...</div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => {/* Create pipeline */}}>
                    + Create Pipeline
                  </Button>
                  <div className="space-y-2">
                    {workflows.map(pipeline => (
                      <Card key={pipeline.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">Pipeline {pipeline.id}</h3>
                              <p className="text-slate-400 text-sm">{pipeline.repo}</p>
                            </div>
                            <Button variant="outline" size="sm">View YAML</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bitbucket" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Bitbucket Pipelines</CardTitle>
              <CardDescription>Manage Bitbucket CI/CD</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading pipelines...</div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => {/* Create pipeline */}}>
                    + Create Pipeline
                  </Button>
                  <div className="space-y-2">
                    {workflows.map(pipeline => (
                      <Card key={pipeline.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">Pipeline {pipeline.id}</h3>
                              <p className="text-slate-400 text-sm">{pipeline.repo}</p>
                            </div>
                            <Button variant="outline" size="sm">View YAML</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slack" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Slack Integration</CardTitle>
              <CardDescription>Send notifications to Slack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Webhook URL</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                <Button>Connect Slack</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jira" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Jira Integration</CardTitle>
              <CardDescription>Create issues from quality findings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Jira URL</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    placeholder="https://your-domain.atlassian.net"
                  />
                </div>
                <div>
                  <label className="text-white text-sm mb-2 block">API Token</label>
                  <input
                    type="password"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    placeholder="Your Jira API token"
                  />
                </div>
                <Button>Connect Jira</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
