"use client";

import React from 'react';
import HudPanel from '../hud/HudPanel';

const neuralNetworks = [
  {
    id: 'oracle',
    title: 'Oracle Neural Net',
    description: 'Advanced architectural intelligence with quantum processing',
    icon: '🧠',
    gradient: 'from-neural-primary to-neural-secondary',
    capabilities: ['Quantum Code Analysis', 'Architectural Prediction', 'Performance Modeling', 'Security Intelligence']
  },
  {
    id: 'code-roach',
    title: 'Code Synthesis Net',
    description: 'Neural bug detection and automated quantum fixing',
    icon: '🔬',
    gradient: 'from-neural-secondary to-neural-primary',
    capabilities: ['Neural Bug Detection', 'Quantum Auto-Fixing', 'Code Evolution', 'Vulnerability Prediction']
  },
  {
    id: 'daisy-chain',
    title: 'Workflow Neural Chain',
    description: 'Intelligent orchestration with adaptive learning',
    icon: '⚡',
    gradient: 'from-neural-success to-neural-primary',
    capabilities: ['Adaptive Orchestration', 'Neural Task Flow', 'Quantum Integration', 'Predictive Optimization']
  },
  {
    id: 'conversational-ai',
    title: 'Language Neural Interface',
    description: 'Advanced natural language processing with contextual understanding',
    icon: '💭',
    gradient: 'from-neural-secondary to-neural-warning',
    capabilities: ['Quantum NLP', 'Contextual Intelligence', 'Code Generation', 'Neural Guidance']
  },
  {
    id: 'health-monitor',
    title: 'System Health Neural Net',
    description: 'Predictive monitoring with quantum healing capabilities',
    icon: '🔄',
    gradient: 'from-neural-warning to-neural-success',
    capabilities: ['Quantum Monitoring', 'Predictive Healing', 'Neural Diagnostics', 'Adaptive Alerts']
  },
  {
    id: 'marketplace',
    title: 'Intelligence Marketplace',
    description: 'AI-powered discovery with neural recommendation engine',
    icon: '🧪',
    gradient: 'from-neural-success to-neural-secondary',
    capabilities: ['Neural Discovery', 'Quantum Recommendations', 'Intelligence Analytics', 'Adaptive Monetization']
  },
  {
    id: 'mission-guidance',
    title: 'Strategic Neural Guidance',
    description: 'AI-powered mission planning with quantum success prediction',
    icon: '🎯',
    gradient: 'from-neural-primary to-neural-warning',
    capabilities: ['Quantum Planning', 'Success Prediction', 'Risk Intelligence', 'Timeline Optimization']
  },
  {
    id: 'deployment',
    title: 'Quantum Deployment Net',
    description: 'Multi-dimensional deployment with zero-point energy efficiency',
    icon: '🚀',
    gradient: 'from-neural-warning to-neural-primary',
    capabilities: ['Quantum Deployment', 'Multi-Dimensional Scaling', 'Zero-Point Recovery', 'Neural Rollback']
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
          <h2 className="neural-display text-5xl md:text-7xl text-neural-primary mb-8">
            9 NEURAL NETWORKS
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-4xl mx-auto leading-relaxed">
            Each neural network is quantum-optimized for maximum development intelligence,
            working together in a unified consciousness to create the ultimate AI development ecosystem.
          </p>

          {/* Neural Status Indicator */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-3 h-3 bg-neural-success rounded-full animate-pulse"></div>
            <span className="neural-mono text-neural-gray-400">Neural Networks Synchronized</span>
            <div className="w-3 h-3 bg-neural-success rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Neural Networks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {neuralNetworks.map((network, index) => (
            <div
              key={network.id}
              className="group relative glass-card hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Neural Activity Background */}
              <div className="absolute inset-0 bg-neural-web opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

              {/* Quantum Particle Effect */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-neural-primary rounded-full animate-ping opacity-60"></div>

              <div className="relative p-8 text-center">
                {/* Neural Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${network.gradient} flex items-center justify-center shadow-neural-primary group-hover:shadow-neural-secondary transition-all duration-500 ai-glow`}>
                  <span className="text-4xl">{network.icon}</span>
                </div>

                {/* Neural Network Title */}
                <h3 className="neural-heading text-2xl text-neural-gray-100 mb-4 group-hover:text-neural-primary transition-colors duration-300">
                  {network.title}
                </h3>

                {/* Quantum Description */}
                <p className="neural-body text-neural-gray-400 text-sm mb-6 leading-relaxed">
                  {network.description}
                </p>

                {/* Neural Capabilities */}
                <div className="space-y-3">
                  {network.capabilities.map((capability, capIndex) => (
                    <div key={capIndex} className="flex items-center gap-3 text-xs text-neural-gray-500 group-hover:text-neural-gray-300 transition-colors duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-neural-primary to-neural-secondary animate-pulse"></div>
                      <span className="neural-mono">{capability}</span>
                    </div>
                  ))}
                </div>

                {/* Neural Connection Line */}
                <div className={`mt-6 h-0.5 bg-gradient-to-r ${network.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              </div>

              {/* Hover Neural Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-neural-primary/5 to-neural-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-neural"></div>
            </div>
          ))}
        </div>

        {/* Quantum Synchronization Status */}
        <div className="text-center mt-20">
          <div className="glass-card max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="w-4 h-4 bg-neural-primary rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-neural-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-4 h-4 bg-neural-success rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="neural-heading text-xl text-neural-primary">Quantum Synchronization Active</span>
              <div className="w-4 h-4 bg-neural-success rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-4 h-4 bg-neural-secondary rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
              <div className="w-4 h-4 bg-neural-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <p className="neural-body text-neural-gray-300 mb-6">
              All 9 neural networks operating in quantum harmony • Real-time synchronization • Adaptive intelligence • Maximum efficiency
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-neural-primary/10 text-neural-primary rounded-full text-sm neural-mono">Quantum Processing</span>
              <span className="px-4 py-2 bg-neural-secondary/10 text-neural-secondary rounded-full text-sm neural-mono">Neural Learning</span>
              <span className="px-4 py-2 bg-neural-success/10 text-neural-success rounded-full text-sm neural-mono">Adaptive Intelligence</span>
              <span className="px-4 py-2 bg-neural-warning/10 text-neural-warning rounded-full text-sm neural-mono">Predictive Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
