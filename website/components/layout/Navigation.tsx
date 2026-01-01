"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

function Navigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleGetStarted = () => {
    router.push('/dashboard?view=auth&action=signup');
  };

  const handleGitHubLogin = (e?: React.MouseEvent) => {
    console.log('🔵 [Navigation] GitHub login button clicked');
    e?.preventDefault();
    e?.stopPropagation();
    console.log('   Redirecting to /api/github/oauth/authorize');
    // Redirect to GitHub OAuth
    window.location.href = '/api/github/oauth/authorize';
  };

  // Hide navigation on dashboard page
  const isDashboard = typeof window !== 'undefined' && window.location.pathname === '/dashboard';
  
  if (isDashboard) {
    return null;
  }

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection('features')}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </button>
            <a
              href="/docs"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Documentation
            </a>
            <a
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/api/github/oauth/authorize"
              className="hidden sm:inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors border border-slate-700 hover:bg-slate-900 text-white cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
            <Button 
              variant="default" 
              className="bg-white text-black hover:bg-slate-100"
              onClick={handleGetStarted}
            >
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
                href="/docs"
                className="text-left text-slate-400 hover:text-white transition-colors py-2"
              >
                Documentation
              </a>
              <a
                href="/dashboard"
                className="text-left text-slate-400 hover:text-white transition-colors py-2"
              >
                Dashboard
              </a>
              <a
                href="/api/github/oauth/authorize"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-slate-700 hover:bg-slate-900 text-white cursor-pointer w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Login with GitHub
              </a>
              <Button 
                variant="default" 
                className="bg-white text-black hover:bg-slate-100 w-full"
                onClick={handleGetStarted}
              >
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
