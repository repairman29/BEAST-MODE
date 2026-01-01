"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface JanitorConfigModalProps {
  feature: string;
  onClose: () => void;
  onSave: (config: any) => void;
  currentConfig?: any;
}

export default function JanitorConfigModal({ feature, onClose, onSave, currentConfig }: JanitorConfigModalProps) {
  const [config, setConfig] = useState(currentConfig || getDefaultConfig(feature));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFeatureConfig = () => {
    switch (feature) {
      case 'silentRefactoring':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Overnight Mode
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.overnightMode}
                    onChange={(e) => setConfig({ ...config, overnightMode: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Enable automatic overnight refactoring</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">Runs 2 AM - 6 AM automatically</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Schedule
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={config.schedule?.start || '02:00'}
                    onChange={(e) => setConfig({
                      ...config,
                      schedule: { ...config.schedule, start: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={config.schedule?.end || '06:00'}
                    onChange={(e) => setConfig({
                      ...config,
                      schedule: { ...config.schedule, end: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Auto-Merge Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoMerge}
                    onChange={(e) => setConfig({ ...config, autoMerge: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Auto-merge safe changes</span>
                </label>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Confidence Threshold: {config.confidenceThreshold || 0.999}
                  </label>
                  <input
                    type="range"
                    min="0.9"
                    max="1.0"
                    step="0.001"
                    value={config.confidenceThreshold || 0.999}
                    onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Only auto-merge changes with {((config.confidenceThreshold || 0.999) * 100).toFixed(1)}%+ confidence
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireTests}
                    onChange={(e) => setConfig({ ...config, requireTests: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Require tests to pass before auto-merge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireHumanReview}
                    onChange={(e) => setConfig({ ...config, requireHumanReview: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Require human review for all changes</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Limits
              </label>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Max Changes Per Run: {config.maxChangesPerRun || 50}
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={config.maxChangesPerRun || 50}
                  onChange={(e) => setConfig({ ...config, maxChangesPerRun: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'architectureEnforcement':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Active Rules
              </label>
              <div className="space-y-2">
                {[
                  { id: 'blockSecrets', label: 'Block secrets in code', enabled: config.blockSecrets !== false },
                  { id: 'preventDbInFrontend', label: 'Prevent database logic in frontend', enabled: config.preventDbInFrontend !== false },
                  { id: 'enforceSeparation', label: 'Enforce separation of concerns', enabled: config.enforceSeparation !== false },
                  { id: 'autoFixPatterns', label: 'Auto-fix common patterns', enabled: config.autoFixPatterns !== false },
                  { id: 'blockEval', label: 'Block // SECURITY: eval() disabled
// eval() usage', enabled: config.blockEval !== false },
                ].map((rule) => (
                  <label key={rule.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-800/50 rounded">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => setConfig({ ...config, [rule.id]: e.target.checked })}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span className="text-slate-300">{rule.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Enforcement Level
              </label>
              <select
                value={config.enforcementLevel || 'strict'}
                onChange={(e) => setConfig({ ...config, enforcementLevel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="strict">Strict - Block all violations</option>
                <option value="moderate">Moderate - Warn and auto-fix</option>
                <option value="lenient">Lenient - Warn only</option>
              </select>
            </div>
          </div>
        );

      case 'vibeRestoration':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Restoration Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoRestore}
                    onChange={(e) => setConfig({ ...config, autoRestore: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Automatically restore on regression</span>
                </label>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Quality Drop Threshold: {config.qualityThreshold || 10}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={config.qualityThreshold || 10}
                    onChange={(e) => setConfig({ ...config, qualityThreshold: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Restore if quality drops by {config.qualityThreshold || 10}% or more
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    History Retention: {config.historyDays || 30} days
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={config.historyDays || 30}
                    onChange={(e) => setConfig({ ...config, historyDays: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'repoMemory':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Memory Settings
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Update Frequency: {config.updateFrequency || 'hourly'}
                  </label>
                  <select
                    value={config.updateFrequency || 'hourly'}
                    onChange={(e) => setConfig({ ...config, updateFrequency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="realtime">Real-time (on every change)</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Graph Depth: {config.graphDepth || 5}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={config.graphDepth || 5}
                    onChange={(e) => setConfig({ ...config, graphDepth: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    How many levels of dependencies to track
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'vibeOps':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Testing Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tieredTesting}
                    onChange={(e) => setConfig({ ...config, tieredTesting: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Enable tiered testing (optimize costs)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cacheResults}
                    onChange={(e) => setConfig({ ...config, cacheResults: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Cache test results</span>
                </label>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Visual AI Threshold: {((config.visualAiThreshold || 0.95) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={config.visualAiThreshold || 0.95}
                    onChange={(e) => setConfig({ ...config, visualAiThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use full Visual AI for tests above this confidence
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'invisibleCICD':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                CI/CD Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.silentLinting}
                    onChange={(e) => setConfig({ ...config, silentLinting: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Silent linting (no CLI output)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backgroundTesting}
                    onChange={(e) => setConfig({ ...config, backgroundTesting: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Background testing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.securityScanning}
                    onChange={(e) => setConfig({ ...config, securityScanning: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Security scanning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoFix}
                    onChange={(e) => setConfig({ ...config, autoFix: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Auto-fix violations</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoCommit}
                    onChange={(e) => setConfig({ ...config, autoCommit: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-slate-300">Auto-commit fixes</span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-slate-400">Configuration for {feature} coming soon...</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card
        className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">
              Configure {getFeatureName(feature)}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
              ✕
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            {getFeatureDescription(feature)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {getFeatureConfig()}
          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDefaultConfig(feature: string): any {
  const defaults: Record<string, any> = {
    silentRefactoring: {
      overnightMode: true,
      autoMerge: false,
      confidenceThreshold: 0.999,
      requireTests: true,
      requireHumanReview: false,
      maxChangesPerRun: 50,
      schedule: { start: '02:00', end: '06:00' }
    },
    architectureEnforcement: {
      blockSecrets: true,
      preventDbInFrontend: true,
      enforceSeparation: true,
      autoFixPatterns: true,
      blockEval: true,
      enforcementLevel: 'strict'
    },
    vibeRestoration: {
      autoRestore: false,
      qualityThreshold: 10,
      historyDays: 30
    },
    repoMemory: {
      updateFrequency: 'hourly',
      graphDepth: 5
    },
    vibeOps: {
      tieredTesting: true,
      cacheResults: true,
      visualAiThreshold: 0.95
    },
    invisibleCICD: {
      silentLinting: true,
      backgroundTesting: true,
      securityScanning: true,
      autoFix: true,
      autoCommit: false
    }
  };
  return defaults[feature] || {};
}

function getFeatureName(feature: string): string {
  const names: Record<string, string> = {
    silentRefactoring: 'Silent Refactoring',
    architectureEnforcement: 'Architecture Enforcement',
    vibeRestoration: 'Vibe Restoration',
    repoMemory: 'Repo-Level Memory',
    vibeOps: 'Vibe Ops',
    invisibleCICD: 'Invisible CI/CD'
  };
  return names[feature] || feature;
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    silentRefactoring: 'Configure overnight code cleanup and automatic refactoring',
    architectureEnforcement: 'Set up rules and enforcement levels for code patterns',
    vibeRestoration: 'Configure regression detection and automatic restoration',
    repoMemory: 'Adjust semantic graph update frequency and depth',
    vibeOps: 'Configure Visual AI testing and cost optimization',
    invisibleCICD: 'Set up silent linting, testing, and security scanning'
  };
  return descriptions[feature] || '';
}

