"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, XCircle, Download, RefreshCw, Package } from 'lucide-react';

interface Dependency {
  pluginId: string;
  pluginName: string;
  version: string;
  required: boolean;
  installed: boolean;
  conflicts?: string[];
}

interface DependencyResolution {
  dependencies: Dependency[];
  conflicts: string[];
  missing: string[];
  canInstall: boolean;
}

interface PluginDependenciesProps {
  pluginId: string;
  pluginName: string;
  userId?: string;
  onDependenciesResolved?: (resolution: DependencyResolution) => void;
  onInstall?: (pluginId: string, dependencies: string[]) => void;
}

export default function PluginDependencies({
  pluginId,
  pluginName,
  userId,
  onDependenciesResolved,
  onInstall
}: PluginDependenciesProps) {
  const [resolution, setResolution] = useState<DependencyResolution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installingDeps, setInstallingDeps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pluginId && userId) {
      resolveDependencies();
    }
  }, [pluginId, userId]);

  const resolveDependencies = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/beast-mode/marketplace/dependencies?pluginId=${pluginId}&userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        const resolution: DependencyResolution = {
          dependencies: data.dependencies || [],
          conflicts: data.conflicts || [],
          missing: data.missing || [],
          canInstall: (data.conflicts?.length || 0) === 0 && (data.missing?.length || 0) === 0
        };
        setResolution(resolution);
        
        if (onDependenciesResolved) {
          onDependenciesResolved(resolution);
        }
      }
    } catch (error) {
      console.error('Failed to resolve dependencies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const installDependencies = async () => {
    if (!userId || !resolution || !resolution.canInstall) return;

    setIsInstalling(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          autoInstall: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Track installed dependencies
        if (data.installed) {
          setInstallingDeps(new Set(data.installed));
        }

        // Refresh resolution
        await resolveDependencies();

        // Track analytics
        if (typeof window !== 'undefined') {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('plugin-dependencies', `installed-${data.installed?.length || 0}`);
        }

        // Notify parent
        if (onInstall) {
          onInstall(pluginId, data.installed || []);
        }

        // Show success notification
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `Dependencies installed successfully!`
            }
          });
          window.dispatchEvent(event);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to install dependencies');
      }
    } catch (error: any) {
      console.error('Failed to install dependencies:', error);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: `Failed to install dependencies: ${error.message}`
          }
        });
        window.dispatchEvent(event);
      }
    } finally {
      setIsInstalling(false);
      setTimeout(() => setInstallingDeps(new Set()), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Resolving dependencies...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resolution) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>Failed to resolve dependencies</p>
            <Button
              onClick={resolveDependencies}
              variant="outline"
              size="sm"
              className="mt-4 border-slate-700 text-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDependencies = resolution.dependencies.length > 0;
  const hasConflicts = resolution.conflicts.length > 0;
  const hasMissing = resolution.missing.length > 0;

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Dependencies
            </CardTitle>
            <CardDescription className="text-slate-400">
              Required plugins and dependency resolution
            </CardDescription>
          </div>
          <Button
            onClick={resolveDependencies}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-cyan-400">{resolution.dependencies.length}</div>
            <div className="text-xs text-slate-400 mt-1">Dependencies</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            hasConflicts ? 'bg-red-500/20' : 'bg-green-500/20'
          }`}>
            <div className="text-2xl font-bold text-white">{resolution.conflicts.length}</div>
            <div className="text-xs text-slate-400 mt-1">Conflicts</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            hasMissing ? 'bg-amber-500/20' : 'bg-green-500/20'
          }`}>
            <div className="text-2xl font-bold text-white">{resolution.missing.length}</div>
            <div className="text-xs text-slate-400 mt-1">Missing</div>
          </div>
        </div>

        {/* Conflicts */}
        {hasConflicts && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-red-400 font-semibold">Conflicts Detected</h3>
            </div>
            <ul className="space-y-1">
              {resolution.conflicts.map((conflict, index) => (
                <li key={index} className="text-sm text-red-300">
                  • {conflict}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-400/80 mt-2">
              Please resolve conflicts before installing this plugin.
            </p>
          </div>
        )}

        {/* Missing Dependencies */}
        {hasMissing && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-amber-400 font-semibold">Missing Dependencies</h3>
            </div>
            <ul className="space-y-1 mb-3">
              {resolution.missing.map((missing, index) => (
                <li key={index} className="text-sm text-amber-300">
                  • {missing}
                </li>
              ))}
            </ul>
            {resolution.canInstall && (
              <Button
                onClick={installDependencies}
                disabled={isInstalling}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isInstalling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install Missing Dependencies
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Dependencies List */}
        {hasDependencies ? (
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Required Dependencies</h3>
            {resolution.dependencies.map((dep) => (
              <div
                key={dep.pluginId}
                className={`p-3 rounded-lg border ${
                  dep.installed
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {dep.installed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">{dep.pluginName}</div>
                      <div className="text-xs text-slate-400">
                        {dep.pluginId}@{dep.version}
                        {dep.required && <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/50 text-xs">Required</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dep.installed ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        Installed
                      </Badge>
                    ) : installingDeps.has(dep.pluginId) ? (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Installing...
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                        Not Installed
                      </Badge>
                    )}
                  </div>
                </div>
                {dep.conflicts && dep.conflicts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-500/30">
                    <div className="text-xs text-red-400">Conflicts:</div>
                    <ul className="text-xs text-red-300 mt-1 space-y-1">
                      {dep.conflicts.map((conflict, i) => (
                        <li key={i}>• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-sm">No dependencies required</p>
            <p className="text-xs mt-1">This plugin can be installed independently</p>
          </div>
        )}

        {/* Install Button */}
        {resolution.canInstall && hasDependencies && !resolution.dependencies.every(d => d.installed) && (
          <Button
            onClick={installDependencies}
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {isInstalling ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Installing Dependencies...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install All Dependencies
              </>
            )}
          </Button>
        )}

        {/* Success Message */}
        {!hasConflicts && !hasMissing && resolution.dependencies.every(d => d.installed) && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm font-medium">
                All dependencies are installed and ready!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
