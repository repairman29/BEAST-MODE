"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonEnhanced } from '../ui/ButtonEnhanced';
import { Badge } from '../ui/badge';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

/**
 * Enhanced Hero Section
 * 
 * UX Principles Applied:
 * 1. Visual Hierarchy - Clear primary action, secondary actions
 * 2. Cognitive Load Reduction - Simple, focused message
 * 3. Feedback & Affordances - Hover states, loading states
 * 4. Progressive Disclosure - Animated elements reveal gradually
 * 5. Delight - Smooth animations, micro-interactions
 */
function HeroSectionEnhanced() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    router.push('/dashboard?view=auth&action=signup');
  };

  const handleViewDemo = () => {
    router.push('/dashboard');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Background with depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      
      {/* Animated grid overlay - more subtle */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-50"
        style={{ animation: 'gridMove 20s linear infinite' }}
      ></div>
      
      {/* Enhanced gradient orbs with animation */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl"></div>

      {/* Content with staggered animations */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content - Enhanced typography hierarchy */}
          <div 
            className={`space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Badge with better visual weight */}
            <div className="inline-block">
              <Badge 
                variant="secondary" 
                className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-cyan-500/15 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
                Day 2 Operations Platform
              </Badge>
            </div>

            {/* Hero heading with better spacing and hierarchy */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
                BEAST MODE
                <br />
                <span className="text-gradient-cyan bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  Day 2 Operations
                </span>
              </h1>
              
              {/* Brand tagline - primary message */}
              <p className="text-2xl md:text-3xl text-cyan-400 max-w-xl leading-tight font-semibold">
                Become a better developer, faster.
              </p>
              
              {/* Value proposition - clearer hierarchy */}
              <p className="text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed">
                See your code quality in 10 seconds. Get automated fixes. Wake up to clean code. All in one platform.
              </p>
              
              <p className="text-lg md:text-xl text-white max-w-xl leading-relaxed font-medium">
                <strong>BEAST MODE tells you what's wrong, fixes it automatically, and maintains your codebase while you sleep.</strong>
              </p>
            </div>

            {/* Enhanced CTA section with clear hierarchy */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <ButtonEnhanced 
                size="lg" 
                variant="gradient"
                icon={<Zap className="w-5 h-5" />}
                iconPosition="left"
                onClick={handleGetStarted}
                className="shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                Join the Vibe
              </ButtonEnhanced>
              
              <ButtonEnhanced 
                size="lg" 
                variant="outline"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                onClick={handleViewDemo}
              >
                See It in Action
              </ButtonEnhanced>
            </div>

            {/* Trust indicators - better visual grouping */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-800/50">
              {[
                { icon: '✓', text: '10K free calls/month', color: 'text-green-400' },
                { icon: '✓', text: 'No credit card', color: 'text-green-400' },
                { icon: '✓', text: 'MIT License (core)', color: 'text-green-400' }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 text-sm group"
                >
                  <span className={`${item.color} font-semibold group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code Example - Enhanced with better visual feedback */}
          <div 
            className={`space-y-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="relative bg-slate-950/95 border border-slate-800/50 rounded-xl p-6 md:p-8 shadow-2xl hover:border-slate-700/50 transition-all duration-300 group">
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              
              {/* Terminal header with better styling */}
              <div className="relative flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                </div>
                <span className="ml-4 text-xs text-slate-500 font-mono">beast-mode.js</span>
              </div>

              {/* Code with syntax highlighting feel */}
              <div className="relative">
                <pre className="text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto">
                  <code>{`import { BeastMode } from 
  '@beast-mode/core';

const beastMode = new BeastMode({
  janitor: {
    enabled: true,
    overnightMode: true,
    autoMerge: true
  }
});

await beastMode.initialize();

// Silent refactoring runs 2 AM - 6 AM
// Architecture enforcement on every commit
// Invisible CI/CD in background

// Wake up to clean code
const status = await beastMode
  .janitor.getStatus();

console.log(\`Fixed: \${status.fixed}\`);
// → Fixed: 23 issues
// → Merged: 5 PRs
// → Security: 3 holes closed`}</code>
                </pre>
              </div>

              {/* Enhanced result badge with animation */}
              <div className="relative mt-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm hover:bg-green-500/15 transition-colors">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-400">Silent Janitor Active</div>
                  <div className="text-xs text-slate-400">23 issues fixed • 5 PRs merged</div>
                </div>
              </div>
            </div>

            {/* Enhanced stats with hover effects */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '10s', label: 'Quality Score', gradient: 'from-purple-500 to-pink-500' },
                { value: '0-100', label: 'Score Range', gradient: 'from-cyan-500 to-blue-500' }
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  className="bg-black/50 border border-slate-800/50 rounded-xl p-4 shadow-xl hover:border-slate-700/50 hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(64px, 64px); }
        }
      `}</style>
    </section>
  );
}

export default HeroSectionEnhanced;
