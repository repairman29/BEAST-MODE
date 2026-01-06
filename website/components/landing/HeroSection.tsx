"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

function HeroSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard?view=auth&action=signup');
  };

  const handleViewDemo = () => {
    router.push('/dashboard');
  };

  const handleGitHubLogin = (e?: React.MouseEvent) => {
    console.log('🔵 [HeroSection] GitHub login button clicked');
    e?.preventDefault();
    e?.stopPropagation();
    console.log('   Redirecting to /api/github/oauth/authorize');
    // Redirect to GitHub OAuth
    window.location.href = '/api/github/oauth/authorize';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              🛡️ Day 2 Operations Platform
            </Badge>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
              BEAST MODE
              <br />
              <span className="text-gradient-cyan">Day 2 Operations</span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-400 max-w-xl leading-relaxed font-semibold mb-2">
              Stop Guessing If Your Code Is Good
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              Tired of wondering if your code is production-ready? Spending hours on code reviews? Dealing with bugs that slip into production? <strong className="text-white">BEAST MODE tells you what's wrong, fixes it automatically, and maintains your codebase while you sleep.</strong> All in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleGetStarted}
              >
                Join the Vibe 🚀
              </Button>
              <a
                href="/api/github/oauth/authorize"
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium transition-colors border border-slate-800 hover:bg-slate-900 text-white cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Login with GitHub
              </a>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-800 hover:bg-slate-900 text-white"
                onClick={handleViewDemo}
              >
                See It in Action
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-400">10K free calls/month</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-400">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-400">MIT License (core)</span>
              </div>
            </div>
          </div>

          {/* Right: Code Example */}
          <div className="space-y-6">
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl"></div>
              
              {/* Terminal header */}
              <div className="relative flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-xs text-slate-500 font-mono">beast-mode.js</span>
              </div>

              {/* Code */}
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

              {/* Result badge */}
              <div className="relative mt-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-sm font-semibold text-green-400">Silent Janitor Active</div>
                  <div className="text-xs text-slate-500">23 issues fixed • 5 PRs merged</div>
                </div>
              </div>
            </div>

            {/* Stats below the code editor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-gradient-purple mb-1">10s</div>
                <div className="text-xs text-slate-500">Quality Score</div>
              </div>
              <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-gradient-cyan mb-1">0-100</div>
                <div className="text-xs text-slate-500">Score Range</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
