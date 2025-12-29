"use client";

import React, { useState } from 'react';
import HudButton from '../hud/HudButton';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-neural-gray-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Neural Logo */}
          <a href="/" className="flex items-center gap-4 hover:scale-105 transition-transform duration-300 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center ai-glow">
                <span className="text-xl">🧠</span>
              </div>
              <div className="absolute -inset-1 bg-neural-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div>
              <span className="neural-heading text-xl text-neural-primary">BEAST MODE</span>
              <div className="neural-mono text-xs text-neural-gray-500 -mt-1">Neural Intelligence</div>
            </div>
          </a>

          {/* Neural Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 font-medium"
            >
              Networks
            </button>
            <button
              onClick={() => scrollToSection('stats-section')}
              className="neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 font-medium"
            >
              Impact
            </button>
            <a
              href="/dashboard"
              className="neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 font-medium"
            >
              Dashboard
            </a>
            <div className="future-button px-6 py-2 text-sm font-semibold text-neural-primary">
              🚀 Launch
            </div>
          </div>

          {/* Neural Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-neural-primary p-2 hover:bg-neural-primary/10 rounded-lg transition-colors duration-300"
          >
            <span className="text-xl neural-mono">{isMenuOpen ? '×' : '≡'}</span>
          </button>
        </div>

        {/* Neural Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-neural-gray-700/50 glass-card -mx-6 px-6 py-4">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 py-2"
              >
                Networks
              </button>
              <button
                onClick={() => scrollToSection('stats-section')}
                className="text-left neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 py-2"
              >
                Impact
              </button>
              <a
                href="/dashboard"
                className="text-left neural-body text-neural-gray-300 hover:text-neural-primary transition-colors duration-300 py-2"
              >
                Dashboard
              </a>
              <div className="future-button px-6 py-3 text-sm font-semibold text-neural-primary w-full text-center mt-2">
                🚀 Launch Neural Dashboard
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
