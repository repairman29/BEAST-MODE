"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

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
      case 'completed': return 'text-holo-green';
      case 'deploying': return 'text-holo-cyan';
      case 'failed': return 'text-holo-red';
      case 'rolling_back': return 'text-holo-amber';
      case 'rolled_back': return 'text-holo-purple';
      default: return 'text-holo-gray';
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
      <HudPanel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-holo-cyan font-bold text-xl">🚀 Deployment Orchestrator</h2>
          <div className="flex gap-2">
            <HudButton onClick={() => setShowCreateDeployment(true)}>
              ➕ New Deployment
            </HudButton>
            <HudButton onClick={fetchDeployments}>
              🔄 Refresh
            </HudButton>
          </div>
        </div>

        {/* Deployment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-holo-cyan">
              {deployments.length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Total Deployments</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-green">
              {deployments.filter(d => d.status === 'completed').length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Successful</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-cyan">
              {deployments.filter(d => d.status === 'deploying').length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Active</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-amber">
              {platforms.length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Platforms</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-purple">
              {strategies.length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Strategies</div>
          </div>
        </div>
      </HudPanel>

      {/* Platform Overview */}
      <HudPanel>
        <h3 className="text-holo-cyan font-bold text-lg mb-4">🖥️ Supported Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const details = platformDetails[platform] || {
              name: platform,
              description: 'Deployment platform',
              capabilities: []
            };

            return (
              <div key={platform} className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getPlatformIcon(platform)}</span>
                  <span className="text-holo-cyan font-semibold">{details.name}</span>
                </div>
                <p className="text-holo-cyan/80 text-sm mb-3">{details.description}</p>
                <div className="space-y-1">
                  <div className="text-xs text-holo-cyan/70">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {details.capabilities.slice(0, 3).map((cap, index) => (
                      <span key={index} className="text-xs bg-holo-cyan/20 text-holo-cyan px-2 py-1 rounded">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </HudPanel>

      {/* Active Deployments */}
      {deployments.filter(d => ['deploying', 'initializing'].includes(d.status)).length > 0 && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">🚀 Active Deployments</h3>
          <div className="space-y-4">
            {deployments.filter(d => ['deploying', 'initializing'].includes(d.status)).map((deployment) => (
              <div
                key={deployment.id}
                className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4 cursor-pointer hover:border-holo-cyan/50 transition-colors"
                onClick={() => setSelectedDeployment(deployment)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-holo-cyan font-bold text-lg">{deployment.name}</h4>
                    <p className="text-holo-cyan/80 text-sm mt-1">
                      {getPlatformIcon(deployment.platform)} {deployment.platform} • {deployment.strategy} • {deployment.environment}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getStatusColor(deployment.status)}`}>
                      {getStatusIcon(deployment.status)} {deployment.status}
                    </div>
                    <div className="text-holo-cyan/70 text-xs">
                      {deployment.version || 'Latest'}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-holo-cyan/70">Progress</span>
                    <span className="text-holo-cyan">{deployment.progress}%</span>
                  </div>
                  <div className="w-full bg-holo-black/50 rounded-full h-2">
                    <div
                      className="bg-holo-cyan h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deployment.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-holo-cyan/70">
                    Started: {new Date(deployment.startTime).toLocaleString()}
                  </span>
                  {deployment.logs && deployment.logs.length > 0 && (
                    <span className="text-holo-cyan/70">
                      Last: {deployment.logs[deployment.logs.length - 1]?.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </HudPanel>
      )}

      {/* Deployment History */}
      <HudPanel>
        <h3 className="text-holo-cyan font-bold text-lg mb-4">📋 Deployment History</h3>
        <div className="space-y-3">
          {deployments.filter(d => !['deploying', 'initializing'].includes(d.status)).slice(0, 10).map((deployment) => (
            <div
              key={deployment.id}
              className="flex items-center justify-between bg-holo-black/20 border border-holo-cyan/20 rounded-lg p-3 cursor-pointer hover:border-holo-cyan/40 transition-colors"
              onClick={() => setSelectedDeployment(deployment)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStatusIcon(deployment.status)}</span>
                <div>
                  <div className="text-holo-cyan font-semibold">{deployment.name}</div>
                  <div className="text-holo-cyan/70 text-sm">
                    {getPlatformIcon(deployment.platform)} {deployment.platform} • {deployment.strategy} • {deployment.environment}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${getStatusColor(deployment.status)}`}>
                  {deployment.status}
                </div>
                <div className="text-holo-cyan/70 text-xs">
                  {deployment.completedAt
                    ? new Date(deployment.completedAt).toLocaleString()
                    : new Date(deployment.startTime).toLocaleString()
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </HudPanel>

      {/* Create Deployment Modal */}
      {showCreateDeployment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <HudPanel className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-holo-cyan font-bold text-lg">🚀 Create New Deployment</h3>
              <HudButton onClick={() => setShowCreateDeployment(false)}>
                ✕
              </HudButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-holo-cyan/70 text-sm mb-1">Deployment Name</label>
                <input
                  type="text"
                  value={newDeployment.name}
                  onChange={(e) => setNewDeployment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
                  placeholder="Enter deployment name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Platform</label>
                  <select
                    value={newDeployment.platform}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                  >
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>
                        {platformDetails[platform]?.name || platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Strategy</label>
                  <select
                    value={newDeployment.strategy}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, strategy: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
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
                  <label className="block text-holo-cyan/70 text-sm mb-1">Environment</label>
                  <select
                    value={newDeployment.environment}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, environment: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Version (Optional)</label>
                  <input
                    type="text"
                    value={newDeployment.version}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
                    placeholder="v1.2.3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-holo-cyan/70 text-sm mb-1">Source Repository/Artifact</label>
                <input
                  type="text"
                  value={newDeployment.source}
                  onChange={(e) => setNewDeployment(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
                  placeholder="https://github.com/user/repo or docker:image"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Service Endpoint</label>
                  <input
                    type="text"
                    value={newDeployment.config.endpoint}
                    onChange={(e) => setNewDeployment(prev => ({
                      ...prev,
                      config: { ...prev.config, endpoint: e.target.value }
                    }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
                    placeholder="https://api.example.com"
                  />
                </div>

                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Service Type</label>
                  <select
                    value={newDeployment.config.serviceType}
                    onChange={(e) => setNewDeployment(prev => ({
                      ...prev,
                      config: { ...prev.config, serviceType: e.target.value }
                    }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                  >
                    <option value="web-service">Web Service</option>
                    <option value="api-service">API Service</option>
                    <option value="database">Database</option>
                  </select>
                </div>
              </div>

              {/* Strategy Details */}
              {newDeployment.strategy && strategyDetails[newDeployment.strategy] && (
                <div className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-3">
                  <h4 className="text-holo-amber font-semibold mb-2">
                    {strategyDetails[newDeployment.strategy].name}
                  </h4>
                  <p className="text-holo-cyan/80 text-sm mb-2">
                    {strategyDetails[newDeployment.strategy].description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-holo-cyan/70">
                      Risk: <span className={`font-semibold ${
                        strategyDetails[newDeployment.strategy].risk === 'Low' ? 'text-holo-green' :
                        strategyDetails[newDeployment.strategy].risk === 'Medium' ? 'text-holo-amber' :
                        'text-holo-red'
                      }`}>
                        {strategyDetails[newDeployment.strategy].risk}
                      </span>
                    </span>
                    <span className="text-holo-cyan/70">
                      Downtime: <span className="font-semibold text-holo-cyan">
                        {strategyDetails[newDeployment.strategy].downtime}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <HudButton
                  onClick={createDeployment}
                  disabled={isLoading || !newDeployment.name || !newDeployment.source}
                  className="flex-1"
                >
                  {isLoading ? '🚀 Deploying...' : '🚀 Start Deployment'}
                </HudButton>
                <HudButton
                  onClick={() => setShowCreateDeployment(false)}
                  variant="ghost"
                >
                  Cancel
                </HudButton>
              </div>
            </div>
          </HudPanel>
        </div>
      )}

      {/* Deployment Details Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <HudPanel className="w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-holo-cyan font-bold text-lg">{selectedDeployment.name}</h3>
              <HudButton onClick={() => setSelectedDeployment(null)}>
                ✕
              </HudButton>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-holo-cyan/70 text-sm">Status</span>
                  <div className={`font-semibold ${getStatusColor(selectedDeployment.status)}`}>
                    {selectedDeployment.status}
                  </div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Platform</span>
                  <div className="text-holo-cyan font-semibold">
                    {getPlatformIcon(selectedDeployment.platform)} {selectedDeployment.platform}
                  </div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Strategy</span>
                  <div className="text-holo-cyan font-semibold">{selectedDeployment.strategy}</div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Progress</span>
                  <div className="text-holo-cyan font-semibold">{selectedDeployment.progress}%</div>
                </div>
              </div>

              <div>
                <h4 className="text-holo-amber font-semibold mb-2">📋 Deployment Details</h4>
                <div className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-holo-cyan/70">Environment:</span>
                      <span className="text-holo-cyan ml-2">{selectedDeployment.environment}</span>
                    </div>
                    <div>
                      <span className="text-holo-cyan/70">Version:</span>
                      <span className="text-holo-cyan ml-2">{selectedDeployment.version || 'Latest'}</span>
                    </div>
                    <div>
                      <span className="text-holo-cyan/70">Started:</span>
                      <span className="text-holo-cyan ml-2">
                        {new Date(selectedDeployment.startTime).toLocaleString()}
                      </span>
                    </div>
                    {selectedDeployment.completedAt && (
                      <div>
                        <span className="text-holo-cyan/70">Completed:</span>
                        <span className="text-holo-cyan ml-2">
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
                  <h4 className="text-holo-amber font-semibold mb-2">📝 Deployment Logs</h4>
                  <div className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedDeployment.logs.slice(-20).map((log, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <span className="text-holo-cyan/70 text-xs w-16">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-holo-cyan/70 text-xs w-8">
                            {log.progress}%
                          </span>
                          <span className="text-holo-cyan flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </HudPanel>
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-void-surface/50 rounded-lg border border-holo-cyan/20">
        <div className="text-xs text-holo-cyan/70 text-center">
          🚀 Deployment Orchestrator | 📊 {deployments.length} deployments | 🚀 {deployments.filter(d => d.status === 'deploying').length} active |
          ✅ {deployments.filter(d => d.status === 'completed').length} successful | 🖥️ {platforms.length} platforms | 🎯 {strategies.length} strategies
        </div>
      </div>
    </div>
  );
}

export default DeploymentDashboard;

