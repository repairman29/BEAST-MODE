"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import BeastModeStatusBar from './BeastModeStatusBar';
import NotificationWidget, { Notification } from '../hud/NotificationWidget';
import ConversationalAI from './ConversationalAI';
import HealthDashboard from './HealthDashboard';
import AIRecommendations from './AIRecommendations';
import MonetizationDashboard from './MonetizationDashboard';
import MissionDashboard from './MissionDashboard';
import DeploymentDashboard from './DeploymentDashboard';
import GitHubScanForm from './GitHubScanForm';
import AuthSection from './AuthSection';
import PricingSection from './PricingSection';
import SelfImprovement from './SelfImprovement';
import QuickActions from './QuickActions';

/**
 * BEAST MODE Enterprise Dashboard
 *
 * Advanced quality intelligence & marketplace platform
 */
function BeastModeDashboardInner() {
  const [beastModeState, setBeastModeState] = useState({
    quality: {
      score: 87,
      issues: 12,
      improvements: 8,
      lastScan: new Date().toISOString()
    },
    intelligence: {
      predictions: 15,
      insights: 23,
      optimizations: 7,
      accuracy: 94
    },
    marketplace: {
      plugins: 45,
      integrations: 12,
      downloads: 1250,
      revenue: 8750
    },
    enterprise: {
      teams: 8,
      repositories: 23,
      users: 156,
      uptime: 99.7,
      oracleStatus: 'operational',
      daisyChainStatus: 'operational',
      conversationalAIStatus: 'operational',
      healthMonitorStatus: 'operational',
      missionGuidanceStatus: 'operational',
      deploymentOrchestratorStatus: 'operational',
      aiSystems: 9,
      integrations: 13
    },
    messages: [] as any[],
    notifications: [] as Notification[]
  });

  const [commandInput, setCommandInput] = useState('');
  const [currentView, setCurrentView] = useState<'quality' | 'intelligence' | 'marketplace' | 'enterprise' | 'health' | 'ai-recommendations' | 'monetization' | 'missions' | 'deployments' | 'github-scan' | 'auth' | 'pricing' | 'self-improve' | null>('quality');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');

  // Add notification helper
  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    setBeastModeState(prev => ({
      ...prev,
      notifications: [...prev.notifications, {
        id: Date.now().toString(),
        type,
        message,
        duration: 5000
      }]
    }));
  };

  // Add message to intelligence log
  const addMessage = (text: string, type: 'user' | 'ai' | 'system' = 'system') => {
    setBeastModeState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        text,
        type
      }]
    }));
  };

  // Handle command input
  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const command = commandInput.trim();
    addMessage(command, 'user');
    setCommandInput('');

    // Simulate BEAST MODE AI processing
    setTimeout(() => {
      if (command.toLowerCase().includes('quality')) {
        addMessage(`Quality analysis complete. Score: ${beastModeState.quality.score}/100. Found ${beastModeState.quality.issues} issues, ${beastModeState.quality.improvements} improvement opportunities.`, 'ai');
      } else if (command.toLowerCase().includes('intelligence')) {
        addMessage(`AI Intelligence active. Generated ${beastModeState.intelligence.predictions} predictions with ${beastModeState.intelligence.accuracy}% accuracy. ${beastModeState.intelligence.insights} insights available.`, 'ai');
      } else if (command.toLowerCase().includes('marketplace')) {
        addMessage(`Plugin marketplace operational. ${beastModeState.marketplace.plugins} plugins available, ${beastModeState.marketplace.downloads} total downloads, $${beastModeState.marketplace.revenue} revenue generated.`, 'ai');
      } else {
        addMessage(`BEAST MODE command processed: "${command}". Use keywords like "quality", "intelligence", or "marketplace" for specific insights.`, 'ai');
      }
    }, 1000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Toggle command palette
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Number keys: Quick view switching
      if (!isCommandPaletteOpen && !e.metaKey && !e.ctrlKey) {
        if (e.key === '1') setCurrentView('quality');
        if (e.key === '2') setCurrentView('intelligence');
        if (e.key === '3') setCurrentView('marketplace');
        if (e.key === '4') setCurrentView('enterprise');
        if (e.key === '5') setCurrentView('health');
        if (e.key === '6') setCurrentView('ai-recommendations');
        if (e.key === '7') setCurrentView('monetization');
        if (e.key === '8') setCurrentView('missions');
        if (e.key === '9') setCurrentView('deployments');
        if (e.key === '0') setCurrentView(null); // Minimal HUD
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Update time on client side only (prevents hydration mismatch)
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    
    // Set initial time
    updateTime();
    
    // Update every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Status Bar - Always visible */}
      <BeastModeStatusBar
        quality={beastModeState.quality}
        intelligence={beastModeState.intelligence}
        enterprise={beastModeState.enterprise}
        marketplace={beastModeState.marketplace}
      />

      {/* Notifications */}
      <NotificationWidget
        notifications={beastModeState.notifications}
        onDismiss={(id) => setBeastModeState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== id)
        }))}
      />

      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/80 backdrop-blur-md">
          <Card className="w-full max-w-2xl bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-xl mb-4 uppercase tracking-widest">
                Command Palette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Type a command or search..."
                className="w-full bg-slate-900 border-b border-slate-700 p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                autoFocus
              />
              <div className="mt-4 text-sm text-slate-400 space-y-2">
                <div>ESC: Close palette</div>
                <div>1: Quality • 2: Intelligence • 3: Marketplace • 4: Enterprise • 5: Health • 6: AI Recs • 7: Revenue • 8: Missions • 9: Deploy</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative h-full flex flex-col pt-20 pb-16 px-4 overflow-hidden">

        {/* Top Quick Actions */}
        <div className="absolute top-4 left-4 z-40 flex flex-wrap gap-2 max-w-[calc(100%-280px)]">
          <Button
            variant={currentView === 'quality' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('quality')}
            className={currentView === 'quality' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Quality
          </Button>
          <Button
            variant={currentView === 'intelligence' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('intelligence')}
            className={currentView === 'intelligence' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Intelligence
          </Button>
          <Button
            variant={currentView === 'marketplace' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('marketplace')}
            className={currentView === 'marketplace' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Marketplace
          </Button>
          <Button
            variant={currentView === 'enterprise' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('enterprise')}
            className={currentView === 'enterprise' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Enterprise
          </Button>
          <Button
            variant={currentView === 'health' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('health')}
            className={currentView === 'health' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Health
          </Button>
          <Button
            variant={currentView === 'ai-recommendations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('ai-recommendations')}
            className={currentView === 'ai-recommendations' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            AI Recs
          </Button>
          <Button
            variant={currentView === 'monetization' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('monetization')}
            className={currentView === 'monetization' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Revenue
          </Button>
          <Button
            variant={currentView === 'missions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('missions')}
            className={currentView === 'missions' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Missions
          </Button>
          <Button
            variant={currentView === 'deployments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('deployments')}
            className={currentView === 'deployments' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Deploy
          </Button>
          <Button
            variant={currentView === 'github-scan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('github-scan')}
            className={currentView === 'github-scan' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Scan Repo
          </Button>
          <Button
            variant={currentView === 'auth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('auth')}
            className={currentView === 'auth' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Sign In
          </Button>
          <Button
            variant={currentView === 'pricing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('pricing')}
            className={currentView === 'pricing' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Pricing
          </Button>
          <Button
            variant={currentView === 'self-improve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('self-improve')}
            className={currentView === 'self-improve' ? 'bg-white text-black hover:bg-slate-100' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
          >
            Improve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="border-slate-800 text-slate-400 hover:bg-slate-900"
          >
            ⌘ Palette
          </Button>
        </div>

        {/* Center Content - BEAST MODE Views */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto py-4">
          {currentView === null && (
            <div className="w-full max-w-4xl space-y-6">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">⚔️</div>
                <div className="text-sm uppercase tracking-widest text-white mb-2">BEAST MODE Active</div>
                <div className="text-xs text-slate-500">Press ESC for command palette</div>
              </div>
              <QuickActions
                onScanRepo={() => setCurrentView('github-scan')}
                onSignIn={() => setCurrentView('auth')}
                onPricing={() => setCurrentView('pricing')}
                onImprove={() => setCurrentView('self-improve')}
              />
            </div>
          )}

          {currentView === 'quality' && (
            <QualityView data={beastModeState.quality} />
          )}

          {currentView === 'intelligence' && (
            <IntelligenceView
              data={beastModeState.intelligence}
              messages={beastModeState.messages}
              onCommand={handleCommand}
              commandInput={commandInput}
              setCommandInput={setCommandInput}
            />
          )}

          {currentView === 'marketplace' && (
            <MarketplaceView data={beastModeState.marketplace} />
          )}

          {currentView === 'enterprise' && (
            <EnterpriseView data={beastModeState.enterprise} />
          )}

          {currentView === 'health' && (
            <HealthDashboard />
          )}

          {currentView === 'ai-recommendations' && (
            <AIRecommendations />
          )}

          {currentView === 'monetization' && (
            <MonetizationDashboard />
          )}

          {currentView === 'missions' && (
            <MissionDashboard />
          )}

          {currentView === 'deployments' && (
            <DeploymentDashboard />
          )}

          {currentView === 'github-scan' && (
            <GitHubScanForm />
          )}

          {currentView === 'auth' && (
            <AuthSection />
          )}

          {currentView === 'pricing' && (
            <PricingSection />
          )}

          {currentView === 'self-improve' && (
            <SelfImprovement />
          )}
        </div>

        {/* Bottom Status Line */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-black/50 backdrop-blur-sm border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <div className="flex gap-6 flex-wrap">
              <div>
                <span className="text-slate-500">SCORE:</span> <span className="text-white">{beastModeState.quality.score}/100</span>
              </div>
              <div>
                <span className="text-slate-500">ISSUES:</span> <span className="text-white">{beastModeState.quality.issues}</span>
              </div>
              <div>
                <span className="text-slate-500">UPTIME:</span> <span className="text-white">{beastModeState.enterprise.uptime}%</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500">BEAST:</span> <span className="text-white">{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chronicler View - AI Game Master Interface
 */
function ChroniclerView({
  messages,
  onCommand,
  commandInput,
  setCommandInput
}: any) {
  return (
    <HudPanel variant="elevated" corners glow="medium" className="w-full max-w-4xl h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-holo-amber-ghost">
        <div className="text-holo-amber text-lg uppercase tracking-widest">
          Chronicler AI
        </div>
        <div className="text-xs text-holo-amber-faint">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-holo-amber-dim py-12">
            <div className="text-4xl mb-3">◈</div>
            <div className="text-sm">Welcome back, Captain.</div>
            <div className="text-xs text-holo-amber-faint mt-2">
              What would you like to do?
            </div>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`
                ${msg.type === 'user' ? 'text-holo-cyan' : ''}
                ${msg.type === 'ai' ? 'text-holo-amber' : ''}
                ${msg.type === 'system' ? 'text-holo-amber-dim' : ''}
                text-sm leading-relaxed
              `}
            >
              <span className="text-holo-amber-ghost text-xs mr-2">
                {msg.type === 'user' ? '>' : msg.type === 'ai' ? '◈' : '•'}
              </span>
              {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={onCommand} className="flex gap-2">
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 bg-void-surface border-b border-holo-amber-faint px-3 py-2 text-holo-amber text-sm focus:outline-none focus:border-holo-amber transition-colors"
        />
        <HudButton variant="primary">
          Send
        </HudButton>
      </form>
    </HudPanel>
  );
}

/**
 * Tactical View - Combat & Ship Systems
 */
function TacticalView({ gameState }: any) {
  return (
    <div className="w-full max-w-6xl grid grid-cols-2 gap-4">
      {/* Ship Status */}
      <HudPanel corners glow="soft">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Ship Systems
        </div>
        <div className="space-y-2 text-sm">
          <StatLine label="Hull Integrity" value={gameState.ship.hull} max={100} />
          <StatLine label="Shield Power" value={gameState.ship.shields} max={100} />
          <StatLine label="Fuel Reserves" value={gameState.ship.fuel} max={100} />
          <StatLine label="Cargo Capacity" value={gameState.ship.cargo} max={100} />
        </div>
      </HudPanel>

      {/* Weapons */}
      <HudPanel corners glow="soft">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Weapons Array
        </div>
        <div className="space-y-2">
          <HudButton variant="secondary" className="w-full">
            Plasma Cannon [READY]
          </HudButton>
          <HudButton variant="secondary" className="w-full">
            Missile Bay [ARMED]
          </HudButton>
          <HudButton variant="ghost" className="w-full" disabled>
            EMP Device [OFFLINE]
          </HudButton>
        </div>
      </HudPanel>

      {/* Radar */}
      <HudPanel corners glow="soft" className="col-span-2">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Tactical Radar
        </div>
        <div className="aspect-square max-w-md mx-auto bg-void-surface/50 rounded-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-holo-amber-faint text-xs">
              NO CONTACTS
            </div>
          </div>
          {/* Radar rings */}
          <div className="absolute inset-[20%] border border-holo-amber-ghost rounded-full" />
          <div className="absolute inset-[40%] border border-holo-amber-ghost rounded-full" />
          <div className="absolute inset-[60%] border border-holo-amber-ghost rounded-full" />
        </div>
      </HudPanel>
    </div>
  );
}

/**
 * Operations View - Cargo, Economy, Trading
 */
function OperationsView({ gameState }: any) {
  return (
    <div className="w-full max-w-6xl">
      <HudPanel corners glow="medium" className="mb-4">
        <div className="text-holo-amber uppercase tracking-widest mb-4 text-lg">
          Operations Console
        </div>
        <div className="grid grid-cols-3 gap-4">
          <HudButton variant="primary">Market</HudButton>
          <HudButton variant="primary">Cargo Hold</HudButton>
          <HudButton variant="primary">Missions</HudButton>
          <HudButton variant="secondary">Crew</HudButton>
          <HudButton variant="secondary">Ship Upgrades</HudButton>
          <HudButton variant="secondary">Territory</HudButton>
        </div>
      </HudPanel>

      <div className="grid grid-cols-2 gap-4">
        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            Active Contracts
          </div>
          <div className="text-sm text-holo-amber-dim">
            No active contracts
          </div>
        </HudPanel>

        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            Economic Alerts
          </div>
          <div className="text-sm text-holo-green">
            Spice prices up 15% in Sector 4
          </div>
        </HudPanel>
      </div>
    </div>
  );
}

/**
 * Stat display helper
 */
function StatLine({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  const color = percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>{label}</span>
        <span className="text-white font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Quality View - Code Quality Analysis Dashboard
 */
function QualityView({ data }: any) {
  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
      {/* Quality Score */}
      <Card className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all">
        <CardHeader>
          <CardTitle className="text-white text-lg mb-4">Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-gradient-cyan mb-2">{data.score}</div>
            <div className="text-sm text-slate-500">/100</div>
          </div>
          <div className="space-y-3">
            <StatLine label="Issues Found" value={data.issues} max={50} />
            <StatLine label="Improvements" value={data.improvements} max={20} />
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all">
        <CardHeader>
          <CardTitle className="text-white text-lg mb-4">Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Logger Infra</span>
              <span className="text-green-400 font-semibold">25/25 ✓</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Supabase Safety</span>
              <span className="text-amber-400 font-semibold">18/20 ⚠</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cross-Platform</span>
              <span className="text-green-400 font-semibold">20/20 ✓</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Oracle Insights</span>
              <span className="text-cyan-400 font-semibold">🧠 Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Bug Detection</span>
              <span className="text-cyan-400 font-semibold">🐛 Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="col-span-1 md:col-span-2 bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all">
        <CardHeader>
          <CardTitle className="text-white text-lg mb-4">Recent Quality Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-300">Main Application</span>
              <span className="text-green-400 font-semibold">✓ Passed</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-300">BEAST MODE Core</span>
              <span className="text-green-400 font-semibold">✓ Passed</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-300">Plugin System</span>
              <span className="text-amber-400 font-semibold">⚠ 2 Issues</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Intelligence View - AI Insights & Analytics
 */
function IntelligenceView({ data, messages, onCommand, commandInput, setCommandInput }: any) {
  return (
    <HudPanel variant="elevated" corners glow="medium" className="w-full max-w-4xl h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-holo-amber-ghost">
        <div className="text-holo-amber text-lg uppercase tracking-widest">
          AI Intelligence Core
        </div>
        <div className="text-xs text-holo-amber-faint">
          {messages.length} insights • {data.accuracy}% accuracy
        </div>
      </div>

      {/* Intelligence Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-holo-cyan">{data.predictions}</div>
          <div className="text-xs text-holo-amber-dim">Predictions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-holo-cyan">{data.insights}</div>
          <div className="text-xs text-holo-amber-dim">Insights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-holo-cyan">{data.optimizations}</div>
          <div className="text-xs text-holo-amber-dim">Optimizations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-holo-green">{data.accuracy}%</div>
          <div className="text-xs text-holo-amber-dim">Accuracy</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-holo-amber-dim py-12">
            <div className="text-4xl mb-3">🧠</div>
            <div className="text-sm">AI Intelligence Core Active</div>
            <div className="text-xs text-holo-amber-faint mt-2">
              Ready for analysis and insights
            </div>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`
                ${msg.type === 'user' ? 'text-holo-cyan' : ''}
                ${msg.type === 'ai' ? 'text-holo-amber' : ''}
                ${msg.type === 'system' ? 'text-holo-amber-dim' : ''}
                text-sm leading-relaxed
              `}
            >
              <span className="text-holo-amber-ghost text-xs mr-2">
                {msg.type === 'user' ? '>' : msg.type === 'ai' ? '🧠' : '•'}
              </span>
              {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={onCommand} className="flex gap-2">
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Ask AI for insights..."
          className="flex-1 bg-void-surface border-b border-holo-amber-faint px-3 py-2 text-holo-amber text-sm focus:outline-none focus:border-holo-amber transition-colors"
        />
        <HudButton variant="primary">
          Analyze
        </HudButton>
      </form>
    </HudPanel>
  );
}

/**
 * Marketplace View - Plugin Ecosystem
 */
function MarketplaceView({ data }: any) {
  return (
    <div className="w-full max-w-6xl">
      <HudPanel corners glow="medium" className="mb-4">
        <div className="text-holo-amber uppercase tracking-widest mb-4 text-lg">
          Plugin Marketplace
        </div>
        <div className="grid grid-cols-3 gap-4">
          <HudButton variant="primary">Quality Plugins</HudButton>
          <HudButton variant="primary">Integration Hub</HudButton>
          <HudButton variant="primary">Tool Discovery</HudButton>
          <HudButton variant="secondary">Monetization</HudButton>
          <HudButton variant="secondary">Developer Portal</HudButton>
          <HudButton variant="secondary">Plugin Analytics</HudButton>
        </div>
      </HudPanel>

      <div className="grid grid-cols-2 gap-4">
        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            Marketplace Stats
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Plugins</span>
              <span className="text-holo-cyan">{data.plugins}</span>
            </div>
            <div className="flex justify-between">
              <span>Integrations</span>
              <span className="text-holo-cyan">{data.integrations}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Downloads</span>
              <span className="text-holo-cyan">{data.downloads.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Revenue Generated</span>
              <span className="text-holo-green">${data.revenue.toLocaleString()}</span>
            </div>
          </div>
        </HudPanel>

        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            Popular Plugins
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>ESLint Pro</span>
              <span className="text-holo-green">⭐ 4.8</span>
            </div>
            <div className="flex justify-between items-center">
              <span>TypeScript Guardian</span>
              <span className="text-holo-green">⭐ 4.9</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Security Scanner</span>
              <span className="text-holo-green">⭐ 4.7</span>
            </div>
          </div>
        </HudPanel>
      </div>
    </div>
  );
}

/**
 * Enterprise View - Enterprise Features & Analytics
 */
function EnterpriseView({ data }: any) {
  return (
    <div className="w-full max-w-6xl">
      <HudPanel corners glow="medium" className="mb-4">
        <div className="text-holo-amber uppercase tracking-widest mb-4 text-lg">
          Enterprise Dashboard
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-holo-cyan">{data.teams}</div>
            <div className="text-sm text-holo-amber-dim">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-holo-cyan">{data.repositories}</div>
            <div className="text-sm text-holo-amber-dim">Repositories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-holo-cyan">{data.users}</div>
            <div className="text-sm text-holo-amber-dim">Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-holo-green">{data.uptime}%</div>
            <div className="text-sm text-holo-amber-dim">Uptime</div>
          </div>
        </div>
      </HudPanel>

      <div className="grid grid-cols-2 gap-4">
        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            Enterprise Features
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-holo-green">✓</span>
              <span>SSO Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-holo-green">✓</span>
              <span>Advanced Reporting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-holo-green">✓</span>
              <span>White-label Solutions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-holo-green">✓</span>
              <span>Dedicated Support</span>
            </div>
          </div>
        </HudPanel>

        <HudPanel corners>
          <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
            AI Systems Health
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>BEAST MODE Core</span>
              <span className="text-holo-green">Operational</span>
            </div>
            <div className="flex justify-between">
              <span>Oracle AI</span>
              <span className={`text-${data.oracleStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.oracleStatus === 'operational' ? 'Connected' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Daisy Chain</span>
              <span className={`text-${data.daisyChainStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.daisyChainStatus === 'operational' ? 'Orchestrating' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversational AI</span>
              <span className={`text-${data.conversationalAIStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.conversationalAIStatus === 'operational' ? 'Chat Ready' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Health Monitor</span>
              <span className={`text-${data.healthMonitorStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.healthMonitorStatus === 'operational' ? 'Monitoring' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mission Guidance</span>
              <span className={`text-${data.missionGuidanceStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.missionGuidanceStatus === 'operational' ? 'Guiding' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deployment Orchestrator</span>
              <span className={`text-${data.deploymentOrchestratorStatus === 'operational' ? 'holo-green' : 'holo-amber'}`}>
                {data.deploymentOrchestratorStatus === 'operational' ? 'Deploying' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>AI Systems</span>
              <span className="text-holo-cyan">{data.aiSystems}/9 Active</span>
            </div>
            <div className="flex justify-between">
              <span>Code Roach</span>
              <span className="text-holo-green">Operational</span>
            </div>
            <div className="flex justify-between">
              <span>Integrations</span>
              <span className="text-holo-cyan">{data.integrations} Connected</span>
            </div>
          </div>
        </HudPanel>
      </div>

      {/* Conversational AI Interface */}
      <ConversationalAI />
    </div>
  );
}

/**
 * Main export - BEAST MODE Dashboard
 */
export default function BeastModeDashboard() {
  return <BeastModeDashboardInner />;
}
