"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const features = [
  {
    title: 'Silent Refactoring',
    description: 'Overnight code cleanup. Automatic de-duplication, security fixes, and quality improvements while you sleep.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Architecture Enforcement',
    description: 'Pre-commit hooks prevent bad patterns. Blocks secrets, enforces separation of concerns, auto-fixes violations.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Vibe Restoration',
    description: 'Tracks code state, detects regressions, restores to last good state. Never lose your vibe.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Repo Memory',
    description: 'Semantic graph of your entire codebase. Preserves context, understands architecture, prevents drift.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Vibe Ops',
    description: 'Test in plain English. Visual AI agents spin up browsers, click through flows, report in human language.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Invisible CI/CD',
    description: 'Silent linting, background testing, security scanning. Auto-fixes without you seeing the CLI.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-500'
  }
];

function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Day 2 Operations
            <br />
            <span className="text-gradient-cyan">Built In</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Six powerful janitor systems working together to maintain, secure, and optimize your AI-generated code automatically.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <CardHeader>
                <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white`}>
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

        {/* CTA */}
        <div className="mt-20 text-center">
          <Card className="bg-slate-950/50 border-slate-900 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl text-white">The Complete AI Janitor</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                These systems work together to maintain your codebase silently. Architecture enforcement, 
                security scanning, and automatic refactoring—all while you focus on building.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/dashboard"
                className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Explore All Features
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
