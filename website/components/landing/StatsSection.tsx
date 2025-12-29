"use client";

import React, { useEffect, useState } from 'react';
import HudPanel from '../hud/HudPanel';

const stats = [
  {
    number: 97,
    suffix: '%',
    label: 'Error Reduction',
    description: 'Automated bug detection and fixing',
    color: 'green',
    icon: '🐛'
  },
  {
    number: 10,
    suffix: 'x',
    label: 'Development Acceleration',
    description: 'AI-powered workflow optimization',
    color: 'cyan',
    icon: '⚡'
  },
  {
    number: 2500000,
    suffix: '$',
    label: 'Annual Savings',
    description: 'Enterprise efficiency gains',
    color: 'amber',
    icon: '💰'
  },
  {
    number: 85,
    suffix: '%',
    label: 'Success Prediction',
    description: 'Project outcome forecasting',
    color: 'purple',
    icon: '🎯'
  },
  {
    number: 99.9,
    suffix: '%',
    label: 'System Uptime',
    description: 'Self-healing infrastructure',
    color: 'blue',
    icon: '🛡️'
  },
  {
    number: 50000,
    suffix: '$',
    label: 'Marketplace Potential',
    description: 'Monthly recurring revenue',
    color: 'green',
    icon: '🛒'
  }
];

function StatsSection() {
  const [animatedNumbers, setAnimatedNumbers] = useState<number[]>(stats.map(() => 0));

  useEffect(() => {
    const animateNumbers = () => {
      stats.forEach((stat, index) => {
        const targetNumber = stat.number;
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = targetNumber / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const currentValue = Math.min(targetNumber, increment * currentStep);

          setAnimatedNumbers(prev => {
            const newNumbers = [...prev];
            newNumbers[index] = currentValue;
            return newNumbers;
          });

          if (currentStep >= steps) {
            clearInterval(timer);
          }
        }, duration / steps);
      });
    };

    // Start animation when component comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateNumbers();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toFixed(num % 1 === 0 ? 0 : 1);
  };

  return (
    <section id="stats-section" className="py-32 px-6 neural-bg relative">
      {/* Quantum Field Background */}
      <div className="absolute inset-0 quantum-field opacity-30"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="neural-display text-5xl md:text-7xl text-neural-primary mb-8">
            QUANTUM IMPACT
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-4xl mx-auto leading-relaxed">
            Real-world results from neural network-powered development transformation.
            Measurable quantum improvements across development intelligence and business outcomes.
          </p>
        </div>

        {/* Quantum Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card text-center p-8 hover:scale-105 transition-all duration-300 group"
            >
              {/* Neural Icon */}
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-neural-${stat.color}/10 flex items-center justify-center group-hover:shadow-neural-${stat.color === 'success' ? 'success' : stat.color === 'warning' ? 'warning' : 'primary'} transition-all duration-300 ai-glow`}>
                <span className="text-3xl">{stat.icon}</span>
              </div>

              {/* Animated Number */}
              <div className={`neural-display text-5xl md:text-6xl mb-3 text-neural-${stat.color}`}>
                {formatNumber(animatedNumbers[index])}{stat.suffix}
              </div>

              {/* Label */}
              <h3 className="neural-heading text-xl text-neural-gray-100 mb-3">
                {stat.label}
              </h3>

              {/* Description */}
              <p className="neural-body text-neural-gray-400 text-sm leading-relaxed">
                {stat.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-neural-gray-700 rounded-full mt-6">
                <div
                  className={`h-full bg-gradient-to-r from-neural-${stat.color} to-neural-${stat.color}-light rounded-full animate-pulse transition-all duration-1000`}
                  style={{ width: `${Math.min(100, (animatedNumbers[index] / stat.number) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HudPanel className="p-8 bg-gradient-to-br from-holo-black/80 to-holo-cyan/5 border border-holo-cyan/30">
            <h3 className="text-2xl font-bold text-holo-cyan mb-4 flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              Market Leadership
            </h3>
            <ul className="space-y-3 text-holo-cyan/80">
              <li className="flex items-center gap-2">
                <span className="text-holo-green">✓</span>
                First AI-powered TTRPG development platform
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-green">✓</span>
                2-year technology advantage over competitors
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-green">✓</span>
                Fortune 500 enterprise adoption ready
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-green">✓</span>
                Largest AI development community ecosystem
              </li>
            </ul>
          </HudPanel>

          <HudPanel className="p-8 bg-gradient-to-br from-holo-black/80 to-holo-amber/5 border border-holo-amber/30">
            <h3 className="text-2xl font-bold text-holo-amber mb-4 flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              Innovation Pipeline
            </h3>
            <ul className="space-y-3 text-holo-cyan/80">
              <li className="flex items-center gap-2">
                <span className="text-holo-amber">⚡</span>
                Dynamic Narrative Engine (Q2 2025)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-amber">⚡</span>
                Procedural World Generation (Q3 2025)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-amber">⚡</span>
                AI Art Generation Pipeline (Q4 2025)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-holo-amber">⚡</span>
                Predictive Player Modeling (Q1 2026)
              </li>
            </ul>
          </HudPanel>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
