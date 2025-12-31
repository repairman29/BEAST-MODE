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
              🎸 Built for Vibe Coders
            </Badge>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
              BEAST MODE
              <br />
              <span className="text-gradient-cyan">Ship with Style</span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-400 max-w-xl leading-relaxed font-semibold mb-2">
              Code Better. Ship Faster. Have Fun.
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              AI-powered development companion for vibe coders who build with passion and ship with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleGetStarted}
              >
                Join the Vibe 🚀
              </Button>
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
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>10K free calls/month</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>MIT License</span>
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
  oracle: { enabled: true },
  codeRoach: { enabled: true }
});

await beastMode.initialize();

// Analyze code quality
const quality = await beastMode
  .analyzeQuality('./src');

console.log(\`Score: \${quality.score}/100\`);
// → Score: 87/100 (A+)

// Deploy automatically
await beastMode.deployApplication({
  platform: 'vercel',
  environment: 'production'
});`}</code>
                </pre>
              </div>

              {/* Result badge */}
              <div className="relative mt-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="text-sm font-semibold text-green-400">Quality Score: 87/100</div>
                  <div className="text-xs text-slate-500">Grade: A+ • 12 issues found</div>
                </div>
              </div>
            </div>

            {/* Stats below the code editor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-gradient-purple mb-1">10x</div>
                <div className="text-xs text-slate-500">Faster Reviews</div>
              </div>
              <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-gradient-cyan mb-1">97%</div>
                <div className="text-xs text-slate-500">Bug Reduction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
