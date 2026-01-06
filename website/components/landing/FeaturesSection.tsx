"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const features = [
  {
    title: 'Instant Quality Scoring',
    description: 'Get your code quality score (0-100) in seconds. See issues found, get recommendations, and track improvement over time. Save hours of manual code review.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Automated Code Fixes',
    description: 'One-click fixes for common issues. Automatically applies improvements, removes console.logs, and fixes security vulnerabilities. Fix issues while you sleep.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'AI-Powered Analysis',
    description: 'Ask questions about your code. Get context-aware answers, understand issues, and learn best practices—all based on YOUR codebase.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Track Progress Over Time',
    description: 'See your quality score improve. Track issues found and fixed. Monitor your codebase health with historical data and trends.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Smart Tool Discovery',
    description: 'Get personalized plugin recommendations based on your codebase. Find the right tools for your project with one-click installation.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Day 2 Operations',
    description: 'Silent refactoring, architecture enforcement, and invisible CI/CD. Maintain your codebase automatically while you focus on building. 24/7 AI Janitor saves 10+ hours/week.',
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
            While other tools help you generate code, BEAST MODE helps you maintain it. Six powerful systems that work automatically—fixing bugs, enforcing architecture, and keeping your codebase clean while you focus on building.
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
              <CardTitle className="text-3xl text-white">Day 2 Operations Platform</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Six powerful systems work together to maintain your codebase automatically. Architecture enforcement, 
                security scanning, and silent refactoring—all while you focus on building. The AI Janitor works overnight.
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
