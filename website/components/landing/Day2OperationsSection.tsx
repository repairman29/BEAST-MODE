"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';

const day2Features = [
  {
    title: 'Silent Refactoring Engine',
    description: 'Overnight code cleanup (2 AM - 6 AM). Automatic de-duplication, security fixes, and quality improvements. Wake up to clean code.',
    icon: '🧹',
    gradient: 'from-purple-500 to-pink-500',
    image: '/assets/overnight-refactoring-cycle.png'
  },
  {
    title: 'Architecture Enforcement',
    description: 'Pre-commit hooks prevent bad patterns. Blocks secrets, enforces separation of concerns, auto-fixes violations.',
    icon: '🛡️',
    gradient: 'from-blue-500 to-cyan-500',
    image: '/assets/governance-layer-architecture.png'
  },
  {
    title: 'Vibe Restoration',
    description: 'Tracks code state, detects regressions, restores to last good state. Never lose your vibe.',
    icon: '⏮️',
    gradient: 'from-green-500 to-emerald-500',
    image: '/assets/before-after-transformation.png'
  },
  {
    title: 'Repo-Level Memory',
    description: 'Semantic graph of your entire codebase. Preserves context, understands architecture, prevents drift.',
    icon: '🧠',
    gradient: 'from-indigo-500 to-purple-500',
    image: '/assets/three-walls-solution-map.png'
  },
  {
    title: 'Vibe Ops (QA for English)',
    description: 'Test in plain English. Visual AI agents spin up browsers, click through flows, report in human language.',
    icon: '🤖',
    gradient: 'from-cyan-500 to-blue-500',
    image: '/assets/english-as-source-code-workflow.png'
  },
  {
    title: 'Invisible CI/CD',
    description: 'Silent linting, background testing, security scanning. Auto-fixes without you seeing the CLI.',
    icon: '👻',
    gradient: 'from-orange-500 to-red-500',
    image: '/assets/market-positioning-map.png'
  }
];

function Day2OperationsSection() {
  return (
    <section id="day2-operations" className="py-32 px-6 relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-full text-sm font-semibold">
              🎯 Day 2 Operations Platform
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            The AI Janitor
            <br />
            <span className="text-gradient-cyan">That Works While You Sleep</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            While tools like Cursor, Windsurf, and Replit help you <strong className="text-white">generate</strong> code, 
            BEAST MODE helps you <strong className="text-white">maintain</strong> it. 
            Silent refactoring, architecture enforcement, and invisible CI/CD—all automated.
          </p>
        </div>

        {/* The 3 Walls */}
        <div className="mb-20">
          <Card className="bg-black/50 border-slate-900">
            <CardHeader>
              <CardTitle className="text-3xl text-white mb-4">Solving the 3 Walls of Vibe Coding</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Every vibe coder hits these walls. BEAST MODE breaks through all of them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-4xl mb-3">🧱</div>
                  <h3 className="text-xl font-bold text-white mb-2">The 90% Wall</h3>
                  <p className="text-slate-400 text-sm mb-4">AI forgets architecture as codebase grows</p>
                  <div className="text-cyan-400 text-sm font-semibold">✅ Solved: Repo Memory + Architecture Enforcement</div>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-4xl mb-3">🏛️</div>
                  <h3 className="text-xl font-bold text-white mb-2">The Brownfield Wall</h3>
                  <p className="text-slate-400 text-sm mb-4">Vibe coding useless for legacy monoliths</p>
                  <div className="text-cyan-400 text-sm font-semibold">✅ Solved: Safe Mode Wrapper</div>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-4xl mb-3">🔒</div>
                  <h3 className="text-xl font-bold text-white mb-2">The Liability Wall</h3>
                  <p className="text-slate-400 text-sm mb-4">Hardcoded secrets, security flaws</p>
                  <div className="text-cyan-400 text-sm font-semibold">✅ Solved: Invisible CI/CD + Architecture Enforcement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {day2Features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all hover:shadow-xl hover:shadow-purple-500/5 group"
            >
              <CardHeader>
                <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Governance Layer Visual */}
        <div className="mb-20">
          <Card className="bg-black/50 border-slate-900">
            <CardHeader>
              <CardTitle className="text-3xl text-white mb-4">The Governance Layer</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                We COMPLEMENT code generation tools. We don't compete. We are the FILTER, not the GENERATOR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-auto rounded-lg overflow-hidden border border-slate-800">
                <img 
                  src="/assets/governance-layer-architecture.png" 
                  alt="BEAST MODE Governance Layer Architecture"
                  className="w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dual-Brand Strategy */}
        <div className="mb-20">
          <Card className="bg-black/50 border-slate-900">
            <CardHeader>
              <CardTitle className="text-3xl text-white mb-4">The Mullet Strategy</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Same technology, different positioning. BEAST MODE for community energy. SENTINEL for enterprise trust.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-auto rounded-lg overflow-hidden border border-slate-800">
                <img 
                  src="/assets/mullet-strategy-dual-brand.png" 
                  alt="BEAST MODE / SENTINEL Dual-Brand Strategy"
                  className="w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-slate-950/50 border-slate-900 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Ready to Wake Up to Clean Code?</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Let BEAST MODE handle the maintenance while you focus on building.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/dashboard"
                className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Start Free Trial
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default Day2OperationsSection;

