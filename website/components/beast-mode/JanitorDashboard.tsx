"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import JanitorConfigModal from './JanitorConfigModal';
import VibeOpsTestCreator from './VibeOpsTestCreator';
import RefactoringHistory from './RefactoringHistory';
import ArchitectureRulesView from './ArchitectureRulesView';
import RepoMemoryGraph from './RepoMemoryGraph';
import VibeRestorationHistory from './VibeRestorationHistory';
import InvisibleCICDLogs from './InvisibleCICDLogs';
import JanitorActivityFeed from './JanitorActivityFeed';
import JanitorMetricsChart from './JanitorMetricsChart';
import JanitorNotifications from './JanitorNotifications';
import JanitorOnboarding from './JanitorOnboarding';
import JanitorQuickActions from './JanitorQuickActions';
import JanitorStatusIndicator from './JanitorStatusIndicator';
import JanitorErrorBoundary from './JanitorErrorBoundary';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface JanitorStatus {
  enabled: boolean;
  silentRefactoring: {
    enabled: boolean;
    overnightMode: boolean;
    lastRun: string | null;
    issuesFixed: number;
    prsCreated: number;
  };
  architectureEnforcement: {
    enabled: boolean;
    violationsBlocked: number;
    lastCheck: string | null;
  };
  vibeRestoration: {
    enabled: boolean;
    lastRestore: string | null;
    regressionsDetected: number;
  };
  repoMemory: {
    enabled: boolean;
    graphSize: number;
    lastUpdate: string | null;
  };
  vibeOps: {
    enabled: boolean;
    testsRun: number;
    lastTest: string | null;
  };
  invisibleCICD: {
    enabled: boolean;
    scansRun: number;
    issuesFound: number;
  };
}

