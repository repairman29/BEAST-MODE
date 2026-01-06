"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const valueMetrics = [
  {
    title: 'Infrastructure Cost',
    value: '$0.0007',
    unit: 'per API call',
    description: 'Verified infrastructure cost (from cost analysis)',
    icon: '💰',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Free Tier',
    value: '10K',
    unit: 'calls/month',
    description: 'Free forever - no credit card required',
    icon: '🎁',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'AI Systems',
    value: '9',
    unit: 'integrated',
    description: 'All AI capabilities in one platform',
    icon: '🤖',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Entry Price',
    value: '$79',
    unit: '/month',
    description: 'Lower than CodeClimate ($99) and many competitors',
    icon: '💎',
    gradient: 'from-orange-500 to-red-500'
  }
];

const competitiveAdvantages = [
  {
    title: 'Lower Entry Price',
    comparison: 'vs CodeClimate ($99)',
    advantage: '$79/month',
    description: 'More affordable than CodeClimate, SonarQube Enterprise, and other code quality tools'
  },
  {
    title: 'More Generous Free Tier',
    comparison: 'vs competitors',
    advantage: '10K calls/month',
    description: 'Most competitors offer trials only. We offer a free forever tier with real value.'
  },
  {
    title: 'All-in-One Platform',
    comparison: 'vs single-purpose tools',
    advantage: '9 AI systems',
    description: 'Quality, analysis, recommendations, marketplace, deployment - all in one place'
  }
];

function ValueSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Verified Metrics
            <br />
            <span className="text-gradient-cyan">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Data-backed information about BEAST MODE's infrastructure costs, pricing, and competitive advantages.
          </p>
        </div>

        {/* Value Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {valueMetrics.map((metric) => (
            <Card
              key={metric.title}
              className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <CardHeader>
                <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center text-2xl`}>
                  {metric.icon}
                </div>
                <CardTitle className="text-white">{metric.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {metric.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gradient-cyan mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-slate-500">{metric.unit}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Competitive Advantages */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Competitive Advantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {competitiveAdvantages.map((advantage) => (
              <Card
                key={advantage.title}
                className="bg-slate-950/50 border-slate-900 hover:border-cyan-500/30 transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-white text-xl">{advantage.title}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    {advantage.comparison}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-cyan-400 mb-2">
                      {advantage.advantage}
                    </div>
                    <p className="text-slate-300 text-sm">
                      {advantage.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Transparent Pricing</CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Simple, fair pricing based on verified infrastructure costs and competitive analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-semibold text-white mb-3">What You Get</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>9 integrated AI systems in one platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>Day 2 Operations (silent refactoring, architecture enforcement)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>Instant code quality scores (0-100)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>Automated fixes and recommendations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-3">Pricing Tiers</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Free: $0 forever (10K calls/month, MIT license)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Developer: $79/month (100K calls)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Team: $299/month (500K calls)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Enterprise: $799/month (unlimited)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default ValueSection;

