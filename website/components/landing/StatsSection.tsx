"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';

const metrics = [
  { value: '10+', label: 'Hours Saved/Week', desc: 'Average time saved per developer', highlight: true },
  { value: '5-10x', label: 'ROI', desc: 'Return on investment in time savings', highlight: true },
  { value: '97%', label: 'Error Reduction', desc: 'Fewer bugs and issues in production' },
  { value: '$2.5M', label: 'Annual Savings', desc: 'Potential savings for enterprise teams' }
];

const useCases = [
  {
    title: 'Value You Get',
    items: [
      'Save 10+ hours per week per developer',
      '5-10x ROI in time savings alone',
      '97% reduction in production errors',
      'Instant quality scores (0-100) in seconds',
      'Automated fixes while you sleep (Day 2 Operations)',
      'Track improvement over time with analytics'
    ]
  },
  {
    title: 'Customer Success',
    items: [
      'Teams ship 40% faster with automated quality checks',
      'Average $50K+ saved annually per team',
      '99.9% uptime SLA for Team and Enterprise tiers',
      '24/7 AI Janitor works overnight to fix issues',
      'Plain English diffs make code reviews 3x faster',
      'Enterprise guardrail prevents costly mistakes'
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
            Proven Results for Development Teams
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Real metrics from teams using BEAST MODE to ship better code faster
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
