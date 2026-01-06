"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';

const metrics = [
  { value: '$0.0007', label: 'Cost per API Call', desc: 'Infrastructure cost (verified)', highlight: true },
  { value: '10K', label: 'Free Calls/Month', desc: 'Free forever tier (no credit card)', highlight: true },
  { value: '9', label: 'AI Systems', desc: 'Integrated AI capabilities', highlight: false },
  { value: 'MIT', label: 'Core License', desc: 'Open source core library', highlight: false }
];

const useCases = [
  {
    title: 'For Solo Developers',
    items: [
      'No one to review your code? Get instant quality feedback',
      'Don\'t know if code is good? See your score (0-100) in seconds',
      'Hard to find the right tools? Get personalized recommendations',
      'Questions about your code? AI answers 24/7 based on YOUR codebase',
      'Want to improve? Track your quality score over time',
      'Free forever tier: 10K API calls/month, no credit card required'
    ]
  },
  {
    title: 'For Teams',
    items: [
      'Inconsistent code quality? Team metrics show you exactly where',
      'Slow code reviews? Plain English diffs make reviews 3x faster',
      'Hard to onboard new devs? AI answers questions about your codebase',
      'Technical debt piling up? Silent refactoring fixes it overnight',
      'Bugs in production? Automated fixes catch issues before they ship',
      'Too many tools? All 9 AI systems in one platform, one dashboard'
    ]
  }
];

function StatsSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Metrics */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Problems We Solve for Development Teams
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Real problems developers face every day—and how BEAST MODE solves them
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">❓</div>
              <h3 className="text-lg font-semibold text-white mb-2">Don't Know If Code Is Good</h3>
              <p className="text-sm text-slate-400">
                Get instant quality scores (0-100) in seconds. See exactly what's wrong and how to fix it. No more guessing.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">🐛</div>
              <h3 className="text-lg font-semibold text-white mb-2">Bugs Slip Into Production</h3>
              <p className="text-sm text-slate-400">
                Automated fixes run overnight. Security holes closed automatically. Issues fixed before you even see them.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">⏰</div>
              <h3 className="text-lg font-semibold text-white mb-2">Slow Code Reviews</h3>
              <p className="text-sm text-slate-400">
                Plain English diffs make reviews 3x faster. Automated quality checks catch issues before review.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">🏗️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Technical Debt Accumulates</h3>
              <p className="text-sm text-slate-400">
                Silent refactoring runs overnight. Architecture enforced automatically. Code improves while you sleep.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-white mb-2">Hard to Onboard New Devs</h3>
              <p className="text-sm text-slate-400">
                AI answers questions about YOUR codebase 24/7. New devs productive faster with instant context.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-slate-900 hover:border-cyan-500/30 transition-all">
            <CardContent className="p-8">
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-white mb-2">Too Many Tools to Manage</h3>
              <p className="text-sm text-slate-400">
                All 9 AI systems in one platform. No juggling multiple tools. One dashboard, everything you need.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="bg-black/50 border-slate-900">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold text-white mb-8">
                  {useCase.title}
                </h3>
                <ul className="space-y-4">
                  {useCase.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
