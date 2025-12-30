"use client";

import React from 'react';
import HudPanel from '../hud/HudPanel';

const features = [
  {
    label: 'AI Systems',
    value: '9',
    description: 'Integrated AI tools for comprehensive code analysis',
    icon: '🤖'
  },
  {
    label: 'Code Quality',
    value: 'A+',
    description: 'Letter grade scoring from A+ to F',
    icon: '📊'
  },
  {
    label: 'Platforms',
    value: '4+',
    description: 'Deploy to Vercel, AWS, Railway, Azure',
    icon: '🚀'
  },
  {
    label: 'License',
    value: 'MIT',
    description: 'Open source with commercial tiers',
    icon: '⚖️'
  },
  {
    label: 'Validators',
    value: '10+',
    description: 'Quality validators for comprehensive analysis',
    icon: '✓'
  },
  {
    label: 'Node.js',
    value: '18+',
    description: 'Modern runtime support with TypeScript',
    icon: '⚙️'
  }
];

function StatsSection() {
  return (
    <section id="features-overview" className="py-32 px-6 neural-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Platform Overview
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A comprehensive development platform built with modern technologies and open-source principles.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="glass-card text-center p-8 hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-neural-primary to-neural-secondary flex items-center justify-center">
                <span className="text-3xl">{feature.icon}</span>
              </div>

              {/* Value */}
              <div className="text-4xl md:text-5xl font-bold mb-3 text-neural-primary">
                {feature.value}
              </div>

              {/* Label */}
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.label}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">👨‍💻</span>
              For Developers
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-neural-success">✓</span>
                Automated code quality analysis and bug detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-success">✓</span>
                AI-powered suggestions and optimization
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-success">✓</span>
                CLI tools and dashboard for project management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-success">✓</span>
                Integration with popular development workflows
              </li>
            </ul>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              For Teams
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-neural-primary">✓</span>
                Centralized quality metrics and reporting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-primary">✓</span>
                Multi-repository orchestration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-primary">✓</span>
                Deployment automation across platforms
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neural-primary">✓</span>
                Enterprise-ready with flexible licensing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
