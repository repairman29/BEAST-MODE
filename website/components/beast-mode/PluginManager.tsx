"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import PluginRunner from './PluginRunner';
import PluginPermissions from './PluginPermissions';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  config: any;
  installedAt: string;
  updatedAt?: string;
}

export default function PluginManager() {
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    fetchInstalledPlugins();
  }, []);

  const fetchInstalledPlugins = async () => {
    setIsLoading(true);
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('beastModeUserId') || 'demo-user' 
        : 'demo-user';
      
      const response = await fetch(`/api/beast-mode/marketplace/installed?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInstalledPlugins(data.plugins || []);
      }
    } catch (error) {
      console.error('Failed to fetch installed plugins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('beastModeUserId') || 'demo-user' 
        : 'demo-user';
      
      const response = await fetch('/api/beast-mode/marketplace/installed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pluginId, enabled: !enabled })
      });

      if (response.ok) {
        await fetchInstalledPlugins();
        
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `Plugin ${!enabled ? 'enabled' : 'disabled'} successfully!`
            }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    if (!confirm(`Are you sure you want to uninstall this plugin?`)) {
      return;
    }

    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('beastModeUserId') || 'demo-user' 
        : 'demo-user';
      
      const response = await fetch(`/api/beast-mode/marketplace/installed?userId=${userId}&pluginId=${pluginId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchInstalledPlugins();
        setSelectedPlugin(null);
        
        // Remove from localStorage
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('beast-mode-installed-plugins');
          if (saved) {
            try {
              const plugins = JSON.parse(saved);
              const updated = plugins.filter((id: string) => id !== pluginId);
              localStorage.setItem('beast-mode-installed-plugins', JSON.stringify(updated));
            } catch (e) {
              console.error('Failed to update localStorage:', e);
            }
          }
          
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: 'Plugin uninstalled successfully!'
            }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading installed plugins...</span>
        </CardContent>
      </Card>
    );
  }

  if (installedPlugins.length === 0) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16 slide-up">
          <div className="text-6xl mb-4 animate-bounce">📦</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No plugins installed</div>
          <div className="text-sm text-slate-400 mb-6">
            Install plugins from the Marketplace to extend BEAST MODE's capabilities!
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard?view=marketplace'}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {installedPlugins.map((plugin) => (
        <Card 
          key={plugin.id} 
          className={`bg-slate-900/90 border-slate-800 smooth-transition hover-lift ${
            selectedPlugin?.id === plugin.id ? 'border-cyan-500' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white text-lg">{plugin.name}</CardTitle>
                <CardDescription className="text-slate-400 text-sm mt-1">
                  {plugin.description}
                </CardDescription>
                <div className="text-xs text-slate-500 mt-2">
                  Version {plugin.version} • Installed {new Date(plugin.installedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plugin.enabled}
                    onChange={() => togglePlugin(plugin.id, plugin.enabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  <span className="ml-3 text-sm text-slate-400">
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlugin(plugin);
                  setShowConfig(true);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                ⚙️ Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlugin(plugin);
                  setShowConfig(false);
                  setShowRunner(false);
                  setShowPermissions(false);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                📖 Usage Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlugin(plugin);
                  setShowConfig(false);
                  setShowRunner(false);
                  setShowPermissions(true);
                }}
                className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/20"
              >
                🔒 Permissions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlugin(plugin);
                  setShowConfig(false);
                  setShowRunner(true);
                  setShowPermissions(false);
                }}
                className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/20"
              >
                ▶️ Run Plugin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => uninstallPlugin(plugin.id)}
                className="border-red-700 text-red-400 hover:bg-red-900/20"
              >
                🗑️ Uninstall
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Plugin Details Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">{selectedPlugin.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlugin(null)}
                  className="border-slate-700 text-slate-300"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showRunner ? (
                <PluginRunner
                  pluginId={selectedPlugin.id}
                  pluginName={selectedPlugin.name}
                  config={selectedPlugin.config}
                />
              ) : showPermissions ? (
                <PluginPermissions
                  pluginId={selectedPlugin.id}
                  pluginName={selectedPlugin.name}
                  userId={typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || undefined : undefined}
                  onPermissionsChanged={() => fetchInstalledPlugins()}
                />
              ) : showConfig ? (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Configuration</h3>
                  <div className="bg-slate-950 p-4 rounded-lg">
                    <pre className="text-slate-300 text-sm overflow-x-auto">
                      {JSON.stringify(selectedPlugin.config || {}, null, 2)}
                    </pre>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Configuration is saved automatically. Changes take effect immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Usage Guide</h3>
                  <div className="bg-slate-950 p-4 rounded-lg space-y-3">
                    <div>
                      <div className="text-cyan-400 font-semibold mb-2">Command:</div>
                      <code className="bg-slate-900 px-2 py-1 rounded text-slate-300">
                        beast-mode {selectedPlugin.id.replace('-', ' ')}
                      </code>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-semibold mb-2">Examples:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><code className="bg-slate-900 px-1 rounded">beast-mode {selectedPlugin.id.replace('-', ' ')} --help</code></li>
                        <li><code className="bg-slate-900 px-1 rounded">beast-mode {selectedPlugin.id.replace('-', ' ')} --watch</code></li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-semibold mb-2">Documentation:</div>
                      <a 
                        href={`/docs/plugins/${selectedPlugin.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                      >
                        View full documentation →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

