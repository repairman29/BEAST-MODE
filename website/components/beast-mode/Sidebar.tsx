"use client";

import React, { useState, useEffect } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  category?: string;
  badge?: number;
}

interface SidebarProps {
  currentView: string | null;
  onViewChange: (view: string | null) => void;
  onCommandPalette: () => void;
}

export default function Sidebar({ currentView, onViewChange, onCommandPalette }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigationItems: SidebarItem[] = [
    // Core Tabs - Unforgettable Experience
    { id: 'quality', label: 'Quality', icon: '⚡', tooltip: 'Scan your code and see quality score instantly', category: 'Core' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠', tooltip: 'Ask questions, get AI recommendations and missions', category: 'Core' },
    { id: 'marketplace', label: 'Marketplace', icon: '📦', tooltip: 'Find and install plugins for your code', category: 'Core' },
    { id: 'self-improve', label: 'Improve', icon: '✨', tooltip: 'Auto-fix code issues with one click', category: 'Core' },
    { id: 'ml-monitoring', label: 'ML Monitoring', icon: '📊', tooltip: 'Real-time ML system monitoring and performance metrics', category: 'Core' },
    { id: 'settings', label: 'Settings', icon: '⚙️', tooltip: 'Manage teams, users, and preferences', category: 'Core' },
  ];

  const groupedItems = navigationItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-black/98 backdrop-blur-xl border-r border-slate-800/50 transition-all duration-300 ease-in-out z-[100] shadow-2xl ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-4 bg-gradient-to-r from-black/50 to-transparent">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 animate-in fade-in duration-200">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white text-sm">⚔️</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">BEAST MODE</span>
                <span className="text-slate-500 text-[10px] leading-tight">Code Quality</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white text-sm">⚔️</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto p-2 hover:bg-slate-900/50 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:scale-110 active:scale-95"
            title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="overflow-y-auto h-[calc(100vh-4rem)] py-4 custom-scrollbar">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6 last:mb-0">
              {!isCollapsed && (
                <div className="px-4 mb-3 animate-in fade-in slide-in-from-left-2 duration-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    {category}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = currentView === item.id;
                  const isHovered = hoveredItem === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => onViewChange(item.id)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 relative group ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border-l-2 border-cyan-500 shadow-lg shadow-cyan-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                        } ${isHovered && !isActive ? 'translate-x-1' : ''}`}
                        title={isCollapsed ? item.tooltip : undefined}
                        aria-label={item.label}
                      >
                        {/* Active indicator glow */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full"></div>
                        )}
                        <span className={`text-lg flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="flex-1 text-left font-medium transition-all duration-200">{item.label}</span>
                        )}
                        {isActive && !isCollapsed && (
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                      {/* Enhanced Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-lg shadow-2xl border border-slate-700/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 transform group-hover:translate-x-0 translate-x-[-4px]">
                          <div className="font-semibold mb-0.5">{item.label}</div>
                          <div className="text-slate-400 text-[10px]">{item.tooltip}</div>
                          {/* Tooltip arrow */}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900/95"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Command Palette Button */}
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <button
              onClick={onCommandPalette}
              onMouseEnter={() => setHoveredItem('command-palette')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all duration-200 relative group ${
                hoveredItem === 'command-palette' ? 'translate-x-1' : ''
              }`}
              title={isCollapsed ? 'Command Palette (⌘K)' : undefined}
              aria-label="Command Palette"
            >
              <span className="text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110">⌘</span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left font-medium">Command Palette</span>
                  <span className="text-[10px] text-slate-600">⌘K</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </>
  );
}
