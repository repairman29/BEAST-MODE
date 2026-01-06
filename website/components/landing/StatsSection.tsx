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
    title: 'What You Get',
    items: [
      'Instant code quality scores (0-100) in seconds',
      'All 9 AI systems integrated in one platform',
      'Day 2 Operations: Silent refactoring while you sleep',
      'Automated fixes for common code issues',
      'Track improvement over time with analytics',
      'Free forever tier: 10K API calls/month (MIT licensed)'
    ]
  },
  {
    title: 'Competitive Advantages',
    items: [
      'Lower entry price than CodeClimate ($79 vs $99/month)',
      'More generous free tier than competitors (10K calls vs trials)',
      'Unique Day 2 Operations feature (AI Janitor)',
      'All-in-one platform (9 AI systems vs single-purpose tools)',
      'Flat pricing (better for teams than per-user pricing)',
      '70-80% gross margins enable sustainable scaling'
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
            Transparent Infrastructure & Pricing
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Verified metrics from our infrastructure analysis and competitive research
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {metrics.map((metric) => (
            <Card 
              key={metric.label} 
              className={`bg-black/50 border-slate-900 text-center hover:border-slate-800 transition-all ${
                metric.highlight ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent' : ''
              }`}
            >
              <CardContent className="p-8">
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${
                  metric.highlight ? 'text-gradient-cyan' : 'text-gradient-purple'
                }`}>
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-slate-500">
                  {metric.desc}
                </div>
              </CardContent>
            </Card>
          ))}
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
