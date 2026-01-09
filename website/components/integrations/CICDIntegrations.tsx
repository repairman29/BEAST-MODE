"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Github, 
  Zap, 
  Train, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Settings, 
  Play,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  repo: string;
  status: 'success' | 'failure' | 'running' | 'pending';
  branch: string;
  commit: string;
  startedAt: string;
  completedAt?: string;
  qualityScore?: number;
  url?: string;
}

interface Deployment {
  id: string;
  project: string;
  url: string;
  status: 'ready' | 'building' | 'error' | 'canceled';
  branch: string;
  commit: string;
  qualityScore?: number;
  createdAt: string;
  completedAt?: string;
}

interface CICDIntegrationsProps {
  userId?: string;
  defaultTab?: 'github' | 'vercel' | 'railway';
}

export default function CICDIntegrations({ userId, defaultTab = 'github' }: CICDIntegrationsProps) {
  const [githubWorkflows, setGithubWorkflows] = useState<Workflow[]>([]);
  const [vercelDeployments, setVercelDeployments] = useState<Deployment[]>([]);
  const [railwayDeployments, setRailwayDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'github' | 'vercel' | 'railway'>(defaultTab);
  const [copiedWorkflow, setCopiedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab, userId]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'github') {
        const res = await fetch('/api/integrations/github-actions');
        if (res.ok) {
          const data = await res.json();
          setGithubWorkflows(data.workflows || []);
        }
      } else if (activeTab === 'vercel') {
        const res = await fetch('/api/ci/vercel');
        if (res.ok) {
          const data = await res.json();
          setVercelDeployments(data.deployments || []);
        }
      } else if (activeTab === 'railway') {
        const res = await fetch('/api/integrations/railway');
        if (res.ok) {
          const data = await res.json();
          setRailwayDeployments(data.deployments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch CI/CD data:', error);
    } finally {
      setLoading(false);
    }
  }

  const copyWorkflowYAML = async (workflowName: string) => {
    const yaml = `name: BEAST MODE Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
      - name: Install BEAST MODE
        run: npm install -g @beast-mode/core
      - name: Quality Check
        id: quality-check
        run: beast-mode quality-check
        env:
          BEAST_MODE_API_KEY: \${{ secrets.BEAST_MODE_API_KEY }}
      - name: Quality Gate
        if: steps.quality-check.outputs.score < 80
        run: exit 1
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Quality check passed! Score: \${{ steps.quality-check.outputs.score }}'
            })`;

    try {
      await navigator.clipboard.writeText(yaml);
      setCopiedWorkflow(workflowName);
      setTimeout(() => setCopiedWorkflow(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'failure':
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'running':
      case 'building':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'ready':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failure':
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'running':
      case 'building':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              CI/CD Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">
              Connect GitHub Actions, Vercel, and Railway for automated quality checks
            </CardDescription>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Actions
            </TabsTrigger>
            <TabsTrigger value="vercel" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Vercel
            </TabsTrigger>
            <TabsTrigger value="railway" className="flex items-center gap-2">
              <Train className="w-4 h-4" />
              Railway
            </TabsTrigger>
          </TabsList>

          {/* GitHub Actions */}
          <TabsContent value="github" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Workflows</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyWorkflowYAML('default')}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300"
                >
                  {copiedWorkflow ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Workflow YAML
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => window.open('https://github.com/settings/installations', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Loading workflows...</p>
              </div>
            ) : githubWorkflows.length > 0 ? (
              <div className="space-y-3">
                {githubWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusColor(workflow.status)}>
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1 capitalize">{workflow.status}</span>
                          </Badge>
                          <span className="text-white font-semibold">{workflow.name}</span>
                          {workflow.qualityScore && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                              Quality: {workflow.qualityScore}/100
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>Repo: {workflow.repo}</div>
                          <div>Branch: {workflow.branch} • Commit: {workflow.commit.substring(0, 7)}</div>
                          <div>Started: {new Date(workflow.startedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workflow.url && (
                          <Button
                            onClick={() => window.open(workflow.url, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Github className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">No workflows found</p>
                <p className="text-xs mt-1">Add BEAST MODE to your GitHub Actions workflows</p>
                <Button
                  onClick={() => copyWorkflowYAML('default')}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Workflow Template
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Vercel */}
          <TabsContent value="vercel" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Deployments</h3>
              <Button
                onClick={() => window.open('https://vercel.com/integrations', '_blank')}
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Loading deployments...</p>
              </div>
            ) : vercelDeployments.length > 0 ? (
              <div className="space-y-3">
                {vercelDeployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusColor(deployment.status)}>
                            {getStatusIcon(deployment.status)}
                            <span className="ml-1 capitalize">{deployment.status}</span>
                          </Badge>
                          <span className="text-white font-semibold">{deployment.project}</span>
                          {deployment.qualityScore && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                              Quality: {deployment.qualityScore}/100
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              {deployment.url}
                            </a>
                          </div>
                          <div>Branch: {deployment.branch} • Commit: {deployment.commit.substring(0, 7)}</div>
                          <div>Deployed: {new Date(deployment.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.open(deployment.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">No deployments found</p>
                <p className="text-xs mt-1">Connect Vercel to see deployments</p>
                <Button
                  onClick={() => window.open('https://vercel.com/integrations', '_blank')}
                  className="mt-4 bg-black hover:bg-slate-900 text-white"
                  size="sm"
                >
                  Connect Vercel
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Railway */}
          <TabsContent value="railway" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Deployments</h3>
              <Button
                onClick={() => window.open('https://railway.app/integrations', '_blank')}
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Loading deployments...</p>
              </div>
            ) : railwayDeployments.length > 0 ? (
              <div className="space-y-3">
                {railwayDeployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusColor(deployment.status)}>
                            {getStatusIcon(deployment.status)}
                            <span className="ml-1 capitalize">{deployment.status}</span>
                          </Badge>
                          <span className="text-white font-semibold">{deployment.project}</span>
                          {deployment.qualityScore && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                              Quality: {deployment.qualityScore}/100
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              {deployment.url}
                            </a>
                          </div>
                          <div>Branch: {deployment.branch} • Commit: {deployment.commit.substring(0, 7)}</div>
                          <div>Deployed: {new Date(deployment.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.open(deployment.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Train className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">No deployments found</p>
                <p className="text-xs mt-1">Connect Railway to see deployments</p>
                <Button
                  onClick={() => window.open('https://railway.app/integrations', '_blank')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  Connect Railway
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Setup Guide */}
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
          <h4 className="text-white font-semibold text-sm mb-2">Quick Setup</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>GitHub Actions:</strong> Copy workflow YAML to <code className="bg-slate-900 px-1 rounded">.github/workflows/beast-mode.yml</code></li>
            <li>• <strong>Vercel:</strong> Add webhook URL to Vercel project settings</li>
            <li>• <strong>Railway:</strong> Configure webhook in Railway project settings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
