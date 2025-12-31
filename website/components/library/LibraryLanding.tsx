"use client";

import React from 'react';

function LibraryLanding() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden neural-bg">
      {/* Quantum Field Background */}
      <div className="absolute inset-0 quantum-field opacity-50"></div>

      {/* Neural Network Nodes */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute neural-node synapse-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        {/* Library Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 glass-card text-sm neural-mono">
            <div className="w-2 h-2 bg-neural-success rounded-full animate-pulse"></div>
            <span className="text-neural-gray-300">Enterprise Library</span>
            <div className="w-2 h-2 bg-neural-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Library Title */}
        <div className="mb-8">
          <h1 className="neural-display text-6xl md:text-8xl text-neural-primary mb-6">
            BEAST MODE
          </h1>
          <div className="text-2xl md:text-3xl neural-body text-neural-gray-300 mb-6">
            Neural Intelligence Library
          </div>
          <p className="text-xl md:text-2xl text-neural-gray-400 max-w-4xl mx-auto leading-relaxed">
            AI-powered development tools for vibe coders who ship with style.
            <br />
            <span className="text-neural-primary font-semibold">9 integrated neural networks</span> in a single JavaScript library.
          </p>
        </div>

        {/* Library Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="glass-card text-center p-6">
            <div className="neural-display text-3xl text-neural-primary mb-2">9</div>
            <div className="neural-body text-sm text-neural-gray-400">AI Systems</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-3xl text-neural-secondary mb-2">15K+</div>
            <div className="neural-body text-sm text-neural-gray-400">Lines of Code</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-3xl text-neural-success mb-2">MIT</div>
            <div className="neural-body text-sm text-neural-gray-400">License</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-3xl text-neural-warning mb-2">v1.0</div>
            <div className="neural-body text-sm text-neural-gray-400">Stable Release</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <div className="future-button px-8 py-4 text-lg font-semibold text-neural-primary">
            📦 Install BEAST MODE
          </div>

          <a href="#demo" className="future-button px-8 py-4 text-lg font-semibold text-neural-secondary">
            🚀 Try Live Demo
          </a>
        </div>

        {/* Installation Code */}
        <div className="glass-card max-w-2xl mx-auto p-6 mb-12">
          <div className="text-left">
            <div className="neural-mono text-sm text-neural-gray-400 mb-3">Install via npm:</div>
            <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
              <code className="neural-mono text-neural-primary text-sm">
                npm install @beast-mode/core
              </code>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="glass-card p-3 rounded-full animate-bounce">
            <div className="w-6 h-6 border-2 border-neural-primary/50 rounded-full flex justify-center items-center">
              <div className="w-1 h-2 bg-neural-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Neural Network Connections (Background) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern id="library-neural-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="2" fill="rgb(var(--neural-primary))" opacity="0.6"/>
            <path d="M40,40 L60,20 M40,40 L60,60 M40,40 L20,60 M40,40 L20,20" stroke="rgb(var(--neural-primary))" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#library-neural-pattern)" />
      </svg>
    </section>
  );
}

export default LibraryLanding;
