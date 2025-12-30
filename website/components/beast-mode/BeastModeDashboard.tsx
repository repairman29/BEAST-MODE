"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import FTUEOnboarding from './FTUEOnboarding';
import { useUser } from '../../lib/user-context';

/**
 * BEAST MODE Enterprise Dashboard
 *
 * Advanced quality intelligence & marketplace platform
 */
interface BeastModeDashboardInnerProps {
  initialView?: string | null;
}

function BeastModeDashboardInner({ initialView }: BeastModeDashboardInnerProps) {
  const { user, isFirstTime, setUser, signOut, completeOnboarding, isLoading: userLoading } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for first-time users
  useEffect(() => {
    if (!userLoading && isFirstTime && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [isFirstTime, userLoading, showOnboarding]);

  // Handle auth success from AuthSection
  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  // Handle initial view from URL params
  useEffect(() => {
    if (initialView) {
      const validViews = ['quality', 'intelligence', 'marketplace', 'enterprise', 'health', 'ai-recommendations', 'monetization', 'missions', 'deployments', 'github-scan', 'auth', 'pricing', 'self-improve'];
      if (validViews.includes(initialView)) {
        setCurrentView(initialView as typeof currentView);
      }
    }
  }, [initialView]);

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
  const [currentView, setCurrentView] = useState<'quality' | 'intelligence' | 'marketplace' | 'enterprise' | 'health' | 'ai-recommendations' | 'monetization' | 'missions' | 'deployments' | 'github-scan' | 'auth' | 'pricing' | 'self-improve' | null>(
    initialView === 'auth' ? 'auth' : initialView === 'pricing' ? 'pricing' : null
  );
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
      // Cmd/Ctrl + K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // ESC: Close command palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }

      // Number keys: Quick view switching (only when palette is closed and not typing)
      if (!isCommandPaletteOpen && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentView('quality');
        }
        if (e.key === '2') {
          e.preventDefault();
          setCurrentView('intelligence');
        }
        if (e.key === '3') {
          e.preventDefault();
          setCurrentView('marketplace');
        }
        if (e.key === '4') {
          e.preventDefault();
          setCurrentView('enterprise');
        }
        if (e.key === '5') {
          e.preventDefault();
          setCurrentView('health');
        }
        if (e.key === '6') {
          e.preventDefault();
          setCurrentView('ai-recommendations');
        }
        if (e.key === '7') {
          e.preventDefault();
          setCurrentView('monetization');
        }
        if (e.key === '8') {
          e.preventDefault();
          setCurrentView('missions');
        }
        if (e.key === '9') {
          e.preventDefault();
          setCurrentView('deployments');
        }
        if (e.key === '0') {
          e.preventDefault();
          setCurrentView(null);
        }
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
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden flex">
      {/* FTUE Onboarding */}
      {showOnboarding && (
        <FTUEOnboarding
          onComplete={() => {
            setShowOnboarding(false);
            completeOnboarding();
          }}
          onSkip={() => {
            setShowOnboarding(false);
            completeOnboarding();
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as typeof currentView)}
        onCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Dashboard Header */}
      <DashboardHeader user={user} onSignOut={signOut} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300 ease-in-out relative pt-16 z-0">
        {/* Background ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] z-0"></div>

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
          <div 
            className="fixed inset-0 z-[200] flex items-start justify-center pt-32 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCommandPaletteOpen(false);
              }
            }}
          >
            <Card className="w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader>
                <CardTitle className="text-white text-xl mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span>⌘</span>
                  <span>Command Palette</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsCommandPaletteOpen(false);
                    }
                  }}
                />
                <div className="mt-6 text-sm text-slate-400 space-y-3">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">ESC</kbd>
                    <span>Close palette</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-slate-500">Quick nav:</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">1</kbd>
                    <span>Quality</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">2</kbd>
                    <span>Intelligence</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">3</kbd>
                    <span>Marketplace</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">⌘B</kbd>
                    <span>Toggle Sidebar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Center Content - BEAST MODE Views */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto py-6 px-6 pt-24 pb-20 custom-scrollbar relative z-20">
          {currentView === null && (
            <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300 relative z-30">
              <div className="text-center mb-12">
                <div className="text-7xl mb-6 animate-in zoom-in-95 duration-500">⚔️</div>
                <div className="text-lg uppercase tracking-widest text-white mb-3 font-bold">BEAST MODE Active</div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-white">⌘K</kbd> for command palette</div>
                  <div>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-white">⌘B</kbd> to toggle sidebar</div>
                </div>
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
            <div className="w-full max-w-6xl relative z-30">
              <QualityView data={beastModeState.quality} />
            </div>
          )}

          {currentView === 'intelligence' && (
            <div className="w-full max-w-6xl relative z-30">
              <IntelligenceView
                data={beastModeState.intelligence}
                messages={beastModeState.messages}
                onCommand={handleCommand}
                commandInput={commandInput}
                setCommandInput={setCommandInput}
              />
            </div>
          )}

          {currentView === 'marketplace' && (
            <div className="w-full max-w-6xl relative z-30">
              <MarketplaceView data={beastModeState.marketplace} />
            </div>
          )}

          {currentView === 'enterprise' && (
            <div className="w-full max-w-6xl relative z-30">
              <EnterpriseView data={beastModeState.enterprise} />
            </div>
          )}

          {currentView === 'health' && (
            <div className="w-full max-w-6xl relative z-30">
              <HealthDashboard />
            </div>
          )}

          {currentView === 'ai-recommendations' && (
            <div className="w-full max-w-6xl relative z-30">
              <AIRecommendations />
            </div>
          )}

          {currentView === 'monetization' && (
            <div className="w-full max-w-6xl relative z-30">
              <MonetizationDashboard />
            </div>
          )}

          {currentView === 'missions' && (
            <div className="w-full max-w-6xl relative z-30">
              <MissionDashboard />
            </div>
          )}

          {currentView === 'deployments' && (
            <div className="w-full max-w-6xl relative z-30">
              <DeploymentDashboard />
            </div>
          )}

          {currentView === 'github-scan' && (
            <div className="w-full max-w-6xl relative z-30">
              <GitHubScanForm />
            </div>
          )}

          {currentView === 'auth' && (
            <div className="w-full max-w-md relative z-30">
              <AuthSection onAuthSuccess={handleAuthSuccess} />
            </div>
          )}

          {currentView === 'pricing' && (
            <div className="w-full max-w-6xl relative z-30">
              <PricingSection />
            </div>
          )}

          {currentView === 'self-improve' && (
            <div className="w-full max-w-6xl relative z-30">
              <SelfImprovement />
            </div>
          )}
        </div>

        {/* Bottom Status Line */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/60 backdrop-blur-md border-t border-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SCORE:</span>
                <span className="text-white font-semibold">{beastModeState.quality.score}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">ISSUES:</span>
                <span className="text-white font-semibold">{beastModeState.quality.issues}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">UPTIME:</span>
                <span className="text-green-400 font-semibold">{beastModeState.enterprise.uptime}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">BEAST:</span>
              <span className="text-cyan-400 font-mono font-semibold">{currentTime}</span>
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
    <Card className="bg-slate-900/90 border-slate-800 w-full max-w-4xl h-[70vh] flex flex-col">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg uppercase tracking-widest">
            Chronicler AI
          </CardTitle>
          <div className="text-xs text-slate-500">
            {messages.length} messages
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <div className="text-4xl mb-3">◈</div>
              <div className="text-sm">Welcome back.</div>
              <div className="text-xs text-slate-600 mt-2">
                What would you like to do?
              </div>
            </div>
          ) : (
            messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`
                  ${msg.type === 'user' ? 'text-cyan-400' : ''}
                  ${msg.type === 'ai' ? 'text-white' : ''}
                  ${msg.type === 'system' ? 'text-slate-500' : ''}
                  text-sm leading-relaxed
                `}
              >
                <span className="text-slate-600 text-xs mr-2">
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
            className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors rounded-lg"
          />
        <Button type="submit" className="bg-white text-black hover:bg-slate-100">
          Send
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}

/**
 * Tactical View - Combat & Ship Systems
 */
function TacticalView({ gameState }: any) {
  return (
    <div className="w-full max-w-6xl grid grid-cols-2 gap-4">
      {/* Ship Status */}
      <Card className="bg-slate-900/90 border-slate-800">
        <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
          Ship Systems
        </div>
        <div className="space-y-2 text-sm">
          <StatLine label="Hull Integrity" value={gameState.ship.hull} max={100} />
          <StatLine label="Shield Power" value={gameState.ship.shields} max={100} />
          <StatLine label="Fuel Reserves" value={gameState.ship.fuel} max={100} />
          <StatLine label="Cargo Capacity" value={gameState.ship.cargo} max={100} />
        </div>
      </Card>

      {/* Weapons */}
      <Card className="bg-slate-900/90 border-slate-800">
        <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
          Weapons Array
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full border-slate-800 text-slate-400 hover:bg-slate-900">
            Plasma Cannon [READY]
          </Button>
          <Button variant="outline" className="w-full border-slate-800 text-slate-400 hover:bg-slate-900">
            Missile Bay [ARMED]
          </Button>
          <Button variant="outline" className="w-full border-slate-800 text-slate-500" disabled>
            EMP Device [OFFLINE]
          </Button>
        </div>
      </Card>

      {/* Radar */}
      <Card className="bg-slate-900/90 border-slate-800 col-span-2">
        <CardHeader>
          <CardTitle className="text-white uppercase tracking-widest text-sm">
            Tactical Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square max-w-md mx-auto bg-slate-900/50 rounded-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-500 text-xs">
                NO CONTACTS
              </div>
            </div>
            {/* Radar rings */}
            <div className="absolute inset-[20%] border border-slate-700 rounded-full" />
            <div className="absolute inset-[40%] border border-slate-700 rounded-full" />
            <div className="absolute inset-[60%] border border-slate-700 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Operations View - Cargo, Economy, Trading
 */
function OperationsView({ gameState }: any) {
  return (
    <div className="w-full max-w-6xl">
      <Card className="bg-slate-900/90 border-slate-800 mb-4">
        <div className="text-amber-400 uppercase tracking-widest mb-4 text-lg">
          Operations Console
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Button className="bg-white text-black hover:bg-slate-100">Market</Button>
          <Button className="bg-white text-black hover:bg-slate-100">Cargo Hold</Button>
          <Button className="bg-white text-black hover:bg-slate-100">Missions</Button>
          <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-900">Crew</Button>
          <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-900">Ship Upgrades</Button>
          <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-900">Territory</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
            Active Contracts
          </div>
          <div className="text-sm text-slate-400">
            No active contracts
          </div>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
            Economic Alerts
          </div>
          <div className="text-sm text-green-400">
            Spice prices up 15% in Sector 4
          </div>
        </Card>
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
  const [latestScan, setLatestScan] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Load latest scan from localStorage
    try {
      const stored = localStorage.getItem('beast-mode-scan-results');
      if (stored) {
        const scans = JSON.parse(stored);
        const completed = scans.find((s: any) => s.status === 'completed');
        if (completed) {
          setLatestScan(completed);
        }
      }
    } catch (e) {
      console.error('Failed to load scan results:', e);
    } finally {
      setIsLoading(false);
    }

    // Listen for new scans
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('beast-mode-scan-results');
        if (stored) {
          const scans = JSON.parse(stored);
          const completed = scans.find((s: any) => s.status === 'completed');
          if (completed) {
            setLatestScan(completed);
          }
        }
      } catch (e) {
        console.error('Failed to load scan results:', e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleScanNow = () => {
    // Navigate to GitHub scan tab
    window.location.href = '/dashboard?view=github-scan';
  };

  // Use latest scan data if available, otherwise fall back to props
  const qualityData = latestScan ? {
    score: latestScan.score || data.score,
    issues: latestScan.issues || data.issues,
    improvements: latestScan.improvements || data.improvements,
    lastScan: latestScan.timestamp || data.lastScan
  } : data;

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
      {/* Quality Score */}
      <Card className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-white text-lg">Quality Score</CardTitle>
            <Button
              onClick={handleScanNow}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Scan Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-gradient-cyan mb-2">{qualityData.score}</div>
            <div className="text-sm text-slate-500">/100</div>
            {latestScan && (
              <div className="text-xs text-slate-500 mt-2">
                Last scan: {latestScan.repo}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <StatLine label="Issues Found" value={qualityData.issues} max={50} />
            <StatLine label="Improvements" value={qualityData.improvements} max={20} />
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all">
        <CardHeader>
          <CardTitle className="text-white text-lg mb-4">Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {latestScan?.metrics ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Test Coverage</span>
                <span className={`font-semibold ${latestScan.metrics.coverage >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
                  {latestScan.metrics.coverage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Maintainability</span>
                <span className={`font-semibold ${latestScan.metrics.maintainability >= 80 ? 'text-green-400' : 'text-amber-400'}`}>
                  {latestScan.metrics.maintainability || 0}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Has Tests</span>
                <span className={`font-semibold ${latestScan.metrics.hasTests ? 'text-green-400' : 'text-red-400'}`}>
                  {latestScan.metrics.hasTests ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Has CI/CD</span>
                <span className={`font-semibold ${latestScan.metrics.hasCI ? 'text-green-400' : 'text-red-400'}`}>
                  {latestScan.metrics.hasCI ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Has Docker</span>
                <span className={`font-semibold ${latestScan.metrics.hasDocker ? 'text-green-400' : 'text-red-400'}`}>
                  {latestScan.metrics.hasDocker ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="col-span-1 md:col-span-2 bg-slate-900/90 border-slate-800 hover:border-slate-800 transition-all">
        <CardHeader>
          <CardTitle className="text-white text-lg mb-4">Recent Quality Scans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-slate-500 py-4">
              <div className="animate-spin mx-auto w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mb-2"></div>
              Loading scan results...
            </div>
          ) : latestScan ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <div>
                  <span className="text-slate-300 font-medium">{latestScan.repo}</span>
                  <div className="text-xs text-slate-500 mt-1">
                    {latestScan.timestamp ? new Date(latestScan.timestamp).toLocaleString() : 'Recently scanned'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${latestScan.score >= 80 ? 'text-green-400' : latestScan.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {latestScan.score}/100
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    {latestScan.issues} issues • {latestScan.improvements} improvements
                  </div>
                </div>
              </div>
              {latestScan.detectedIssues && latestScan.detectedIssues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-sm text-slate-400 mb-2">Top Issues:</div>
                  <div className="space-y-2">
                    {latestScan.detectedIssues.slice(0, 3).map((issue: any, idx: number) => (
                      <div key={idx} className="text-sm text-slate-300">
                        <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                          issue.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          issue.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {issue.priority}
                        </span>
                        {issue.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm mb-2">No scans yet</div>
              <div className="text-xs text-slate-600 mb-4">
                Scan a GitHub repository to see quality metrics
              </div>
              <Button
                onClick={handleScanNow}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Scan Repository
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Intelligence View - AI Insights & Analytics
 */
function IntelligenceView({ data, messages, onCommand, commandInput, setCommandInput }: any) {
  const [conversationMessages, setConversationMessages] = React.useState<any[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');

  const exampleQueries = [
    "What's the quality of my code?",
    "Suggest improvements for my project",
    "Run quality analysis",
    "What are the biggest risks?",
    "Generate insights for my repository",
    "Show me code quality trends"
  ];

  const handleExampleClick = (query: string) => {
    setAiInput(query);
    handleSendMessage(query);
  };

  const handleSendMessage = async (query?: string) => {
    const message = query || aiInput;
    if (!message.trim() || isProcessing) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      text: message,
      type: 'user',
      timestamp: new Date()
    };

    setConversationMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/beast-mode/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            conversationHistory: conversationMessages.slice(-5),
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const result = await response.json();

      const aiMsg = {
        id: `ai-${Date.now()}`,
        text: result.response || "I'm analyzing your request. This feature is being enhanced with real AI capabilities.",
        type: 'ai',
        timestamp: new Date()
      };

      setConversationMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Conversation error:', error);
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: "❌ Sorry, I encountered an error. Please try again or check your connection.",
        type: 'system',
        timestamp: new Date()
      };
      setConversationMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const displayMessages = conversationMessages.length > 0 ? conversationMessages : messages;

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Intelligence Metrics */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg uppercase tracking-widest">
            AI Intelligence Core
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.predictions}</div>
              <div className="text-xs text-slate-500">Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.insights}</div>
              <div className="text-xs text-slate-500">Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.optimizations}</div>
              <div className="text-xs text-slate-500">Optimizations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.accuracy}%</div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Conversation */}
      <Card className="bg-slate-900/90 border-slate-800 w-full h-[60vh] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-lg">AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Example Queries */}
          {displayMessages.length === 0 && (
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-3">💡 Try these queries:</div>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((query, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleExampleClick(query)}
                    variant="outline"
                    size="sm"
                    className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
            {displayMessages.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-4xl mb-3">🧠</div>
                <div className="text-sm">AI Intelligence Core Active</div>
                <div className="text-xs text-slate-600 mt-2">
                  Click a query above or type your own question
                </div>
              </div>
            ) : (
              displayMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`
                    p-3 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-500 ml-8' 
                        : msg.type === 'ai'
                        ? 'bg-purple-500/10 border-l-4 border-purple-500 mr-8'
                        : 'bg-slate-800/50 border-l-4 border-slate-600'
                    }
                  `}
                >
                  <div className={`text-sm leading-relaxed ${
                    msg.type === 'user' ? 'text-cyan-400' : 
                    msg.type === 'ai' ? 'text-white' : 
                    'text-slate-400'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="bg-purple-500/10 border-l-4 border-purple-500 mr-8 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <span className="text-purple-400 text-sm">Processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Command Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI for insights..."
              className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors rounded-lg"
              disabled={isProcessing}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!aiInput.trim() || isProcessing}
              className="bg-white text-black hover:bg-slate-100"
            >
              {isProcessing ? '⏳' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Marketplace View - Browse All Plugins
 */
function MarketplaceView({ data }: any) {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setIsLoading(true);
    try {
      // Use recommendations API to get plugins (marketplace API not available yet)
      const response = await fetch('/api/beast-mode/marketplace/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'marketplace-browse',
          projectContext: { type: 'all', languages: [] }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPlugins(result.recommendations || []);
      } else {
        // Fallback to mock data
        setPlugins([
          {
            pluginId: 'eslint-pro',
            plugin: {
              id: 'eslint-pro',
              name: 'ESLint Pro',
              description: 'Advanced ESLint rules and auto-fixes for modern JavaScript/TypeScript',
              category: 'quality',
              price: 0,
              rating: 4.8,
              downloads: 12500,
              languages: ['javascript', 'typescript'],
              tags: ['linting', 'code-quality']
            },
            score: 95,
            confidence: 0.92,
            reasons: ['Improves code quality', 'Widely adopted', 'Active maintenance']
          },
          {
            pluginId: 'typescript-guardian',
            plugin: {
              id: 'typescript-guardian',
              name: 'TypeScript Guardian',
              description: 'Enhanced TypeScript type checking and strict mode enforcement',
              category: 'quality',
              price: 0,
              rating: 4.9,
              downloads: 8900,
              languages: ['typescript'],
              tags: ['type-safety', 'typescript']
            },
            score: 94,
            confidence: 0.89,
            reasons: ['Strong type safety', 'Prevents runtime errors', 'Great DX']
          },
          {
            pluginId: 'security-scanner',
            plugin: {
              id: 'security-scanner',
              name: 'Security Scanner',
              description: 'Automated vulnerability detection and security best practices',
              category: 'security',
              price: 0,
              rating: 4.7,
              downloads: 15200,
              languages: ['javascript', 'typescript', 'python'],
              tags: ['security', 'vulnerability']
            },
            score: 91,
            confidence: 0.87,
            reasons: ['Critical for production', 'Regular updates', 'Comprehensive checks']
          },
          {
            pluginId: 'prettier-integration',
            plugin: {
              id: 'prettier-integration',
              name: 'Prettier Integration',
              description: 'Seamless code formatting with Prettier',
              category: 'integration',
              price: 0,
              rating: 4.6,
              downloads: 21000,
              languages: ['javascript', 'typescript', 'css', 'json'],
              tags: ['formatting', 'prettier']
            },
            score: 88,
            confidence: 0.85,
            reasons: ['Consistent formatting', 'Easy setup', 'Industry standard']
          },
          {
            pluginId: 'test-coverage',
            plugin: {
              id: 'test-coverage',
              name: 'Test Coverage Analyzer',
              description: 'Track and improve test coverage across your codebase',
              category: 'quality',
              price: 0,
              rating: 4.5,
              downloads: 6800,
              languages: ['javascript', 'typescript'],
              tags: ['testing', 'coverage']
            },
            score: 86,
            confidence: 0.83,
            reasons: ['Improves reliability', 'Identifies gaps', 'Visual reports']
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      // Keep empty array, will show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set());
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

  const installPlugin = async (pluginId: string) => {
    if (installingPlugins.has(pluginId) || installedPlugins.has(pluginId)) {
      return;
    }

    setInstallingPlugins(prev => new Set(prev).add(pluginId));

    try {
      const response = await fetch('/api/beast-mode/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId: typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || 'demo-user' : 'demo-user'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setInstalledPlugins(prev => new Set(prev).add(pluginId));
        // Show success notification
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `Plugin "${pluginId}" installed successfully!`
            }
          });
          window.dispatchEvent(event);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Installation failed');
      }
    } catch (error: any) {
      console.error('Failed to install plugin:', error);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: `Failed to install plugin: ${error.message || 'Unknown error'}`
          }
        });
        window.dispatchEvent(event);
      }
    } finally {
      setInstallingPlugins(prev => {
        const next = new Set(prev);
        next.delete(pluginId);
        return next;
      });
    }
  };

  const categories = ['all', 'quality', 'security', 'integration', 'performance', 'devops'];
  const filteredPlugins = plugins.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.plugin.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl mb-2">Plugin Marketplace</CardTitle>
          <CardDescription className="text-slate-400">
            Browse and install plugins to enhance your development workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4"
          />
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className={selectedCategory === cat 
                  ? 'bg-white text-black hover:bg-slate-100' 
                  : 'border-slate-800 text-slate-400 hover:bg-slate-900'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-slate-400 text-sm mb-1">Total Plugins</div>
            <div className="text-2xl font-bold text-white">{plugins.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-slate-400 text-sm mb-1">Total Downloads</div>
            <div className="text-2xl font-bold text-cyan-400">
              {plugins.reduce((sum, p) => sum + (p.plugin.downloads || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-slate-400 text-sm mb-1">Avg Rating</div>
            <div className="text-2xl font-bold text-green-400">
              {plugins.length > 0 
                ? (plugins.reduce((sum, p) => sum + (p.plugin.rating || 0), 0) / plugins.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-slate-400 text-sm mb-1">Free Plugins</div>
            <div className="text-2xl font-bold text-white">
              {plugins.filter(p => p.plugin.price === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugin List */}
      {isLoading ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6 text-center text-slate-400">
            Loading plugins...
          </CardContent>
        </Card>
      ) : filteredPlugins.length === 0 ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="pt-6 text-center text-slate-400">
            {searchQuery ? 'No plugins found matching your search.' : 'No plugins available in this category.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlugins.map((item) => (
            <Card key={item.pluginId} className="bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">{item.plugin.name}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {item.plugin.description}
                    </CardDescription>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-green-400 font-semibold">⭐ {item.plugin.rating}</div>
                    <div className="text-slate-500 text-xs mt-1">{item.plugin.downloads?.toLocaleString()} downloads</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.plugin.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">
                    {item.plugin.price === 0 ? 'Free' : `$${item.plugin.price}/mo`}
                  </div>
                  <Button
                    onClick={() => installPlugin(item.pluginId)}
                    disabled={installingPlugins.has(item.pluginId) || installedPlugins.has(item.pluginId)}
                    className={`${
                      installedPlugins.has(item.pluginId)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    {installingPlugins.has(item.pluginId) ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Installing...
                      </>
                    ) : installedPlugins.has(item.pluginId) ? (
                      <>
                        <span className="mr-2">✓</span>
                        Installed
                      </>
                    ) : (
                      'Install'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-slate-400 text-sm">
            💡 <strong>Tip:</strong> For personalized plugin recommendations based on your project, check out the{' '}
            <a href="/dashboard?view=ai-recommendations" className="text-cyan-400 hover:underline">
              AI Recommendations
            </a>{' '}
            tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Enterprise View - Enterprise Features & Analytics
 */
function EnterpriseView({ data }: any) {
  return (
    <div className="w-full max-w-6xl">
      <Card className="bg-slate-900/90 border-slate-800 mb-4">
        <div className="text-amber-400 uppercase tracking-widest mb-4 text-lg">
          Enterprise Dashboard
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{data.teams}</div>
            <div className="text-sm text-slate-400">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{data.repositories}</div>
            <div className="text-sm text-slate-400">Repositories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{data.users}</div>
            <div className="text-sm text-slate-400">Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{data.uptime}%</div>
            <div className="text-sm text-slate-400">Uptime</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/90 border-slate-800">
          <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
            Enterprise Features
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>SSO Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Advanced Reporting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>White-label Solutions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Dedicated Support</span>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <div className="text-amber-400 uppercase tracking-widest mb-3 text-sm">
            AI Systems Health
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>BEAST MODE Core</span>
              <span className="text-green-400">Operational</span>
            </div>
            <div className="flex justify-between">
              <span>Oracle AI</span>
              <span className={`${data.oracleStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.oracleStatus === 'operational' ? 'Connected' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Daisy Chain</span>
              <span className={`${data.daisyChainStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.daisyChainStatus === 'operational' ? 'Orchestrating' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversational AI</span>
              <span className={`${data.conversationalAIStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.conversationalAIStatus === 'operational' ? 'Chat Ready' : 'Limited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Health Monitor</span>
              <span className={`${data.healthMonitorStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.healthMonitorStatus === 'operational' ? 'Monitoring' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mission Guidance</span>
              <span className={`${data.missionGuidanceStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.missionGuidanceStatus === 'operational' ? 'Guiding' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deployment Orchestrator</span>
              <span className={`${data.deploymentOrchestratorStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                {data.deploymentOrchestratorStatus === 'operational' ? 'Deploying' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>AI Systems</span>
              <span className="text-cyan-400">{data.aiSystems}/9 Active</span>
            </div>
            <div className="flex justify-between">
              <span>Code Roach</span>
              <span className="text-green-400">Operational</span>
            </div>
            <div className="flex justify-between">
              <span>Integrations</span>
              <span className="text-cyan-400">{data.integrations} Connected</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversational AI Interface */}
      <ConversationalAI />
    </div>
  );
}

/**
 * Main export - BEAST MODE Dashboard
 */
interface BeastModeDashboardProps {
  initialView?: string | null;
}

export default function BeastModeDashboard({ initialView }: BeastModeDashboardProps) {
  return <BeastModeDashboardInner initialView={initialView} />;
}
