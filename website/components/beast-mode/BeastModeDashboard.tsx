"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';
import NotificationWidget, { Notification } from '../hud/NotificationWidget';
import ConversationalAI from './ConversationalAI';
import HealthDashboard from './HealthDashboard';
import AIRecommendations from './AIRecommendations';
import MonetizationDashboard from './MonetizationDashboard';
import MissionDashboard from './MissionDashboard';
import DeploymentDashboard from './DeploymentDashboard';

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
  const [currentView, setCurrentView] = useState<'quality' | 'intelligence' | 'marketplace' | 'enterprise' | 'health' | 'ai-recommendations' | 'monetization' | 'missions' | 'deployments' | null>('quality');
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
    <div className="relative w-screen h-screen bg-void overflow-hidden font-mono">
      {/* Background ambient effects */}
      <div className="absolute inset-0 bg-gradient-radial from-holo-amber/5 via-transparent to-transparent pointer-events-none" />

      {/* Status Bar - Always visible */}
      <StatusBar
        player={{
          health: beastModeState.quality.score,
          maxHealth: 100,
          shields: beastModeState.intelligence.accuracy,
          maxShields: 100,
          credits: beastModeState.marketplace.revenue
        }}
        ship={{
          hull: beastModeState.enterprise.uptime,
          fuel: beastModeState.intelligence.insights
        }}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-void/80 backdrop-blur-overlay">
          <HudPanel variant="elevated" corners glow="bright" className="w-full max-w-2xl">
            <div className="text-holo-amber text-xl mb-4 uppercase tracking-widest">
              Command Palette
            </div>
            <input
              type="text"
              placeholder="Type a command or search..."
              className="w-full bg-void-surface border-b border-holo-amber-faint p-3 text-holo-amber focus:outline-none focus:border-holo-amber"
              autoFocus
            />
            <div className="mt-4 text-sm text-holo-amber-dim space-y-2">
              <div>ESC: Close palette</div>
              <div>1: Quality • 2: Intelligence • 3: Marketplace • 4: Enterprise • 5: Health • 6: AI Recs • 7: Revenue • 8: Missions • 9: Deploy • 0: Minimal HUD</div>
            </div>
          </HudPanel>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative h-full flex flex-col pt-4 pb-4">

        {/* Top Quick Actions */}
        <div className="absolute top-4 left-4 z-40 flex gap-2">
          <HudButton
            variant={currentView === 'quality' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('quality')}
          >
            Quality
          </HudButton>
          <HudButton
            variant={currentView === 'intelligence' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('intelligence')}
          >
            Intelligence
          </HudButton>
          <HudButton
            variant={currentView === 'marketplace' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('marketplace')}
          >
            Marketplace
          </HudButton>
          <HudButton
            variant={currentView === 'enterprise' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('enterprise')}
          >
            Enterprise
          </HudButton>
          <HudButton
            variant={currentView === 'health' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('health')}
          >
            Health
          </HudButton>
          <HudButton
            variant={currentView === 'ai-recommendations' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('ai-recommendations')}
          >
            AI Recs
          </HudButton>
          <HudButton
            variant={currentView === 'monetization' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('monetization')}
          >
            Revenue
          </HudButton>
          <HudButton
            variant={currentView === 'missions' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('missions')}
          >
            Missions
          </HudButton>
          <HudButton
            variant={currentView === 'deployments' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('deployments')}
          >
            Deploy
          </HudButton>
          <HudButton
            variant="ghost"
            size="sm"
            onClick={() => setIsCommandPaletteOpen(true)}
          >
            ⌘ Palette
          </HudButton>
        </div>

        {/* Center Content - BEAST MODE Views */}
        <div className="flex-1 flex items-center justify-center px-4">
          {currentView === null && (
            <div className="text-center text-holo-amber-faint">
              <div className="text-6xl mb-4">⚔️</div>
              <div className="text-sm uppercase tracking-widest">BEAST MODE Active</div>
              <div className="text-xs mt-2">Press ESC for command palette</div>
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
        </div>

        {/* Bottom Status Line */}
        <div className="px-4">
          <div className="flex items-center justify-between text-xs text-holo-amber-faint border-t border-holo-amber-ghost pt-2">
            <div className="flex gap-6">
              <div>
                <span className="text-holo-amber-ghost">SCORE:</span> {beastModeState.quality.score}/100
              </div>
              <div>
                <span className="text-holo-amber-ghost">ISSUES:</span> {beastModeState.quality.issues}
              </div>
              <div>
                <span className="text-holo-amber-ghost">UPTIME:</span> {beastModeState.enterprise.uptime}%
              </div>
            </div>
            <div>
              <span className="text-holo-amber-ghost">BEAST:</span> {currentTime}
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
  const color = percentage > 60 ? 'bg-holo-green' : percentage > 30 ? 'bg-holo-amber' : 'bg-holo-red';

  return (
    <div>
      <div className="flex justify-between text-xs text-holo-amber-faint mb-1">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1 bg-void-surface rounded-full overflow-hidden">
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
    <div className="w-full max-w-6xl grid grid-cols-2 gap-4">
      {/* Quality Score */}
      <HudPanel corners glow="soft">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Quality Score
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-holo-amber mb-2">{data.score}</div>
          <div className="text-sm text-holo-amber-dim">/100</div>
        </div>
        <div className="mt-4 space-y-2">
          <StatLine label="Issues Found" value={data.issues} max={50} />
          <StatLine label="Improvements" value={data.improvements} max={20} />
        </div>
      </HudPanel>

      {/* Quality Metrics */}
      <HudPanel corners glow="soft">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Quality Metrics
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-holo-amber-dim">Logger Infra</span>
            <span className="text-holo-green">25/25 ✓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-holo-amber-dim">Supabase Safety</span>
            <span className="text-holo-amber">18/20 ⚠</span>
          </div>
          <div className="flex justify-between">
            <span className="text-holo-amber-dim">Cross-Platform</span>
            <span className="text-holo-green">20/20 ✓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-holo-amber-dim">Oracle Insights</span>
            <span className="text-holo-cyan">🧠 Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-holo-amber-dim">Bug Detection</span>
            <span className="text-holo-cyan">🐛 Active</span>
          </div>
        </div>
      </HudPanel>

      {/* Recent Scans */}
      <HudPanel corners glow="soft" className="col-span-2">
        <div className="text-holo-amber uppercase tracking-widest mb-3 text-sm">
          Recent Quality Scans
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Main Application</span>
            <span className="text-holo-green">✓ Passed</span>
          </div>
          <div className="flex justify-between items-center">
            <span>BEAST MODE Core</span>
            <span className="text-holo-green">✓ Passed</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Plugin System</span>
            <span className="text-holo-amber">⚠ 2 Issues</span>
          </div>
        </div>
      </HudPanel>
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
