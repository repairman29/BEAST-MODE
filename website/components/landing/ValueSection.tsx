"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const valueMetrics = [
  {
    title: 'Time Savings',
    value: '16-30',
    unit: 'hours/week',
    description: 'Per developer - focus on building, not fixing',
    icon: '⏰',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Cost Savings',
    value: '$65K-$325K',
    unit: 'per year',
    description: 'Per team - reduce technical debt and maintenance costs',
    icon: '💰',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Quality Improvement',
    value: '+25',
    unit: 'points',
    description: 'Average quality score improvement in first month',
    icon: '📈',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Faster Onboarding',
    value: '50%',
    unit: 'faster',
    description: 'New developers productive faster with AI assistance',
    icon: '🚀',
    gradient: 'from-orange-500 to-red-500'
  }
];

const roiExamples = [
  {
    scenario: 'Solo Developer',
    timeSaved: '20 hours/week',
    value: '$2,080/month',
    cost: '$79/month',
    roi: '26x ROI',
    description: 'Save 20 hours/week × $50/hour = $4,000/month value'
  },
  {
    scenario: 'Small Team (5 devs)',
    timeSaved: '100 hours/week',
    value: '$20,000/month',
    cost: '$299/month',
    roi: '67x ROI',
    description: '5 devs × 20 hours/week × $50/hour = $20,000/month value'
  },
  {
    scenario: 'Mid-Size Team (20 devs)',
    timeSaved: '400 hours/week',
    value: '$80,000/month',
    cost: '$799/month',
    roi: '100x ROI',
    description: '20 devs × 20 hours/week × $50/hour = $80,000/month value'
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
            Measurable Value
            <br />
            <span className="text-gradient-cyan">Real Results</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            BEAST MODE delivers quantifiable improvements. See how teams save time, reduce costs, and improve code quality.
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

        {/* ROI Examples */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Real ROI Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roiExamples.map((example) => (
              <Card
                key={example.scenario}
                className="bg-slate-950/50 border-slate-900 hover:border-cyan-500/30 transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-white text-xl">{example.scenario}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    {example.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Time Saved:</span>
                      <span className="text-white font-semibold">{example.timeSaved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Value:</span>
                      <span className="text-green-400 font-semibold">{example.value}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cost:</span>
                      <span className="text-slate-300 font-semibold">{example.cost}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">ROI:</span>
                        <span className="text-cyan-400 font-bold text-xl">{example.roi}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-3xl text-white">The Bottom Line</CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              BEAST MODE pays for itself in the first week. After that, it's pure value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-semibold text-white mb-3">What You Get</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>16-30 hours saved per week per developer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>$65K-$325K saved per year per team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>25+ point quality score improvement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>50% faster onboarding for new developers</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-3">What It Costs</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Free tier: $0 forever (10K calls/month)</span>
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

