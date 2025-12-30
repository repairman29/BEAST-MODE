"use client";

import React from 'react';

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden neural-bg">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgb(0, 212, 255) 1px, transparent 1px), linear-gradient(to bottom, rgb(0, 212, 255) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem'
        }}></div>
      </div>

      {/* Subtle Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neural-primary rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neural-secondary rounded-full blur-3xl opacity-10"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-7xl mx-auto px-6 py-20">
        {/* Logo and Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-neural-primary via-white to-neural-primary bg-clip-text text-transparent">
              BEAST MODE
            </h1>
          </div>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-neural-primary to-transparent rounded-full"></div>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          AI-Powered Code Quality Platform
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
          Comprehensive code analysis, automated bug detection, and intelligent quality scoring for modern development teams.
        </p>

        {/* Key Features Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <div className="glass-card p-6 text-left hover:shadow-xl transition-all duration-300">
            <div className="text-neural-primary text-3xl mb-3">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Code Analysis</h3>
            <p className="text-gray-400">Automated code review with architectural insights and security scanning</p>
          </div>

          <div className="glass-card p-6 text-left hover:shadow-xl transition-all duration-300">
            <div className="text-neural-secondary text-3xl mb-3">🐛</div>
            <h3 className="text-xl font-semibold text-white mb-2">Bug Detection</h3>
            <p className="text-gray-400">AI-powered bug detection with confidence scoring and fix suggestions</p>
          </div>

          <div className="glass-card p-6 text-left hover:shadow-xl transition-all duration-300">
            <div className="text-neural-success text-3xl mb-3">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Quality Scoring</h3>
            <p className="text-gray-400">Comprehensive quality metrics with actionable improvement recommendations</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="/dashboard"
            className="px-8 py-4 bg-gradient-to-r from-neural-primary to-neural-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Get Started Free
          </a>

          <button
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all duration-300"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Features
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="glass-card max-w-3xl mx-auto p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neural-success rounded-full"></div>
              <span>Open Source (MIT)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neural-success rounded-full"></div>
              <span>9 AI Systems</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neural-success rounded-full"></div>
              <span>Multi-Platform Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neural-success rounded-full"></div>
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
