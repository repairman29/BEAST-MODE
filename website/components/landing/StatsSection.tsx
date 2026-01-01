"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';

const metrics = [
  { value: '23', label: 'Issues Fixed', desc: 'Per overnight cycle' },
  { value: '99.9%', label: 'Confidence', desc: 'Auto-merge threshold' },
  { value: '100%', label: 'Core Coverage', desc: 'System tests passing' },
  { value: '2-6 AM', label: 'Silent Hours', desc: 'Overnight refactoring' }
];

const useCases = [
  {
    title: 'For Vibe Coders',
    items: [
      'Wake up to clean code',
      'Silent overnight refactoring',
      'Architecture enforcement',
      'Invisible CI/CD'
    ]
  },
  {
    title: 'For Enterprise (SENTINEL)',
    items: [
      'Plain English code reviews',
      'Compliance & audit logs',
      '99.9% confidence threshold',
      'White-label & SSO'
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {metrics.map((metric) => (
            <Card key={metric.label} className="bg-black/50 border-slate-900 text-center hover:border-slate-800 transition-all">
              <CardContent className="p-8">
                <div className="text-4xl md:text-5xl font-bold text-gradient-cyan mb-2">
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
