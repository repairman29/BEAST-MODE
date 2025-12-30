"use client";

import React, { useState } from 'react';
import { Button } from '../ui/button';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-white">BEAST MODE</span>
              <div className="text-xs text-slate-500 -mt-1">Code Quality Platform</div>
            </div>
          </a>

          {/* Desktop Navigation - Always visible */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </button>
            <a
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Dashboard
            </a>
            <Button variant="default" className="bg-white text-black hover:bg-slate-100">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button - Hidden on desktop */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-slate-400 p-2 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          >
            <span className="text-xl">{isMenuOpen ? '×' : '≡'}</span>
          </button>
        </div>

        {/* Mobile Menu - Only show on small screens */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-slate-900">
            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-slate-400 hover:text-white transition-colors py-2"
              >
                Features
              </button>
              <a
                href="/dashboard"
                className="text-left text-slate-400 hover:text-white transition-colors py-2"
              >
                Dashboard
              </a>
              <Button variant="default" className="bg-white text-black hover:bg-slate-100 w-full">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
