"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface PluginUpdate {
  pluginId: string;
  pluginName: string;
  currentVersion: string;
  latestVersion: string;
  changelog: string;
  isBreaking: boolean;
  requiresRestart: boolean;
  updateSize: string;
  publishedAt: string;
}

interface PluginUpdatesProps {
  userId?: string;
  onUpdateApplied?: (pluginId: string) => void;
}

export default function PluginUpdates({ userId, onUpdateApplied }: PluginUpdatesProps) {
  const [updates, setUpdates] = useState<PluginUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPlugins, setUpdatingPlugins] = useState<Set<string>>(new Set());
  const [showChangelog, setShowChangelog] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const checkForUpdates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/beast-mode/marketplace/updates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyUpdate = async (pluginId: string) => {
    if (updatingPlugins.has(pluginId)) {
      return;
    }

    setUpdatingPlugins(prev => new Set(prev).add(pluginId));

    try {
      const response = await fetch('/api/beast-mode/marketplace/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId: userId || 'demo-user'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Remove from updates list
        setUpdates(prev => prev.filter(u => u.pluginId !== pluginId));
        
        // Notify parent
        if (onUpdateApplied) {
          onUpdateApplied(pluginId);
        }

        // Track analytics
        if (typeof window !== 'undefined') {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('plugin-update', pluginId);
          analytics.track('event', 'marketplace', 'plugin-updated', pluginId);
          
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `Plugin "${data.plugin?.name || pluginId}" updated successfully!`
            }
          });
          window.dispatchEvent(event);
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Failed to apply update:', error);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: `Failed to update plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
        window.dispatchEvent(event);
      }
    } finally {
      setUpdatingPlugins(prev => {
        const next = new Set(prev);
        next.delete(pluginId);
        return next;
      });
    }
  };

  const applyAllUpdates = async () => {
    for (const update of updates) {
      await applyUpdate(update.pluginId);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Checking for updates...</div>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🔄 Plugin Updates</CardTitle>
          <CardDescription className="text-slate-400">
            All plugins are up to date!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <div className="text-4xl mb-2">✅</div>
            <div>No updates available</div>
            <div className="text-sm mt-2">Your plugins are running the latest versions</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">🔄 Plugin Updates Available</CardTitle>
            <CardDescription className="text-slate-400">
              {updates.length} update{updates.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
          {updates.length > 1 && (
            <Button
              onClick={applyAllUpdates}
              disabled={updatingPlugins.size > 0}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Update All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {updates.map((update) => (
          <div
            key={update.pluginId}
            className={`p-4 rounded-lg border ${
              update.isBreaking
                ? 'bg-red-950/50 border-red-800'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-white font-semibold">{update.pluginName}</div>
                  {update.isBreaking && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                      Breaking
                    </span>
                  )}
                  {update.requiresRestart && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      Restart Required
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">
                  {update.currentVersion} → <span className="text-cyan-400 font-semibold">{update.latestVersion}</span>
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  Published {new Date(update.publishedAt).toLocaleDateString()} • {update.updateSize}
                </div>
              </div>
              <div className="flex gap-2">
                {update.changelog && (
                  <Button
                    onClick={() => setShowChangelog(showChangelog === update.pluginId ? null : update.pluginId)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    📋 Changelog
                  </Button>
                )}
                <Button
                  onClick={() => applyUpdate(update.pluginId)}
                  disabled={updatingPlugins.has(update.pluginId)}
                  className={`${
                    update.isBreaking
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  }`}
                >
                  {updatingPlugins.has(update.pluginId) ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </div>

            {/* Changelog */}
            {showChangelog === update.pluginId && update.changelog && (
              <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-800">
                <div className="text-white font-semibold text-sm mb-2">Changelog</div>
                <div className="text-slate-300 text-sm whitespace-pre-wrap">{update.changelog}</div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

