"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';

interface MobileNavigationProps {
  currentView: string | null;
  onViewChange: (view: string | null) => void;
  onCommandPalette: () => void;
}

export default function MobileNavigation({ currentView, onViewChange, onCommandPalette }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Swipe to close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !isOpen) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    if (diff > 0 && menuRef.current) {
      menuRef.current.style.transform = `translateX(-${Math.min(diff, 256)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startX.current - currentX.current;
    if (diff > 100) {
      setIsOpen(false);
    }
    if (menuRef.current) {
      menuRef.current.style.transform = '';
    }
  };

  const navigationItems = [
    { id: 'quality', label: 'Quality', icon: '⚡', shortcut: '1' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠', shortcut: '2' },
    { id: 'marketplace', label: 'Marketplace', icon: '📦', shortcut: '3' },
    { id: 'self-improve', label: 'Improve', icon: '✨', shortcut: '4' },
    { id: 'collaboration', label: 'Collaboration', icon: '👥', shortcut: '5' },
    { id: 'ml-monitoring', label: 'ML Monitoring', icon: '📊', shortcut: '6' },
    { id: 'settings', label: 'Settings', icon: '⚙️', shortcut: '7' },
  ];

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button - Enhanced */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg text-white hover:bg-slate-800 active:bg-slate-700 transition-all shadow-lg touch-manipulation"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile Menu Overlay - Enhanced with swipe */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed top-0 left-0 h-full w-64 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 z-50 overflow-y-auto shadow-2xl transition-transform duration-200"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="p-4 space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="text-white font-bold text-lg">BEAST MODE</div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              
              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all touch-manipulation ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-slate-300 active:bg-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <kbd className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              ))}

              {/* Command Palette */}
              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => {
                    onCommandPalette();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 active:bg-slate-800 hover:bg-slate-800/50 transition-all touch-manipulation"
                >
                  <span className="text-xl">⌘</span>
                  <span className="font-medium">Command Palette</span>
                </button>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 mt-4 text-xs text-slate-500 text-center">
                Swipe left to close
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

