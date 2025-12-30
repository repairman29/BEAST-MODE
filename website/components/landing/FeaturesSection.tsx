"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const features = [
  {
    title: 'Oracle AI',
    description: 'Deep code analysis with architectural insights and security scanning',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Code Roach',
    description: 'Automated bug detection with AI-powered fix suggestions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Daisy Chain',
    description: 'Intelligent workflow orchestration and task automation',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Deployment Orchestrator',
    description: 'Multi-platform deployment with automated rollback',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Quality Engine',
    description: 'Comprehensive quality scoring with actionable recommendations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Health Monitor',
    description: 'Real-time system diagnostics and performance tracking',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    gradient: 'from-pink-500 to-rose-500'
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
            Everything You Need
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Six powerful AI systems working together to analyze, optimize, and deploy your code with confidence.
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
              <CardTitle className="text-3xl text-white">All Systems Working Together</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                These AI systems integrate seamlessly to provide comprehensive code quality analysis, 
                automated bug detection, and intelligent deployment orchestration.
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
