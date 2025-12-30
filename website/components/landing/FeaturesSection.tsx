"use client";

import React from 'react';
import HudPanel from '../hud/HudPanel';

const aiSystems = [
  {
    id: 'oracle',
    title: 'Oracle AI',
    description: 'Comprehensive code analysis and architectural intelligence',
    icon: '🔍',
    gradient: 'from-neural-primary to-neural-secondary',
    capabilities: ['Code Analysis', 'Architecture Review', 'Performance Insights', 'Security Scanning']
  },
  {
    id: 'code-roach',
    title: 'Code Roach',
    description: 'Automated bug detection and intelligent code fixing',
    icon: '🐛',
    gradient: 'from-neural-secondary to-neural-primary',
    capabilities: ['Bug Detection', 'Auto-Fix Suggestions', 'Code Optimization', 'Vulnerability Scanning']
  },
  {
    id: 'daisy-chain',
    title: 'Daisy Chain',
    description: 'Workflow orchestration and task automation',
    icon: '⚡',
    gradient: 'from-neural-success to-neural-primary',
    capabilities: ['Task Coordination', 'Workflow Automation', 'Process Integration', 'Efficiency Optimization']
  },
  {
    id: 'conversational-ai',
    title: 'Conversational AI',
    description: 'Natural language interface for code assistance',
    icon: '💬',
    gradient: 'from-neural-secondary to-neural-warning',
    capabilities: ['Natural Language Processing', 'Code Suggestions', 'Documentation Generation', 'Interactive Guidance']
  },
  {
    id: 'health-monitor',
    title: 'Health Monitor',
    description: 'Real-time system diagnostics and monitoring',
    icon: '❤️',
    gradient: 'from-neural-warning to-neural-success',
    capabilities: ['System Monitoring', 'Health Diagnostics', 'Performance Tracking', 'Alert Management']
  },
  {
    id: 'marketplace',
    title: 'Marketplace AI',
    description: 'Plugin discovery and integration recommendations',
    icon: '🛍️',
    gradient: 'from-neural-success to-neural-secondary',
    capabilities: ['Plugin Discovery', 'Smart Recommendations', 'Usage Analytics', 'Developer Monetization']
  },
  {
    id: 'mission-guidance',
    title: 'Mission Guidance',
    description: 'Project planning and success prediction',
    icon: '🎯',
    gradient: 'from-neural-primary to-neural-warning',
    capabilities: ['Project Planning', 'Timeline Optimization', 'Risk Assessment', 'Success Forecasting']
  },
  {
    id: 'quality-engine',
    title: 'Quality Engine',
    description: 'Comprehensive code quality analysis and scoring',
    icon: '📊',
    gradient: 'from-neural-warning to-neural-primary',
    capabilities: ['Quality Scoring', 'Issue Detection', 'Grade Assignment', 'Improvement Recommendations']
  },
  {
    id: 'deployment',
    title: 'Deployment Orchestrator',
    description: 'Multi-platform deployment automation',
    icon: '🚀',
    gradient: 'from-neural-primary to-neural-success',
    capabilities: ['Multi-Platform Deploy', 'Automated Rollback', 'Blue-Green Strategy', 'Deployment Monitoring']
  }
];

function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 neural-bg relative">
      {/* Neural Field Background */}
      <div className="absolute inset-0 quantum-field opacity-50"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            9 Integrated AI Systems
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A comprehensive suite of specialized AI systems that work together to analyze, optimize, and automate your development workflow.
          </p>
        </div>

        {/* AI Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiSystems.map((system, index) => (
            <div
              key={system.id}
              className="group relative glass-card hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="relative p-8">
                {/* Icon */}
                <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${system.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-3xl">{system.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {system.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {system.description}
                </p>

                {/* Capabilities */}
                <div className="space-y-2">
                  {system.capabilities.map((capability, capIndex) => (
                    <div key={capIndex} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-neural-primary"></div>
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="glass-card max-w-3xl mx-auto p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              All Systems Working Together
            </h3>
            <p className="text-gray-300 mb-6">
              These 9 AI systems integrate seamlessly to provide comprehensive code quality analysis, automated bug detection, and intelligent deployment orchestration for your entire development lifecycle.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-8 py-3 bg-gradient-to-r from-neural-primary to-neural-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Explore All Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
