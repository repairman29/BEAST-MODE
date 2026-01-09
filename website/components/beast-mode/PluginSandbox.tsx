"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle2, Settings } from 'lucide-react';

interface SandboxConfig {
  enabled: boolean;
  isolationLevel: 'strict' | 'moderate' | 'permissive';
  resourceLimits: {
    maxMemoryMB: number;
    maxExecutionTimeMs: number;
    maxFileSizeKB: number;
  };
  allowedOperations: string[];
  blockedOperations: string[];
}

interface PluginSandboxProps {
  pluginId: string;
  pluginName: string;
  userId?: string;
  onSandboxChanged?: (config: SandboxConfig) => void;
}

export default function PluginSandbox({
  pluginId,
  pluginName,
  userId,
  onSandboxChanged
}: PluginSandboxProps) {
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    enabled: true,
    isolationLevel: 'moderate',
    resourceLimits: {
      maxMemoryMB: 512,
      maxExecutionTimeMs: 30000,
      maxFileSizeKB: 1024
    },
    allowedOperations: [],
    blockedOperations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (pluginId && userId) {
      fetchSandboxConfig();
    }
  }, [pluginId, userId]);

  const fetchSandboxConfig = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/beast-mode/marketplace/sandbox?pluginId=${pluginId}&userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.sandbox) {
          setSandboxConfig(data.sandbox);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sandbox config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSandboxConfig = async (updates: Partial<SandboxConfig>) => {
    if (!userId) return;

    const newConfig = { ...sandboxConfig, ...updates };
    setIsUpdating(true);

    try {
      const response = await fetch('/api/beast-mode/marketplace/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          sandbox: newConfig
        })
      });

      if (response.ok) {
        setSandboxConfig(newConfig);
        
        if (onSandboxChanged) {
          onSandboxChanged(newConfig);
        }

        // Track analytics
        if (typeof window !== 'undefined') {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('plugin-sandbox', `updated-${newConfig.isolationLevel}`);
        }

        // Show notification
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: 'Sandbox configuration updated'
            }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('Failed to update sandbox config:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isolationLevels = [
    {
      value: 'strict' as const,
      label: 'Strict',
      description: 'Maximum security - minimal permissions',
      icon: Lock,
      color: 'red'
    },
    {
      value: 'moderate' as const,
      label: 'Moderate',
      description: 'Balanced security and functionality',
      icon: Shield,
      color: 'amber'
    },
    {
      value: 'permissive' as const,
      label: 'Permissive',
      description: 'More permissions - use with trusted plugins',
      icon: Unlock,
      color: 'green'
    }
  ];

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Loading sandbox configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sandbox Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Control plugin execution environment and security
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={sandboxConfig.enabled}
                onChange={(e) => updateSandboxConfig({ enabled: e.target.checked })}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              <span>Enabled</span>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Isolation Level */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Isolation Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {isolationLevels.map((level) => {
              const Icon = level.icon;
              const isSelected = sandboxConfig.isolationLevel === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => updateSandboxConfig({ isolationLevel: level.value })}
                  disabled={isUpdating || !sandboxConfig.enabled}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? `border-${level.color}-500 bg-${level.color}-500/20`
                      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                  } ${!sandboxConfig.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${
                      isSelected ? `text-${level.color}-400` : 'text-slate-400'
                    }`} />
                    <span className={`font-semibold ${
                      isSelected ? `text-${level.color}-400` : 'text-slate-300'
                    }`}>
                      {level.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{level.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resource Limits */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Resource Limits</h3>
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Max Memory: {sandboxConfig.resourceLimits.maxMemoryMB} MB
              </label>
              <input
                type="range"
                min="128"
                max="2048"
                step="128"
                value={sandboxConfig.resourceLimits.maxMemoryMB}
                onChange={(e) => updateSandboxConfig({
                  resourceLimits: {
                    ...sandboxConfig.resourceLimits,
                    maxMemoryMB: parseInt(e.target.value)
                  }
                })}
                disabled={isUpdating || !sandboxConfig.enabled}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Max Execution Time: {sandboxConfig.resourceLimits.maxExecutionTimeMs / 1000}s
              </label>
              <input
                type="range"
                min="5000"
                max="60000"
                step="5000"
                value={sandboxConfig.resourceLimits.maxExecutionTimeMs}
                onChange={(e) => updateSandboxConfig({
                  resourceLimits: {
                    ...sandboxConfig.resourceLimits,
                    maxExecutionTimeMs: parseInt(e.target.value)
                  }
                })}
                disabled={isUpdating || !sandboxConfig.enabled}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Max File Size: {sandboxConfig.resourceLimits.maxFileSizeKB} KB
              </label>
              <input
                type="range"
                min="256"
                max="10240"
                step="256"
                value={sandboxConfig.resourceLimits.maxFileSizeKB}
                onChange={(e) => updateSandboxConfig({
                  resourceLimits: {
                    ...sandboxConfig.resourceLimits,
                    maxFileSizeKB: parseInt(e.target.value)
                  }
                })}
                disabled={isUpdating || !sandboxConfig.enabled}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-amber-400 font-semibold text-sm mb-1">Sandbox Protection</h4>
              <p className="text-xs text-slate-400">
                The sandbox isolates plugin execution to prevent:
              </p>
              <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc list-inside">
                <li>Unauthorized file system access</li>
                <li>Network requests to untrusted domains</li>
                <li>Execution of system commands</li>
                <li>Access to sensitive environment variables</li>
                <li>Resource exhaustion (memory, CPU, time)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-sm text-slate-300 font-medium">Sandbox Status</div>
            <div className="text-xs text-slate-400 mt-1">
              {sandboxConfig.enabled ? (
                <>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mr-2">
                    Active
                  </Badge>
                  {sandboxConfig.isolationLevel} isolation
                </>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                  Disabled
                </Badge>
              )}
            </div>
          </div>
          {sandboxConfig.enabled && (
            <Shield className={`w-8 h-8 ${
              sandboxConfig.isolationLevel === 'strict' ? 'text-red-400' :
              sandboxConfig.isolationLevel === 'moderate' ? 'text-amber-400' :
              'text-green-400'
            }`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
