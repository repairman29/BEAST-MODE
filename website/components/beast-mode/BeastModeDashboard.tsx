"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import NotificationWidget, { Notification } from '../hud/NotificationWidget';
// Removed unused imports: ConversationalAI, HealthDashboard, AIRecommendations, MonetizationDashboard, MissionDashboard, DeploymentDashboard, GitHubScanForm
// These features are now consolidated into Quality, Intelligence, Marketplace, and Settings tabs
import AuthSection from './AuthSection';
import PricingSection from './PricingSection';
import SelfImprovement from './SelfImprovement';
import QuickActions from './QuickActions';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import FTUEOnboarding from './FTUEOnboarding';
import PluginManager from './PluginManager';
import PluginReviews from './PluginReviews';
import PluginUpdates from './PluginUpdates';
import PluginAnalytics from './PluginAnalytics';
import IntegrationsManager from './IntegrationsManager';
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
      const validViews = ['quality', 'intelligence', 'marketplace', 'self-improve', 'settings', 'auth', 'pricing'];
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
  const [currentView, setCurrentView] = useState<'quality' | 'intelligence' | 'marketplace' | 'self-improve' | 'settings' | 'auth' | 'pricing' | null>(
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
          setCurrentView('self-improve');
        }
        if (e.key === '5') {
          e.preventDefault();
          setCurrentView('settings');
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
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300 ease-in-out relative pt-16 z-0 pb-16">
        {/* Background ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] z-0"></div>

            {/* Status Bar removed - stats shown in individual tabs instead */}

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
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-8 px-6 xl:px-12 pb-20 custom-scrollbar relative z-20" style={{ paddingTop: 'calc(4rem + 1rem)', paddingBottom: 'calc(1.5rem + 3rem)' }}>
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
                onScanRepo={() => setCurrentView('quality')}
                onSignIn={() => setCurrentView('auth')}
                onPricing={() => setCurrentView('pricing')}
                onImprove={() => setCurrentView('self-improve')}
              />
            </div>
          )}

          {currentView === 'quality' && (
            <div className="w-full max-w-7xl relative z-30">
              <QualityView data={beastModeState.quality} />
            </div>
          )}

          {currentView === 'intelligence' && (
            <div className="w-full max-w-7xl relative z-30">
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
            <div className="w-full max-w-7xl relative z-30">
              <MarketplaceView data={beastModeState.marketplace} />
            </div>
          )}

          {currentView === 'settings' && (
            <div className="w-full max-w-7xl relative z-30">
              <SettingsView data={beastModeState.enterprise} />
            </div>
          )}

          {currentView === 'auth' && (
            <div className="w-full max-w-md relative z-30">
              <AuthSection onAuthSuccess={handleAuthSuccess} />
            </div>
          )}

          {currentView === 'pricing' && (
            <div className="w-full max-w-7xl relative z-30">
              <PricingSection />
            </div>
          )}

          {currentView === 'self-improve' && (
            <div className="w-full max-w-7xl relative z-30">
              <SelfImprovement />
            </div>
          )}
        </div>

        {/* Bottom Status Line */}
        <div className="fixed bottom-0 left-64 right-0 px-6 py-3 bg-black/90 backdrop-blur-md border-t border-slate-800/50 z-40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 max-w-7xl mx-auto">
            <div className="flex gap-4 sm:gap-6 md:gap-8 flex-wrap">
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
  const [allScans, setAllScans] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedIssue, setSelectedIssue] = React.useState<any>(null);
  const [showAllIssues, setShowAllIssues] = React.useState(false);
  const [showTrends, setShowTrends] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [quickScanRepo, setQuickScanRepo] = React.useState('');
  const [comparisonScan, setComparisonScan] = React.useState<any>(null);
  const [showAdvancedScan, setShowAdvancedScan] = React.useState(false);
  const [advancedScanUrl, setAdvancedScanUrl] = React.useState('');
  const [favoriteRepos, setFavoriteRepos] = React.useState<string[]>([]);
  const [expandedScans, setExpandedScans] = React.useState<Set<number>>(new Set());
  const [scanError, setScanError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Load all scans from localStorage
    const loadScans = () => {
      try {
        const stored = localStorage.getItem('beast-mode-scan-results');
        if (stored) {
          const scans = JSON.parse(stored);
          const completed = scans.filter((s: any) => s.status === 'completed');
          setAllScans(completed);
          if (completed.length > 0) {
            setLatestScan(completed[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load scan results:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadScans();

    // Listen for new scans
    const handleStorageChange = () => {
      loadScans();
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
    // Toggle advanced scan form
    setShowAdvancedScan(!showAdvancedScan);
  };

  const handleAdvancedScan = async () => {
    if (!advancedScanUrl.trim()) {
      setScanError('Please enter a GitHub repository URL');
      return;
    }

    // Extract owner/repo from URL
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/,
      /git@github\.com:([^\/]+)\/([^\/]+)\.git/
    ];

    let match = null;
    let owner = '';
    let repo = '';

    for (const pattern of patterns) {
      match = advancedScanUrl.match(pattern);
      if (match) {
        [, owner, repo] = match;
        break;
      }
    }

    if (!match) {
      setScanError('Invalid GitHub URL. Format: https://github.com/owner/repo or owner/repo');
      return;
    }

    const fullRepo = `${owner}/${repo}`;
    setScanError(null);
    setIsScanning(true);

    try {
      const response = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: fullRepo, url: advancedScanUrl })
      });

      if (response.ok) {
        const result = await response.json();
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => {
          const stored = localStorage.getItem('beast-mode-scan-results');
          if (stored) {
            const scans = JSON.parse(stored);
            const completed = scans.filter((s: any) => s.status === 'completed');
            setAllScans(completed);
            if (completed.length > 0) {
              setLatestScan(completed[0]);
            }
          }
        }, 1000);
        setAdvancedScanUrl('');
        setShowAdvancedScan(false);
        alert(`✅ Scan complete! Quality score: ${result.score}/100`);
      } else {
        const error = await response.json();
        setScanError(error.error || 'Scan failed');
      }
    } catch (error: any) {
      setScanError(error.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickScan = async () => {
    if (!quickScanRepo.trim()) {
      alert('Please enter a repository (owner/repo)');
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: quickScanRepo.trim(), url: `https://github.com/${quickScanRepo.trim()}` })
      });

      if (response.ok) {
        const result = await response.json();
        // Trigger storage event to refresh
        window.dispatchEvent(new Event('storage'));
        // Reload scans
        setTimeout(() => {
          const stored = localStorage.getItem('beast-mode-scan-results');
          if (stored) {
            const scans = JSON.parse(stored);
            const completed = scans.filter((s: any) => s.status === 'completed');
            setAllScans(completed);
            if (completed.length > 0) {
              setLatestScan(completed[0]);
            }
          }
        }, 1000);
        setQuickScanRepo('');
        alert(`✅ Scan complete! Quality score: ${result.score}/100`);
      } else {
        const error = await response.json();
        alert(`❌ Scan failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`❌ Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Use latest scan data if available, otherwise fall back to props
  const qualityData = latestScan ? {
    score: latestScan.score || data.score,
    issues: latestScan.issues || data.issues,
    improvements: latestScan.improvements || data.improvements,
    lastScan: latestScan.timestamp || data.lastScan
  } : data;

  // Calculate score change from previous scan
  const scoreChange = allScans.length > 1 
    ? latestScan?.score - allScans[1]?.score 
    : null;

  // Load favorites on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('beast-mode-favorite-repos');
      if (stored) {
        setFavoriteRepos(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  const toggleFavorite = (repo: string) => {
    const newFavorites = favoriteRepos.includes(repo)
      ? favoriteRepos.filter(r => r !== repo)
      : [...favoriteRepos, repo];
    setFavoriteRepos(newFavorites);
    localStorage.setItem('beast-mode-favorite-repos', JSON.stringify(newFavorites));
  };

  const exportReport = (result: any) => {
    const report = {
      repo: result.repo,
      score: result.score,
      issues: result.issues,
      improvements: result.improvements,
      detectedIssues: result.detectedIssues || [],
      recommendations: result.recommendations || [],
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beast-mode-report-${result.repo.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl space-y-6 mx-auto pt-4">
      {/* Quick Scan Bar */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">⚡ Scan Your Code</CardTitle>
          <CardDescription className="text-slate-400">
            See your code quality score in 10 seconds. No setup. No configuration. Just paste your GitHub repo and watch the magic happen. ✨
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={quickScanRepo}
              onChange={(e) => setQuickScanRepo(e.target.value)}
              placeholder="owner/repo (e.g., facebook/react)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              onKeyPress={(e) => e.key === 'Enter' && handleQuickScan()}
            />
            <Button
              onClick={handleQuickScan}
              disabled={isScanning || !quickScanRepo.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white smooth-transition hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isScanning ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  <span className="animate-pulse">Scanning...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">🔍</span>
                  Quick Scan
                </>
              )}
            </Button>
            <Button
              onClick={handleScanNow}
              variant="outline"
              className="border-slate-700 text-slate-400 hover:bg-slate-900"
            >
              {showAdvancedScan ? 'Hide Advanced' : 'Advanced Scan'}
            </Button>
          </div>
          {showAdvancedScan && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-sm text-slate-400 mb-2">Full GitHub URL:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={advancedScanUrl}
                  onChange={(e) => setAdvancedScanUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdvancedScan()}
                />
                <Button
                  onClick={handleAdvancedScan}
                  disabled={isScanning || !advancedScanUrl.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Scan
                </Button>
              </div>
              {scanError && (
                <div className="mt-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  {scanError}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quality Score */}
      <Card className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all h-full">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-white text-xl font-bold">Quality Score</CardTitle>
            {scoreChange !== null && scoreChange !== 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                scoreChange > 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <span>{scoreChange > 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(scoreChange)}</span>
              </div>
            )}
          </div>
          {latestScan && (
            <div className="text-xs text-slate-400">
              Last scan: <span className="text-slate-300">{latestScan.repo}</span>
              {latestScan.timestamp && (
                <> • <span className="text-slate-400">{new Date(latestScan.timestamp).toLocaleDateString()}</span></>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
              {/* Large Score Display */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative score-reveal">
              {/* Score Ring */}
              <svg className="w-40 h-40 transform -rotate-90 score-reveal">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-slate-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(qualityData.score / 100) * 440} 440`}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-out ${
                    qualityData.score >= 80 ? 'text-green-500 pulse-glow' :
                    qualityData.score >= 60 ? 'text-amber-500' :
                    'text-red-500'
                  }`}
                  style={{ 
                    strokeDashoffset: 0,
                    animationDelay: '0.2s'
                  }}
                />
              </svg>
              {/* Score Number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-bold ${
                  qualityData.score >= 80 ? 'text-green-400' :
                  qualityData.score >= 60 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {qualityData.score}
                </div>
                <div className="text-sm text-slate-500 mt-1">out of 100</div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Issues Found</div>
              <div className="text-2xl font-bold text-white">{qualityData.issues}</div>
              <div className="text-xs text-slate-500 mt-1">needs attention</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Improvements</div>
              <div className="text-2xl font-bold text-cyan-400">{qualityData.improvements}</div>
              <div className="text-xs text-slate-500 mt-1">available</div>
            </div>
          </div>

          {/* Additional Metrics (if available) */}
          {latestScan?.metrics && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Additional Metrics</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Test Coverage</span>
                  <span className={`font-semibold text-sm ${
                    latestScan.metrics.coverage >= 70 ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {latestScan.metrics.coverage || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Maintainability</span>
                  <span className={`font-semibold text-sm ${
                    latestScan.metrics.maintainability >= 80 ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {latestScan.metrics.maintainability || 0}/100
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all h-full">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quality Metrics</CardTitle>
          <CardDescription className="text-slate-400">
            Detailed metrics from your latest scan
          </CardDescription>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Recent Quality Scans</CardTitle>
            <div className="flex gap-2">
              {latestScan && (
                <Button
                  onClick={() => exportReport(latestScan)}
                  variant="outline"
                  size="sm"
                  className="border-slate-800 text-slate-400 hover:bg-slate-900"
                >
                  📥 Export Latest
                </Button>
              )}
              {allScans.length > 1 && (
                <Button
                  onClick={() => setComparisonScan(comparisonScan ? null : allScans[1])}
                  variant="outline"
                  size="sm"
                  className="border-slate-800 text-slate-400 hover:bg-slate-900"
                >
                  {comparisonScan ? 'Hide Comparison' : 'Compare with Previous'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-slate-500 py-12">
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
              <div className="text-sm">Loading scan results...</div>
            </div>
          ) : latestScan ? (
            <div className="space-y-3">
              {/* Comparison View */}
              {comparisonScan && (
                <div className="mb-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="text-sm text-slate-400 mb-3">Comparison</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Current Scan</div>
                      <div className="text-lg font-bold text-white">{latestScan.score}/100</div>
                      <div className="text-xs text-slate-500">{latestScan.issues} issues</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Previous Scan</div>
                      <div className="text-lg font-bold text-white">{comparisonScan.score}/100</div>
                      <div className="text-xs text-slate-500">{comparisonScan.issues} issues</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Score Change</span>
                      <span className={`font-semibold ${scoreChange && scoreChange > 0 ? 'text-green-400' : scoreChange && scoreChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {scoreChange !== null ? `${scoreChange > 0 ? '+' : ''}${scoreChange}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-400">Issues Change</span>
                      <span className={`font-semibold ${(latestScan.issues - comparisonScan.issues) < 0 ? 'text-green-400' : (latestScan.issues - comparisonScan.issues) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {latestScan.issues - comparisonScan.issues > 0 ? '+' : ''}{latestScan.issues - comparisonScan.issues}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-medium">{latestScan.repo}</span>
                    <button
                      onClick={() => toggleFavorite(latestScan.repo)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title={favoriteRepos.includes(latestScan.repo) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favoriteRepos.includes(latestScan.repo) ? '⭐' : '☆'}
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-400">
                      {showAllIssues ? 'All Issues' : 'Top Issues'} ({latestScan.detectedIssues.length})
                    </div>
                    {latestScan.detectedIssues.length > 3 && (
                      <Button
                        onClick={() => setShowAllIssues(!showAllIssues)}
                        variant="outline"
                        size="sm"
                        className="border-slate-800 text-slate-400 hover:bg-slate-900"
                      >
                        {showAllIssues ? 'Show Less' : 'Show All'}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(showAllIssues ? latestScan.detectedIssues : latestScan.detectedIssues.slice(0, 3)).map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedIssue(issue)}
                        className={`text-sm text-slate-300 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedIssue === issue ? 'bg-cyan-500/20 border border-cyan-500/50' : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`flex-shrink-0 px-2 py-1 rounded text-xs ${
                            issue.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            issue.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {issue.priority}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{issue.title}</div>
                            {selectedIssue === issue && (
                              <div className="mt-2 text-xs text-slate-400">
                                {issue.description}
                                {issue.file && (
                                  <div className="mt-1 text-slate-500">
                                    File: <code className="bg-slate-900 px-1 rounded">{issue.file}{issue.line ? `:${issue.line}` : ''}</code>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend Charts */}
              {allScans.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-400">Quality Trends</div>
                    <Button
                      onClick={() => setShowTrends(!showTrends)}
                      variant="outline"
                      size="sm"
                      className="border-slate-800 text-slate-400 hover:bg-slate-900"
                    >
                      {showTrends ? 'Hide Trends' : 'Show Trends'}
                    </Button>
                  </div>
                  {showTrends && (
                    <div className="space-y-4">
                      {/* Score Trend */}
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Quality Score Over Time</div>
                        <div className="flex items-end gap-2 h-32">
                          {allScans.slice(0, 10).reverse().map((scan: any, idx: number) => {
                            const height = (scan.score || 0);
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                <div className="w-full bg-slate-800 rounded-t relative group">
                                  <div
                                    className={`w-full rounded-t transition-all ${
                                      height >= 80 ? 'bg-green-500' :
                                      height >= 60 ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ height: `${height}%` }}
                                  >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                      {scan.score}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1 truncate w-full text-center">
                                  {scan.repo.split('/')[1] || 'Repo'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Issues Trend */}
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Issues Count Over Time</div>
                        <div className="flex items-end gap-2 h-24">
                          {allScans.slice(0, 10).reverse().map((scan: any, idx: number) => {
                            const maxIssues = Math.max(...allScans.map((s: any) => s.issues || 0), 1);
                            const height = ((scan.issues || 0) / maxIssues) * 100;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                <div className="w-full bg-slate-800 rounded-t">
                                  <div
                                    className="w-full bg-red-500/60 rounded-t"
                                    style={{ height: `${height}%` }}
                                  />
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1">
                                  {scan.issues || 0}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 slide-up">
              <div className="text-6xl mb-4 animate-bounce">📊</div>
              <div className="text-lg font-semibold text-slate-300 mb-2">No scans yet</div>
              <div className="text-sm text-slate-400 mb-6">
                Scan a GitHub repository to see your code quality score and metrics. Your first scan is just one click away! 🚀
              </div>
              <Button
                onClick={handleScanNow}
                className="bg-cyan-600 hover:bg-cyan-700 text-white smooth-transition hover-lift button-press"
              >
                <span className="mr-2">🔍</span>
                Scan Repository
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

/**
 * Intelligence View - AI Insights, Recommendations & Missions
 */
function IntelligenceView({ data, messages, onCommand, commandInput, setCommandInput }: any) {
  const [conversationMessages, setConversationMessages] = React.useState<any[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');
  const [recentScans, setRecentScans] = React.useState<any[]>([]);
  const [activeSection, setActiveSection] = React.useState<'chat' | 'recommendations' | 'missions'>('chat');
  
  // AI Recommendations state
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = React.useState<string | null>(null);
  const [projectContext, setProjectContext] = React.useState({
    type: 'web',
    languages: ['javascript', 'typescript'],
    teamSize: 'small',
    timeline: 'production',
    budget: 'medium',
    qualityScore: 75
  });
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  
  // Missions state
  const [missions, setMissions] = React.useState<any[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = React.useState(false);
  const [showCreateMission, setShowCreateMission] = React.useState(false);
  const [editingMission, setEditingMission] = React.useState<any>(null);
  const [newMission, setNewMission] = React.useState({
    name: '',
    description: '',
    type: 'code-refactor',
    priority: 'medium',
    deadline: '',
    objectives: ['']
  });

  // Load recent scans for context
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('beast-mode-scan-results');
      if (stored) {
        const scans = JSON.parse(stored);
        // Ensure scans is an array
        if (Array.isArray(scans)) {
          const completed = scans.filter((s: any) => s && s.status === 'completed').slice(0, 5);
          setRecentScans(completed);
        } else {
          setRecentScans([]);
        }
      }
    } catch (e) {
      console.error('Failed to load scans:', e);
      setRecentScans([]);
    }
  }, []);

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          projectContext: projectContext
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Fetch missions
  const fetchMissions = async () => {
    setIsLoadingMissions(true);
    try {
      const response = await fetch('/api/beast-mode/missions');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'recommendations') {
      fetchRecommendations();
    } else if (activeSection === 'missions') {
      fetchMissions();
    }
  }, [activeSection]);

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

    // Update state and capture the updated array
    let updatedMessages: any[] = [];
    setConversationMessages(prev => {
      updatedMessages = Array.isArray(prev) ? [...prev, userMsg] : [userMsg];
      return updatedMessages;
    });
    
    setAiInput('');
    setIsProcessing(true);

    try {
      // Ensure arrays are valid before using array methods
      const conversationHistory = Array.isArray(updatedMessages) 
        ? updatedMessages.slice(-5).map((m: any) => ({
            text: m?.text || '',
            type: m?.type || 'user',
            intent: m?.intent
          }))
        : [];
      
      const scanDataForApi = Array.isArray(recentScans) ? recentScans : [];

      const response = await fetch('/api/beast-mode/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            conversationHistory,
            scanData: scanDataForApi,
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
        timestamp: new Date(),
        intent: result.intent,
        actionableItems: result.actionableItems
      };

      setConversationMessages(prev => Array.isArray(prev) ? [...prev, aiMsg] : [aiMsg]);
    } catch (error) {
      console.error('Conversation error:', error);
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: "❌ Sorry, I encountered an error. Please try again or check your connection.",
        type: 'system',
        timestamp: new Date()
      };
      setConversationMessages(prev => Array.isArray(prev) ? [...prev, errorMsg] : [errorMsg]);
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

  const displayMessages = Array.isArray(conversationMessages) && conversationMessages.length > 0 
    ? conversationMessages 
    : (Array.isArray(messages) ? messages : []);

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Your Activity Summary */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Your Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Watch your progress grow: every question, recommendation, and completed mission makes you a better developer. 🚀
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center bg-slate-800/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-cyan-400">{conversationMessages.length}</div>
              <div className="text-xs text-slate-400 mt-1">Questions Asked</div>
            </div>
            <div className="text-center bg-slate-800/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{recommendations.length}</div>
              <div className="text-xs text-slate-400 mt-1">Recommendations</div>
            </div>
            <div className="text-center bg-slate-800/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-400">{missions.filter((m: any) => m.status === 'completed').length}</div>
              <div className="text-xs text-slate-400 mt-1">Missions Completed</div>
            </div>
            <div className="text-center bg-slate-800/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{missions.filter((m: any) => m.status === 'active').length}</div>
              <div className="text-xs text-slate-400 mt-1">Active Missions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Conversation */}
      <Card className="bg-slate-900/90 border-slate-800 w-full h-[70vh] min-h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-lg">Ask Anything About Your Code</CardTitle>
          <CardDescription className="text-slate-400">
            Get answers based on YOUR code. No more Stack Overflow rabbit holes. Just ask, and we'll analyze your actual codebase. 🧠✨
          </CardDescription>
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
              <div className="text-center text-slate-500 py-12 slide-up">
                <div className="text-6xl mb-4 animate-bounce">🧠</div>
                <div className="text-lg font-semibold text-slate-300 mb-2">Ask me anything about your code</div>
                <div className="text-sm text-slate-400 mt-2">
                  Click a question above or type your own. I'll analyze YOUR code and give you specific answers. No generic advice here! ✨
                </div>
              </div>
            ) : (
              Array.isArray(displayMessages) ? displayMessages.map((msg: any, idx: number) => (
                <div
                  key={msg.id}
                  className={`
                    p-3 rounded-lg slide-up smooth-transition hover-lift ${
                      msg.type === 'user' 
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-500 ml-8' 
                        : msg.type === 'ai'
                        ? 'bg-purple-500/10 border-l-4 border-purple-500 mr-8'
                        : 'bg-slate-800/50 border-l-4 border-slate-600'
                    }
                  `}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.type === 'user' ? 'text-cyan-400' : 
                    msg.type === 'ai' ? 'text-white' : 
                    'text-slate-400'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.actionableItems && msg.actionableItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(msg.actionableItems) ? msg.actionableItems.map((action: string, idx: number) => (
                          <Button
                            key={idx}
                            onClick={() => {
                              if (action.includes('Quality')) {
                                window.location.href = '/dashboard?view=quality';
                              } else if (action.includes('Scan')) {
                                window.location.href = '/dashboard?view=github-scan';
                              } else if (action.includes('Recommendations')) {
                                window.location.href = '/dashboard?view=ai-recommendations';
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                          >
                            {action}
                          </Button>
                        )) : null}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                    <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                    {msg.intent && msg.intent !== 'general' && (
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px]">
                        {msg.intent}
                      </span>
                    )}
                  </div>
                </div>
              )) : null
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
              placeholder="Ask anything... (e.g., 'Why is my code slow?' or 'What should I fix first?')"
              className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors rounded-lg"
              disabled={isProcessing}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!aiInput.trim() || isProcessing}
              className="bg-white text-black hover:bg-slate-100 smooth-transition hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">🧠</span>
                  <span className="animate-pulse">Thinking...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Send
                </>
              )}
            </Button>
          </div>
          {recentScans.length > 0 && (
            <div className="text-xs text-slate-500 mt-2">
              💡 Context: Using data from {recentScans.length} recent scan(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations Section */}
      {activeSection === 'recommendations' && (
        <div className="space-y-6">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">💡 We'll Tell You Exactly What to Fix</CardTitle>
                <Button onClick={fetchRecommendations} disabled={isLoadingRecommendations} className="bg-white text-black hover:bg-slate-100">
                  {isLoadingRecommendations ? '🔄 Analyzing...' : '🔍 Get Recommendations'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Project Type</label>
                  <select
                    value={projectContext.type}
                    onChange={(e) => setProjectContext(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="web">Web App</option>
                    <option value="mobile">Mobile App</option>
                    <option value="api">API Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Team Size</label>
                  <select
                    value={projectContext.teamSize}
                    onChange={(e) => setProjectContext(prev => ({ ...prev, teamSize: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="solo">Solo</option>
                    <option value="small">Small (2-5)</option>
                    <option value="medium">Medium (6-20)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Timeline</label>
                  <select
                    value={projectContext.timeline}
                    onChange={(e) => setProjectContext(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="prototype">Prototype</option>
                    <option value="mvp">MVP</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Budget</label>
                  <select
                    value={projectContext.budget}
                    onChange={(e) => setProjectContext(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="low">Low ($)</option>
                    <option value="medium">Medium ($$)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingRecommendations ? (
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
                <span className="text-cyan-400 text-sm">Analyzing your project...</span>
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="text-center py-16">
                <div className="text-5xl mb-4">🤔</div>
                <div className="text-lg font-semibold text-slate-300 mb-2">No recommendations yet</div>
                <div className="text-sm text-slate-400 mb-6">Click "Get Recommendations" to analyze your project and get personalized suggestions</div>
                <Button onClick={fetchRecommendations} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  🔍 Get Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((rec: any) => (
                <Card key={rec.pluginId} className="bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{rec.plugin?.name || 'Plugin'}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.plugin?.price === 0 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {rec.plugin?.price === 0 ? 'FREE' : `$${rec.plugin?.price}`}
                          </span>
                          <span>⭐ {rec.plugin?.rating || 'N/A'}</span>
                        </div>
                      </div>
                      <div className={`text-right ${rec.confidence >= 0.8 ? 'text-green-400' : rec.confidence >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                        <div className="text-sm font-semibold">{Math.round(rec.confidence * 100)}%</div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                      {rec.plugin?.description || rec.reasons?.[0] || 'Recommended for your project'}
                    </p>
                    {rec.reasons && rec.reasons.length > 0 && (
                      <div className="text-xs text-slate-400">
                        💡 {rec.reasons.length} reason{rec.reasons.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missions Section */}
      {activeSection === 'missions' && (
        <div className="space-y-6">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">🎯 Track Your Improvement Goals</CardTitle>
                <Button onClick={() => setShowCreateMission(true)} className="bg-white text-black hover:bg-slate-100">
                  + New Mission
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMissions ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
                  <span className="text-cyan-400 text-sm">Loading missions...</span>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-16 slide-up">
                  <div className="text-6xl mb-4 animate-bounce">🎯</div>
                  <div className="text-lg font-semibold text-slate-300 mb-2">No missions yet</div>
                  <div className="text-sm text-slate-400 mb-6">Create a mission to track what you want to improve. We'll help you get there. Every mission completed makes you a better developer! 🚀</div>
                  <Button onClick={() => setShowCreateMission(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white smooth-transition hover-lift button-press">
                    <span className="mr-2">+</span>
                    Create Mission
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {missions.map((mission: any) => (
                    <Card key={mission.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{mission.name}</h3>
                            <p className="text-slate-400 text-sm mb-2">{mission.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Type: {mission.type}</span>
                              <span>Priority: {mission.priority}</span>
                              <span>Status: {mission.status}</span>
                              <span>Progress: {mission.progress || 0}%</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {mission.status === 'planning' && (
                              <Button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/beast-mode/missions/${mission.id}/start`, { method: 'POST' });
                                    if (response.ok) await fetchMissions();
                                  } catch (e) { console.error(e); }
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Start
                              </Button>
                            )}
                            {mission.status === 'active' && (
                              <Button
                                onClick={async () => {
                                  if (confirm('Mark as completed?')) {
                                    try {
                                      const response = await fetch(`/api/beast-mode/missions/${mission.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'completed', progress: 100 })
                                      });
                                      if (response.ok) await fetchMissions();
                                    } catch (e) { console.error(e); }
                                  }
                                }}
                                size="sm"
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Marketplace View - Browse All Plugins
 */
function MarketplaceView({ data }: any) {
  const { user } = useUser();
  const [plugins, setPlugins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setIsLoading(true);
    try {
      // Try new plugins API first
      let response = await fetch('/api/beast-mode/marketplace/plugins');
      
      if (response.ok) {
        const result = await response.json();
        // Transform plugin registry format to match UI expectations
        const transformedPlugins = (result.plugins || []).map((plugin: any) => ({
          pluginId: plugin.id,
          plugin: {
            id: plugin.id,
            name: plugin.name,
            description: plugin.description,
            category: plugin.category,
            price: plugin.price,
            rating: plugin.rating,
            downloads: plugin.downloads,
            tags: plugin.tags || [],
            languages: plugin.languages || [],
            icon: plugin.icon,
            usage: plugin.usage,
            configSchema: plugin.configSchema
          },
          score: 90,
          confidence: 0.85,
          reasons: ['Available in marketplace', 'Well maintained', 'Popular choice']
        }));
        setPlugins(transformedPlugins);
        return;
      }
      
      // Fallback to recommendations API
      response = await fetch('/api/beast-mode/marketplace/recommendations', {
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

  // Load installed plugins from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('beast-mode-installed-plugins');
      if (saved) {
        try {
          const plugins = JSON.parse(saved);
          setInstalledPlugins(new Set(plugins));
        } catch (e) {
          console.error('Failed to load installed plugins:', e);
        }
      }
    }
  }, []);

  const installPlugin = async (pluginId: string, withDependencies = true) => {
    if (installingPlugins.has(pluginId) || installedPlugins.has(pluginId)) {
      return;
    }

    setInstallingPlugins(prev => new Set(prev).add(pluginId));

    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || 'demo-user' : 'demo-user';

      // Check for dependencies first
      if (withDependencies) {
        const depsResponse = await fetch(`/api/beast-mode/marketplace/dependencies?pluginId=${pluginId}&userId=${userId}`);
        if (depsResponse.ok) {
          const depsData = await depsResponse.json();
          
          if (depsData.conflicts.length > 0 || depsData.missing.length > 0) {
            throw new Error(
              `Dependency issues: ${depsData.conflicts.join(', ')} ${depsData.missing.length > 0 ? `Missing: ${depsData.missing.join(', ')}` : ''}`
            );
          }

          // If dependencies exist, use dependency installation endpoint
          if (depsData.dependencies.length > 0) {
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
              const result = await response.json();
              const updated = new Set(installedPlugins);
              updated.add(pluginId);
              result.installedDependencies?.forEach((depId: string) => updated.add(depId));
              setInstalledPlugins(updated);
              
              // Persist to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('beast-mode-installed-plugins', JSON.stringify(Array.from(updated)));
                
                const event = new CustomEvent('beast-mode-notification', {
                  detail: {
                    type: 'success',
                    message: result.message || `Plugin "${result.plugin?.name || pluginId}" and ${result.installedDependencies?.length || 0} dependency(ies) installed successfully!`
                  }
                });
                window.dispatchEvent(event);
              }
              return;
            }
          }
        }
      }

      // Fallback to regular installation (no dependencies or dependency check failed)
      const response = await fetch('/api/beast-mode/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        const updated = new Set(installedPlugins).add(pluginId);
        setInstalledPlugins(updated);
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('beast-mode-installed-plugins', JSON.stringify(Array.from(updated)));
          
          const event = new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: `Plugin "${result.plugin?.name || pluginId}" installed successfully!`
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
    <div className="w-full max-w-7xl space-y-6 mx-auto">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📦 Plugin Marketplace</CardTitle>
          <CardDescription className="text-slate-400">
            Find and install plugins for your code. We'll find the tools you need, you click install. It's that simple. 🎯
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
          <CardContent className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
            <span className="text-cyan-400 text-sm">Loading plugins...</span>
          </CardContent>
        </Card>
      ) : filteredPlugins.length === 0 ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="text-center py-16 slide-up">
            <div className="text-6xl mb-4 animate-bounce">📦</div>
            <div className="text-lg font-semibold text-slate-300 mb-2">
              {searchQuery ? 'No plugins found' : 'No plugins in this category'}
            </div>
            <div className="text-sm text-slate-400">
              {searchQuery ? 'Try a different search term - we have amazing plugins waiting for you! 🔍' : "Try selecting a different category - there's something for everyone! ✨"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlugins.map((item) => (
            <Card key={item.pluginId} className="bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 smooth-transition hover-lift">
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
                {item.plugin.dependencies && item.plugin.dependencies.length > 0 && (
                  <div className="mb-3 p-2 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400 text-xs mb-1">📦 Requires:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.plugin.dependencies.map((depId: string) => (
                        <span key={depId} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                          {depId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">
                    {item.plugin.price === 0 ? 'Free' : `$${item.plugin.price}/mo`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedPlugin(item.pluginId);
                        setShowReviews(true);
                      }}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                    >
                      ⭐ Reviews
                    </Button>
                    <Button
                      onClick={() => installPlugin(item.pluginId, true)}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reviews Modal/Expanded View */}
      {showReviews && selectedPlugin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">
                  {filteredPlugins.find(p => p.pluginId === selectedPlugin)?.plugin.name || 'Plugin'} Reviews
                </CardTitle>
                <Button
                  onClick={() => {
                    setShowReviews(false);
                    setSelectedPlugin(null);
                  }}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PluginReviews
                pluginId={selectedPlugin}
                pluginName={filteredPlugins.find(p => p.pluginId === selectedPlugin)?.plugin.name || 'Plugin'}
                currentUserId={user?.id || (typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || undefined : undefined)}
                currentUserName={user?.email || 'User'}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plugin Updates Section */}
      <PluginUpdates
        userId={user?.id || (typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || undefined : undefined)}
        onUpdateApplied={() => {
          // Refresh plugin list if needed
          fetchPlugins();
        }}
      />

      {/* Installed Plugins Section */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">⚙️ Installed Plugins</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your installed plugins: enable/disable, configure, run, and view usage guides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PluginManager />
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">📊 Plugin Analytics</CardTitle>
          <CardDescription className="text-slate-400">
            Usage statistics and performance metrics for your plugins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PluginAnalytics
            userId={user?.id || (typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || undefined : undefined)}
          />
        </CardContent>
      </Card>

      {/* Plugin Development Section */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🚀 Expand the Ecosystem</CardTitle>
          <CardDescription className="text-slate-400">
            Create and publish your own plugins to extend BEAST MODE's capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h4 className="text-white font-semibold mb-2">Plugin Development Guide</h4>
            <p className="text-slate-400 text-sm mb-4">
              Build plugins that integrate seamlessly with BEAST MODE. Our plugin system supports:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
              <li><strong>Command-based plugins:</strong> Add new CLI commands</li>
              <li><strong>Quality analyzers:</strong> Custom code quality checks</li>
              <li><strong>Integrations:</strong> Connect with external tools</li>
              <li><strong>Automations:</strong> Automate repetitive tasks</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.open('https://docs.beastmode.dev/plugins/development', '_blank')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              📚 View Documentation
            </Button>
            <Button
              onClick={() => window.open('https://github.com/repairman29/BEAST-MODE/tree/main/plugins', '_blank')}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              💻 Example Plugins
            </Button>
            <Button
              onClick={() => {
                // Open plugin submission form
                alert('Plugin submission form coming soon! For now, submit via GitHub: https://github.com/repairman29/BEAST-MODE/issues/new?template=plugin-submission.md');
              }}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              ➕ Submit Plugin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-slate-400 text-sm">
            💡 <strong>Tip:</strong> For personalized plugin recommendations based on your project, check out the{' '}
            <a href="/dashboard?view=intelligence" className="text-cyan-400 hover:underline">
              Intelligence
            </a>{' '}
            tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Settings View - Teams, Users, Repositories & Preferences
 */
function SettingsView({ data }: any) {
  const { user } = useUser();
  const [teams, setTeams] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [repos, setRepos] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddTeam, setShowAddTeam] = React.useState(false);
  const [showAddUser, setShowAddUser] = React.useState(false);
  const [showAddRepo, setShowAddRepo] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState<any>(null);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [editingRepo, setEditingRepo] = React.useState<any>(null);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState('developer');
  const [newUserTeam, setNewUserTeam] = React.useState('');
  const [newRepoUrl, setNewRepoUrl] = React.useState('');
  const [newRepoTeam, setNewRepoTeam] = React.useState('');

  // Fetch data on mount
  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teamsRes, usersRes, reposRes] = await Promise.all([
        fetch('/api/beast-mode/enterprise/teams'),
        fetch('/api/beast-mode/enterprise/users'),
        fetch('/api/beast-mode/enterprise/repos')
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepos(reposData.repos || []);
      }
    } catch (error) {
      console.error('Failed to fetch enterprise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      const response = await fetch('/api/beast-mode/enterprise/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });

      if (response.ok) {
        await fetchData();
        setNewTeamName('');
        setShowAddTeam(false);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    }
  };

  const handleEditTeam = (team: any) => {
    setEditingTeam(team);
    setNewTeamName(team.name);
    setShowAddTeam(true);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTeam.id, name: newTeamName })
      });

      if (response.ok) {
        await fetchData();
        setEditingTeam(null);
        setNewTeamName('');
        setShowAddTeam(false);
      }
    } catch (error) {
      console.error('Failed to update team:', error);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/beast-mode/enterprise/teams?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team');
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          team: newUserTeam
        })
      });

      if (response.ok) {
        await fetchData();
        setNewUserEmail('');
        setNewUserName('');
        setNewUserRole('developer');
        setNewUserTeam('');
        setShowAddUser(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewUserEmail(user.email);
    setNewUserName(user.name || '');
    setNewUserRole(user.role);
    setNewUserTeam(user.team || '');
    setShowAddUser(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          team: newUserTeam
        })
      });

      if (response.ok) {
        await fetchData();
        setEditingUser(null);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserRole('developer');
        setNewUserTeam('');
        setShowAddUser(false);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetch(`/api/beast-mode/enterprise/users?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      alert('Failed to remove user');
    }
  };

  const handleAddRepo = async () => {
    if (!newRepoUrl.trim()) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newRepoUrl,
          team: newRepoTeam
        })
      });

      if (response.ok) {
        await fetchData();
        setNewRepoUrl('');
        setNewRepoTeam('');
        setShowAddRepo(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add repository');
      }
    } catch (error) {
      console.error('Failed to add repository:', error);
      alert('Failed to add repository');
    }
  };

  const handleEditRepo = (repo: any) => {
    setEditingRepo(repo);
    setNewRepoUrl(repo.url || '');
    setNewRepoTeam(repo.team || '');
    setShowAddRepo(true);
  };

  const handleUpdateRepo = async () => {
    if (!editingRepo || !newRepoUrl.trim()) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/repos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRepo.id,
          url: newRepoUrl,
          team: newRepoTeam
        })
      });

      if (response.ok) {
        await fetchData();
        setEditingRepo(null);
        setNewRepoUrl('');
        setNewRepoTeam('');
        setShowAddRepo(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update repository');
      }
    } catch (error) {
      console.error('Failed to update repository:', error);
      alert('Failed to update repository');
    }
  };

  const handleDeleteRepo = async (id: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) return;

    try {
      const response = await fetch(`/api/beast-mode/enterprise/repos?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to remove repository:', error);
      alert('Failed to remove repository');
    }
  };

  const handleScanRepo = (repo: any) => {
    // Navigate to quality tab with repo URL
    window.location.href = `/dashboard?view=quality&repo=${encodeURIComponent(repo.url || repo.name)}`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl space-y-6 mx-auto">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
            <span className="text-cyan-400">Loading enterprise data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl space-y-6 mx-auto">
      {/* Stats Overview */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Settings & Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{teams.length}</div>
              <div className="text-sm text-slate-400 mt-1">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{repos.length}</div>
              <div className="text-sm text-slate-400 mt-1">Repositories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{users.length}</div>
              <div className="text-sm text-slate-400 mt-1">Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{data.uptime}%</div>
              <div className="text-sm text-slate-400 mt-1">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Management */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-white text-lg">Teams</CardTitle>
            <Button
              onClick={() => setShowAddTeam(!showAddTeam)}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              + Add Team
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Organize your team members and repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddTeam && (
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={editingTeam ? handleUpdateTeam : handleAddTeam} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingTeam ? 'Update' : 'Create'}
                </Button>
                <Button 
                  onClick={() => { 
                    setShowAddTeam(false); 
                    setNewTeamName(''); 
                    setEditingTeam(null);
                  }} 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div>
                  <div className="text-white font-medium">{team.name}</div>
                  <div className="text-sm text-slate-400">{team.members} members • {team.repos} repos</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleEditTeam(team)} 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-700"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteTeam(team.id)} 
                    size="sm" 
                    variant="outline" 
                    className="border-red-700 text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-white text-lg">Users</CardTitle>
            <Button
              onClick={() => setShowAddUser(!showAddUser)}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              + Invite User
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Manage team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddUser && (
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
              />
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={newUserTeam}
                onChange={(e) => setNewUserTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
              >
                <option value="">No team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.name}>{team.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button 
                  onClick={editingUser ? handleUpdateUser : handleAddUser} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingUser ? 'Update' : 'Invite'}
                </Button>
                <Button 
                  onClick={() => { 
                    setShowAddUser(false); 
                    setNewUserEmail(''); 
                    setNewUserName('');
                    setNewUserRole('developer');
                    setNewUserTeam('');
                    setEditingUser(null);
                  }} 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {users.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg slide-up smooth-transition hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div>
                  <div className="text-white font-medium">{user.name || user.email}</div>
                  <div className="text-sm text-slate-400">{user.email} • {user.role} {user.team && `• ${user.team}`}</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleEditUser(user)} 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-700"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteUser(user.id)} 
                    size="sm" 
                    variant="outline" 
                    className="border-red-700 text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Repositories Management */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-white text-lg">Repositories</CardTitle>
            <Button
              onClick={() => setShowAddRepo(!showAddRepo)}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              + Add Repository
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Connect and manage your GitHub repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddRepo && (
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <input
                type="text"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
                onKeyPress={(e) => e.key === 'Enter' && handleAddRepo()}
              />
              <select
                value={newRepoTeam}
                onChange={(e) => setNewRepoTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2"
              >
                <option value="">No team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.name}>{team.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button 
                  onClick={editingRepo ? handleUpdateRepo : handleAddRepo} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingRepo ? 'Update' : 'Add'}
                </Button>
                <Button 
                  onClick={() => { 
                    setShowAddRepo(false); 
                    setNewRepoUrl(''); 
                    setNewRepoTeam('');
                    setEditingRepo(null);
                  }} 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {repos.map((repo, idx) => (
              <div key={repo.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg slide-up smooth-transition hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div>
                  <div className="text-white font-medium">{repo.name}</div>
                  <div className="text-sm text-slate-400">{repo.team || 'No team'} • Last scan: {repo.lastScan}</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleScanRepo(repo)} 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-700"
                  >
                    Scan Now
                  </Button>
                  <Button 
                    onClick={() => handleEditRepo(repo)} 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-700"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteRepo(repo.id)} 
                    size="sm" 
                    variant="outline" 
                    className="border-red-700 text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🔗 Integrations</CardTitle>
          <CardDescription className="text-slate-400">
            Connect BEAST MODE with your favorite tools for notifications and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationsManager
            userId={user?.id || (typeof window !== 'undefined' ? localStorage.getItem('beastModeUserId') || undefined : undefined)}
          />
        </CardContent>
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
          <CardHeader>
            <CardTitle className="text-white text-lg">System Status</CardTitle>
            <CardDescription className="text-slate-400">
              Monitor AI systems and integrations health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">BEAST MODE Core</span>
                <span className="text-green-400 font-semibold">✓ Operational</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">AI Assistant</span>
                <span className={`font-semibold ${data.conversationalAIStatus === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                  {data.conversationalAIStatus === 'operational' ? '✓ Ready' : '⚠ Limited'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Code Analysis</span>
                <span className="text-green-400 font-semibold">✓ Active</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Recommendations Engine</span>
                <span className="text-green-400 font-semibold">✓ Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300">Integrations</span>
                <span className="text-cyan-400 font-semibold">{data.integrations || 0} Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
