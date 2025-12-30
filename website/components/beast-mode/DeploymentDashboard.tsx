"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface Deployment {
  id: string;
  name: string;
  platform: string;
  strategy: string;
  environment: string;
  status: string;
  progress: number;
  startTime: string;
  completedAt?: string;
  version?: string;
  logs?: Array<{
    timestamp: string;
    message: string;
    progress: number;
  }>;
}

/**
 * BEAST MODE Deployment Dashboard
 *
 * Enterprise-grade deployment orchestration across multiple platforms
 */
function DeploymentDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [showCreateDeployment, setShowCreateDeployment] = useState(false);
  const [newDeployment, setNewDeployment] = useState({
    name: '',
    platform: 'vercel',
    strategy: 'instant',
    environment: 'production',
    version: '',
    source: '',
    config: {
      endpoint: '',
      serviceType: 'web-service'
    }
  });

  useEffect(() => {
    fetchDeployments();
    fetchPlatforms();
    fetchStrategies();
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/beast-mode/deployments');
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/beast-mode/deployments/platforms');
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms || []);
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/beast-mode/deployments/strategies');
      if (response.ok) {
        const data = await response.json();
        setStrategies(data.strategies || []);
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    }
  };

  const createDeployment = async () => {
    if (!newDeployment.name || !newDeployment.source) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDeployment)
      });

      if (response.ok) {
        const deployment = await response.json();
        setDeployments(prev => [deployment, ...prev]);
        setShowCreateDeployment(false);
        setNewDeployment({
          name: '',
          platform: 'vercel',
          strategy: 'instant',
          environment: 'production',
          version: '',
          source: '',
          config: {
            endpoint: '',
            serviceType: 'web-service'
          }
        });
      }
    } catch (error) {
      console.error('Failed to create deployment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'deploying': return 'text-cyan-400';
      case 'failed': return 'text-red-400';
      case 'rolling_back': return 'text-amber-400';
      case 'rolled_back': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'deploying': return '🚀';
      case 'failed': return '❌';
      case 'rolling_back': return '🔄';
      case 'rolled_back': return '↩️';
      default: return '⏳';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel': return '▲';
      case 'railway': return '🚂';
      case 'aws': return '☁️';
      case 'docker': return '🐳';
      case 'kubernetes': return '⎈';
      default: return '🖥️';
    }
  };

  const platformDetails = {
    vercel: {
      name: 'Vercel',
      description: 'Serverless deployment platform',
      capabilities: ['Static Sites', 'Serverless Functions', 'Edge Computing'],
      strategies: ['instant', 'canary']
    },
    railway: {
      name: 'Railway',
      description: 'Infrastructure provisioning platform',
      capabilities: ['Docker', 'Databases', 'Scaling', 'Rollback'],
      strategies: ['instant', 'blue-green']
    },
    aws: {
      name: 'AWS',
      description: 'Cloud computing platform',
      capabilities: ['ECS', 'Lambda', 'EC2', 'Auto-scaling'],
      strategies: ['blue-green', 'canary', 'rolling']
    },
    docker: {
      name: 'Docker',
      description: 'Container platform',
      capabilities: ['Containers', 'Compose', 'Swarm'],
      strategies: ['rolling', 'instant']
    },
    kubernetes: {
      name: 'Kubernetes',
      description: 'Container orchestration platform',
      capabilities: ['Pods', 'Services', 'Ingress', 'Helm'],
      strategies: ['rolling', 'blue-green', 'canary']
    }
  };

  const strategyDetails = {
    instant: {
      name: 'Instant Deployment',
      description: 'Direct replacement with brief potential downtime',
      risk: 'High',
      downtime: 'Brief',
      bestFor: 'Small updates, non-critical services'
    },
    'blue-green': {
      name: 'Blue-Green Deployment',
      description: 'Zero-downtime with instant rollback capability',
      risk: 'Low',
      downtime: 'None',
      bestFor: 'Production applications, critical services'
    },
    canary: {
      name: 'Canary Deployment',
      description: 'Gradual traffic shifting with automatic rollback',
      risk: 'Medium',
      downtime: 'None',
      bestFor: 'Testing new features, gradual rollouts'
    },
    rolling: {
      name: 'Rolling Deployment',
      description: 'Gradual replacement with service overlap',
      risk: 'Medium',
      downtime: 'Minimal',
      bestFor: 'Stateful applications, databases'
    }
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">🚀 Deployment Orchestrator</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateDeployment(true)} className="bg-white text-black hover:bg-slate-100">
                ➕ New Deployment
              </Button>
              <Button onClick={fetchDeployments} variant="outline" className="border-slate-800">
                🔄 Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Deployment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {deployments.length}
              </div>
              <div className="text-slate-400 text-sm">Total Deployments</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {deployments.filter(d => d.status === 'completed').length}
              </div>
              <div className="text-slate-400 text-sm">Successful</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {deployments.filter(d => d.status === 'deploying').length}
              </div>
              <div className="text-slate-400 text-sm">Active</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {platforms.length}
              </div>
              <div className="text-slate-400 text-sm">Platforms</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {strategies.length}
              </div>
              <div className="text-slate-400 text-sm">Strategies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Overview */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🖥️ Supported Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const details = platformDetails[platform] || {
                name: platform,
                description: 'Deployment platform',
                capabilities: []
              };

              return (
                <div key={platform} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getPlatformIcon(platform)}</span>
                    <span className="text-white font-semibold">{details.name}</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{details.description}</p>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {details.capabilities.slice(0, 3).map((cap, index) => (
                        <span key={index} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Deployments */}
      {deployments.filter(d => ['deploying', 'initializing'].includes(d.status)).length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🚀 Active Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deployments.filter(d => ['deploying', 'initializing'].includes(d.status)).map((deployment) => (
                <div
                  key={deployment.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-cyan-500/50 transition-colors"
                  onClick={() => setSelectedDeployment(deployment)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg">{deployment.name}</h4>
                      <p className="text-slate-300 text-sm mt-1">
                        {getPlatformIcon(deployment.platform)} {deployment.platform} • {deployment.strategy} • {deployment.environment}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getStatusColor(deployment.status)}`}>
                        {getStatusIcon(deployment.status)} {deployment.status}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {deployment.version || 'Latest'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-cyan-400">{deployment.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${deployment.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Started: {new Date(deployment.startTime).toLocaleString()}
                    </span>
                    {deployment.logs && deployment.logs.length > 0 && (
                      <span className="text-slate-400">
                        Last: {deployment.logs[deployment.logs.length - 1]?.message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment History */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📋 Deployment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deployments.filter(d => !['deploying', 'initializing'].includes(d.status)).slice(0, 10).map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-cyan-500/40 transition-colors"
                onClick={() => setSelectedDeployment(deployment)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getStatusIcon(deployment.status)}</span>
                  <div>
                    <div className="text-white font-semibold">{deployment.name}</div>
                    <div className="text-slate-400 text-sm">
                      {getPlatformIcon(deployment.platform)} {deployment.platform} • {deployment.strategy} • {deployment.environment}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getStatusColor(deployment.status)}`}>
                    {deployment.status}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {deployment.completedAt
                      ? new Date(deployment.completedAt).toLocaleString()
                      : new Date(deployment.startTime).toLocaleString()
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Deployment Modal */}
      {showCreateDeployment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-950 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">🚀 Create New Deployment</CardTitle>
                <Button onClick={() => setShowCreateDeployment(false)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Deployment Name</label>
                  <input
                    type="text"
                    value={newDeployment.name}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter deployment name"
                  />
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Platform</label>
                  <select
                    value={newDeployment.platform}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>
                        {platformDetails[platform]?.name || platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Strategy</label>
                  <select
                    value={newDeployment.strategy}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, strategy: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {strategies.map(strategy => (
                      <option key={strategy} value={strategy}>
                        {strategyDetails[strategy]?.name || strategy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Environment</label>
                  <select
                    value={newDeployment.environment}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, environment: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Version (Optional)</label>
                  <input
                    type="text"
                    value={newDeployment.version}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="v1.2.3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Source Repository/Artifact</label>
                <input
                  type="text"
                  value={newDeployment.source}
                  onChange={(e) => setNewDeployment(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="https://github.com/user/repo or docker:image"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Service Endpoint</label>
                  <input
                    type="text"
                    value={newDeployment.config.endpoint}
                    onChange={(e) => setNewDeployment(prev => ({
                      ...prev,
                      config: { ...prev.config, endpoint: e.target.value }
                    }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="https://api.example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Service Type</label>
                  <select
                    value={newDeployment.config.serviceType}
                    onChange={(e) => setNewDeployment(prev => ({
                      ...prev,
                      config: { ...prev.config, serviceType: e.target.value }
                    }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="web-service">Web Service</option>
                    <option value="api-service">API Service</option>
                    <option value="database">Database</option>
                  </select>
                </div>
              </div>

              {/* Strategy Details */}
              {newDeployment.strategy && strategyDetails[newDeployment.strategy] && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-amber-400 font-semibold mb-2">
                    {strategyDetails[newDeployment.strategy].name}
                  </h4>
                  <p className="text-slate-300 text-sm mb-2">
                    {strategyDetails[newDeployment.strategy].description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-400">
                      Risk: <span className={`font-semibold ${
                        strategyDetails[newDeployment.strategy].risk === 'Low' ? 'text-green-400' :
                        strategyDetails[newDeployment.strategy].risk === 'Medium' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {strategyDetails[newDeployment.strategy].risk}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Downtime: <span className="font-semibold text-cyan-400">
                        {strategyDetails[newDeployment.strategy].downtime}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={createDeployment}
                  disabled={isLoading || !newDeployment.name || !newDeployment.source}
                  className="flex-1 bg-white text-black hover:bg-slate-100"
                >
                  {isLoading ? '🚀 Deploying...' : '🚀 Start Deployment'}
                </Button>
                <Button
                  onClick={() => setShowCreateDeployment(false)}
                  variant="outline"
                  className="border-slate-800"
                >
                  Cancel
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deployment Details Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-950 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{selectedDeployment.name}</CardTitle>
                <Button onClick={() => setSelectedDeployment(null)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 text-sm">Status</span>
                    <div className={`mt-1 font-semibold ${getStatusColor(selectedDeployment.status)}`}>
                      {selectedDeployment.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Platform</span>
                    <div className="mt-1 text-cyan-400 font-semibold">
                      {getPlatformIcon(selectedDeployment.platform)} {selectedDeployment.platform}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Strategy</span>
                    <div className="mt-1 text-cyan-400 font-semibold">{selectedDeployment.strategy}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Progress</span>
                    <div className="mt-1 text-cyan-400 font-semibold">{selectedDeployment.progress}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-amber-400 font-semibold mb-2">📋 Deployment Details</h4>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Environment:</span>
                        <span className="text-white ml-2">{selectedDeployment.environment}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Version:</span>
                        <span className="text-white ml-2">{selectedDeployment.version || 'Latest'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Started:</span>
                        <span className="text-white ml-2">
                          {new Date(selectedDeployment.startTime).toLocaleString()}
                        </span>
                      </div>
                      {selectedDeployment.completedAt && (
                        <div>
                          <span className="text-slate-400">Completed:</span>
                          <span className="text-white ml-2">
                            {new Date(selectedDeployment.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deployment Logs */}
                {selectedDeployment.logs && selectedDeployment.logs.length > 0 && (
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-2">📝 Deployment Logs</h4>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {selectedDeployment.logs.slice(-20).map((log, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <span className="text-slate-400 text-xs w-16">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-slate-400 text-xs w-8">
                              {log.progress}%
                            </span>
                            <span className="text-white flex-1">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="text-xs text-slate-400 text-center">
          🚀 Deployment Orchestrator | 📊 {deployments.length} deployments | 🚀 {deployments.filter(d => d.status === 'deploying').length} active |
          ✅ {deployments.filter(d => d.status === 'completed').length} successful | 🖥️ {platforms.length} platforms | 🎯 {strategies.length} strategies
        </div>
      </div>
    </div>
  );
}

export default DeploymentDashboard;

