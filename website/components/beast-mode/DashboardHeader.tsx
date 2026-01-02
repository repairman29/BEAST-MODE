"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface DashboardHeaderProps {
  user?: {
    email: string;
    name?: string;
    plan?: string;
  } | null;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function DashboardHeader({ user, onSignOut, isSidebarCollapsed = false }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leftOffset = isSidebarCollapsed ? 'left-16' : 'left-64';

  if (!mounted) {
    return (
      <div className={`fixed top-0 ${leftOffset} right-0 h-16 bg-black/95 backdrop-blur-xl border-b border-slate-800/50 z-[90] transition-all duration-300 ease-in-out`}></div>
    );
  }

  return (
    <header className={`fixed top-0 ${leftOffset} right-0 h-16 bg-black/95 backdrop-blur-xl border-b border-slate-800/50 z-[90] flex items-center justify-between px-6 transition-all duration-300 ease-in-out`}>
      {/* Left: Logo/Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-white text-sm">⚔️</span>
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-bold text-white">BEAST MODE</div>
          <div className="text-[10px] text-slate-500">Code Quality Platform</div>
        </div>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-medium text-white">{user.name || user.email.split('@')[0]}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user.plan || 'free'} plan</div>
              </div>
            </div>
            {onSignOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
                className="border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                Sign Out
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              // Navigate to auth view - this will be handled by parent
              window.location.hash = '#auth';
            }}
            className="bg-white text-black hover:bg-slate-100"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}