export default function JanitorDashboard() {
  const [status, setStatus] = useState<JanitorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showRestorationHistory, setShowRestorationHistory] = useState(false);
  const [showCICDLogs, setShowCICDLogs] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadJanitorStatus();
    // Poll every 30 seconds for updates
    const interval = setInterval(loadJanitorStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    if (status && !status.enabled) {
      const hasSeenOnboarding = localStorage.getItem('janitor-onboarding-seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [status]);

  const loadJanitorStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/beast-mode/janitor/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load janitor status:', errorData);
        // Set minimal status to show empty state
        setStatus({
          enabled: false,
          silentRefactoring: { enabled: false, overnightMode: false, lastRun: null, issuesFixed: 0, prsCreated: 0 },
          architectureEnforcement: { enabled: false, violationsBlocked: 0, lastCheck: null },
          vibeRestoration: { enabled: false, lastRestore: null, regressionsDetected: 0 },
          repoMemory: { enabled: false, graphSize: 0, lastUpdate: null },
          vibeOps: { enabled: false, testsRun: 0, lastTest: null },
          invisibleCICD: { enabled: false, scansRun: 0, issuesFound: 0 }
        });
      }
    } catch (error) {
      console.error('Failed to load janitor status:', error);
      // Set minimal status on error
      setStatus({
        enabled: false,
        silentRefactoring: { enabled: false, overnightMode: false, lastRun: null, issuesFixed: 0, prsCreated: 0 },
        architectureEnforcement: { enabled: false, violationsBlocked: 0, lastCheck: null },
        vibeRestoration: { enabled: false, lastRestore: null, regressionsDetected: 0 },
        repoMemory: { enabled: false, graphSize: 0, lastUpdate: null },
        vibeOps: { enabled: false, testsRun: 0, lastTest: null },
        invisibleCICD: { enabled: false, scansRun: 0, issuesFound: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature: string, enabled: boolean) => {
    try {
      // Convert camelCase to kebab-case for API
      const featureName = feature
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      
      const response = await fetch(`/api/beast-mode/janitor/${featureName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (response.ok) {
        loadJanitorStatus();
      } else {
        const error = await response.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: { type: 'error', message: error.error || `Failed to toggle ${feature}` }
          }));
        }
      }
    } catch (error) {
      console.error(`Failed to toggle ${feature}:`, error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: { type: 'error', message: `Failed to toggle ${feature}. Please try again.` }
        }));
      }
    }
  };

  const runManualRefactor = async () => {
    try {
      const response = await fetch('/api/beast-mode/janitor/refactor', {
        method: 'POST'
      });
      if (response.ok) {
        loadJanitorStatus();
      }
    } catch (error) {
      console.error('Failed to run refactor:', error);
    }
  };

  if (loading || !status) {
    return (
      <div className="p-6">
        <LoadingState message="Loading Day 2 Operations status..." />
      </div>
    );
  }

  return (
    <JanitorErrorBoundary>
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* Onboarding */}
        {showOnboarding && (
          <JanitorOnboarding
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.setItem('janitor-onboarding-seen', 'true');
            }}
          />
        )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🧹 Day 2 Operations
            </h1>
            <p className="text-slate-400">
              The AI Janitor that works while you sleep
            </p>
          </div>
          <div className="flex items-center gap-4">
            <JanitorStatusIndicator status={status} />
            <Button
              onClick={() => toggleFeature('enabled', !status.enabled)}
              className={status.enabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {status.enabled ? 'Disable' : 'Enable'} Janitor
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <JanitorNotifications />
        </div>
        <div>
          <JanitorQuickActions
            onManualRefactor={runManualRefactor}
            onCreateTest={() => setShowTestCreator(true)}
            onViewHistory={() => setShowHistory(true)}
            onViewRules={() => {
              setActiveFeature('architectureEnforcement');
              setShowRules(true);
            }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {status.silentRefactoring.issuesFixed}
            </div>
            <div className="text-sm text-slate-400">Issues Fixed (Overnight)</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {status.architectureEnforcement.violationsBlocked}
            </div>
            <div className="text-sm text-slate-400">Violations Blocked</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-cyan-400 mb-1">
              {status.repoMemory.graphSize}
            </div>
            <div className="text-sm text-slate-400">Repo Memory Nodes</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {status.vibeOps.testsRun}
            </div>
            <div className="text-sm text-slate-400">Vibe Ops Tests</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Silent Refactoring */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🧹 Silent Refactoring
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Overnight code cleanup (2 AM - 6 AM)
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.silentRefactoring.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('silentRefactoring', !status.silentRefactoring.enabled)}
              >
                {status.silentRefactoring.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Overnight Mode</span>
              <Badge variant={status.silentRefactoring.overnightMode ? "default" : "secondary"}>
                {status.silentRefactoring.overnightMode ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Run</span>
              <span className="text-slate-300">
                {status.silentRefactoring.lastRun 
                  ? new Date(status.silentRefactoring.lastRun).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Issues Fixed</span>
              <span className="text-purple-400 font-semibold">{status.silentRefactoring.issuesFixed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">PRs Created</span>
              <span className="text-cyan-400 font-semibold">{status.silentRefactoring.prsCreated}</span>
            </div>
            <Button
              variant="outline"
              className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              onClick={runManualRefactor}
            >
              Run Manual Refactor
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-slate-400"
                onClick={() => {
                  setActiveFeature('silentRefactoring');
                  setShowConfigModal(true);
                }}
              >
                Configure →
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-slate-400"
                onClick={() => setShowHistory(true)}
              >
                History →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Enforcement */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🛡️ Architecture Enforcement
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Pre-commit hooks & pattern blocking
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.architectureEnforcement.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('architectureEnforcement', !status.architectureEnforcement.enabled)}
              >
                {status.architectureEnforcement.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Violations Blocked</span>
              <span className="text-blue-400 font-semibold">{status.architectureEnforcement.violationsBlocked}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Check</span>
              <span className="text-slate-300">
                {status.architectureEnforcement.lastCheck
                  ? new Date(status.architectureEnforcement.lastCheck).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
              <div className="font-semibold mb-1">Active Rules:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Blocks secrets in code</li>
                <li>Prevents DB logic in frontend</li>
                <li>Enforces separation of concerns</li>
                <li>Auto-fixes common patterns</li>
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-400"
              onClick={() => {
                setActiveFeature('architectureEnforcement');
                setShowRules(true);
              }}
            >
              View Rules →
            </Button>
          </CardContent>
        </Card>

        {/* Vibe Restoration */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  ⏮️ Vibe Restoration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Detect & restore regressions
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.vibeRestoration.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('vibeRestoration', !status.vibeRestoration.enabled)}
              >
                {status.vibeRestoration.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Regressions Detected</span>
              <span className="text-green-400 font-semibold">{status.vibeRestoration.regressionsDetected}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Restore</span>
              <span className="text-slate-300">
                {status.vibeRestoration.lastRestore
                  ? new Date(status.vibeRestoration.lastRestore).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
              <div className="font-semibold mb-1">Status:</div>
              <div className="text-xs text-green-400">✓ Code state tracking active</div>
              <div className="text-xs text-green-400">✓ Regression detection enabled</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-400"
              onClick={() => setShowRestorationHistory(true)}
            >
              View History →
            </Button>
          </CardContent>
        </Card>

        {/* Repo Memory */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🧠 Repo-Level Memory
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Semantic graph of your codebase
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.repoMemory.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('repoMemory', !status.repoMemory.enabled)}
              >
                {status.repoMemory.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Graph Size</span>
              <span className="text-indigo-400 font-semibold">{status.repoMemory.graphSize} nodes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Update</span>
              <span className="text-slate-300">
                {status.repoMemory.lastUpdate
                  ? new Date(status.repoMemory.lastUpdate).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
              <div className="font-semibold mb-1">Capabilities:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Architecture understanding</li>
                <li>Context preservation</li>
                <li>Dependency tracking</li>
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-400"
              onClick={() => setShowGraph(true)}
            >
              View Graph →
            </Button>
          </CardContent>
        </Card>

        {/* Vibe Ops */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🤖 Vibe Ops
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Test in plain English
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.vibeOps.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('vibeOps', !status.vibeOps.enabled)}
              >
                {status.vibeOps.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Tests Run</span>
              <span className="text-cyan-400 font-semibold">{status.vibeOps.testsRun}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Test</span>
              <span className="text-slate-300">
                {status.vibeOps.lastTest
                  ? new Date(status.vibeOps.lastTest).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
              <div className="font-semibold mb-1">Example Test:</div>
              <div className="text-xs italic">"User can login and see dashboard"</div>
            </div>
            <Button
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => setShowTestCreator(true)}
            >
              Create Test →
            </Button>
          </CardContent>
        </Card>

        {/* Invisible CI/CD */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  👻 Invisible CI/CD
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Silent linting & security scanning
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant={status.invisibleCICD.enabled ? "default" : "outline"}
                onClick={() => toggleFeature('invisibleCICD', !status.invisibleCICD.enabled)}
              >
                {status.invisibleCICD.enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Scans Run</span>
              <span className="text-orange-400 font-semibold">{status.invisibleCICD.scansRun}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Issues Found</span>
              <span className="text-red-400 font-semibold">{status.invisibleCICD.issuesFound}</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300">
              <div className="font-semibold mb-1">Running:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Background linting</li>
                <li>Security scanning</li>
                <li>Auto-fix violations</li>
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-400"
              onClick={() => setShowCICDLogs(true)}
            >
              View Logs →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showConfigModal && activeFeature && (
        <JanitorConfigModal
          feature={activeFeature}
          onClose={() => {
            setShowConfigModal(false);
            setActiveFeature(null);
          }}
          onSave={async (config) => {
            if (!activeFeature) return;
            
            try {
              // Convert camelCase to kebab-case for API
              const featureName = activeFeature
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
              
              const response = await fetch(`/api/beast-mode/janitor/${featureName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: config.enabled, config: config.config || {} })
              });
              if (response.ok) {
                await loadJanitorStatus();
                setShowConfigModal(false);
                setActiveFeature(null);
              } else {
                const error = await response.json();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('beast-mode-notification', {
                    detail: { type: 'error', message: error.error || 'Failed to save configuration' }
                  }));
                }
              }
            } catch (error) {
              console.error('Failed to save config:', error);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('beast-mode-notification', {
                  detail: { type: 'error', message: 'Failed to save configuration. Please try again.' }
                }));
              }
            }
          }}
        />
      )}

      {showTestCreator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTestCreator(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full">
            <VibeOpsTestCreator
              onTestCreated={(test) => {
                console.log('Test created:', test);
                setShowTestCreator(false);
                loadJanitorStatus();
              }}
              onClose={() => setShowTestCreator(false)}
            />
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <RefactoringHistory />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowHistory(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRules(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ArchitectureRulesView />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowRules(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showGraph && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowGraph(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <RepoMemoryGraph />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowGraph(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRestorationHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRestorationHistory(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <VibeRestorationHistory />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowRestorationHistory(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCICDLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCICDLogs(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <InvisibleCICDLogs />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowCICDLogs(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </JanitorErrorBoundary>
  );
}

