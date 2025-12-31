"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface MobileNavigationProps {
  currentView: string | null;
  onViewChange: (view: string | null) => void;
  onCommandPalette: () => void;
}

export default function MobileNavigation({ currentView, onViewChange, onCommandPalette }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    { id: 'quality', label: 'Quality', icon: '⚡' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
    { id: 'marketplace', label: 'Marketplace', icon: '📦' },
    { id: 'self-improve', label: 'Improve', icon: '✨' },
    { id: 'collaboration', label: 'Collaboration', icon: '👥' },
    { id: 'ml-monitoring', label: 'ML Monitoring', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-white hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 overflow-y-auto">
            <div className="p-4 space-y-2">
              <div className="text-white font-bold text-lg mb-4 px-2">BEAST MODE</div>
              
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => {
                    onCommandPalette();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <span>⌘</span>
                  <span>Command Palette</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

