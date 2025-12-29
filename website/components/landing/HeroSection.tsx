"use client";

import React, { useState, useEffect } from 'react';

function HeroSection() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = "NEURAL INTELLIGENCE NETWORK";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fullText]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden neural-bg">
      {/* Quantum Field Background */}
      <div className="absolute inset-0 quantum-field"></div>

      {/* Neural Network Nodes */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
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

      {/* Floating Quantum Particles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neural-primary-glow rounded-full blur-3xl animate-quantum-float opacity-30"></div>
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-neural-secondary-glow rounded-full blur-3xl animate-quantum-float opacity-20" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-neural-success rounded-full blur-3xl animate-quantum-float opacity-25" style={{ animationDelay: '4s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-7xl mx-auto px-6">
        {/* Neural Network Logo */}
        <div className="mb-12">
          <div className="relative inline-flex items-center gap-6 mb-8">
            {/* AI Core Logo */}
            <div className="relative group">
              <div className="w-24 h-24 glass-card ai-glow flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
              </div>
              {/* Quantum Rings */}
              <div className="absolute inset-0 rounded-full border border-neural-primary/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border border-neural-secondary/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-4 rounded-full border border-neural-success/20 animate-ping" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Brand Name */}
            <div className="text-left">
              <h1 className="neural-display text-7xl md:text-9xl bg-gradient-to-r from-neural-primary via-neural-secondary to-neural-primary bg-clip-text text-transparent mb-2">
                BEAST MODE
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-neural-primary via-neural-secondary to-neural-primary rounded-full glass-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Neural Intelligence Tagline */}
        <div className="mb-12">
          <h2 className="neural-mono text-2xl md:text-4xl text-neural-primary mb-6 h-16 flex items-center justify-center font-light">
            {displayText}
            <span className="animate-pulse text-neural-secondary ml-1">▊</span>
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-5xl mx-auto leading-relaxed mb-8">
            The world's most advanced AI-powered development ecosystem.
            <br />
            <span className="text-neural-primary font-semibold">9 integrated neural networks</span> working in quantum harmony.
          </p>
        </div>

        {/* Intelligence Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="glass-card text-center p-6 hover:scale-105 transition-all duration-300">
            <div className="neural-display text-4xl text-neural-primary mb-2">97%</div>
            <div className="neural-body text-sm text-neural-gray-400 uppercase tracking-widest">Error Reduction</div>
            <div className="w-full h-1 bg-neural-primary/20 rounded-full mt-3">
              <div className="h-full bg-neural-primary rounded-full animate-pulse" style={{ width: '97%' }}></div>
            </div>
          </div>

          <div className="glass-card text-center p-6 hover:scale-105 transition-all duration-300">
            <div className="neural-display text-4xl text-neural-secondary mb-2">10x</div>
            <div className="neural-body text-sm text-neural-gray-400 uppercase tracking-widest">Acceleration</div>
            <div className="w-full h-1 bg-neural-secondary/20 rounded-full mt-3">
              <div className="h-full bg-neural-secondary rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="glass-card text-center p-6 hover:scale-105 transition-all duration-300">
            <div className="neural-display text-4xl text-neural-success mb-2">$2.5M</div>
            <div className="neural-body text-sm text-neural-gray-400 uppercase tracking-widest">Annual Savings</div>
            <div className="w-full h-1 bg-neural-success/20 rounded-full mt-3">
              <div className="h-full bg-neural-success rounded-full animate-pulse" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="glass-card text-center p-6 hover:scale-105 transition-all duration-300">
            <div className="neural-display text-4xl text-neural-warning mb-2">9/9</div>
            <div className="neural-body text-sm text-neural-gray-400 uppercase tracking-widest">AI Systems</div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="flex-1 h-1 bg-neural-primary/20 rounded-full">
                  <div className="h-full bg-neural-primary rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quantum CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <a href="/dashboard" className="future-button px-10 py-5 text-lg font-semibold text-neural-primary rounded-2xl">
            🚀 Launch Neural Dashboard
          </a>

          <button
            className="future-button px-10 py-5 text-lg font-semibold text-neural-secondary rounded-2xl"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            🧠 Explore Intelligence
          </button>
        </div>

        {/* Neural Network Status */}
        <div className="glass-card max-w-2xl mx-auto p-6 mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-3 h-3 bg-neural-success rounded-full animate-pulse"></div>
            <span className="neural-body text-neural-gray-300">All Neural Networks Operational</span>
            <div className="w-3 h-3 bg-neural-success rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="text-center">
            <span className="neural-mono text-sm text-neural-gray-400">
              Quantum Processing • Real-time Learning • Adaptive Intelligence
            </span>
          </div>
        </div>

        {/* Quantum Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="glass-card p-3 rounded-full animate-bounce">
            <div className="w-6 h-6 border-2 border-neural-primary/50 rounded-full flex justify-center items-center">
              <div className="w-1 h-2 bg-neural-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Neural Network Connections (Background Lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern id="neural-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10,50 Q50,10 90,50 Q50,90 10,50" stroke="rgb(var(--neural-primary))" strokeWidth="0.5" fill="none" opacity="0.3"/>
            <circle cx="10" cy="50" r="2" fill="rgb(var(--neural-primary))" opacity="0.6"/>
            <circle cx="90" cy="50" r="2" fill="rgb(var(--neural-primary))" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neural-pattern)" />
      </svg>
    </section>
  );
}

export default HeroSection;
