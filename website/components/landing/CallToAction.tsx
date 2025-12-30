"use client";

import React, { useState } from 'react';
import HudButton from '../hud/HudButton';
import HudPanel from '../hud/HudPanel';

function CallToAction() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="py-32 px-6 neural-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Pricing Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            Start free and scale as you grow. All plans include access to all 9 AI systems.
          </p>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Free Tier */}
            <div className="glass-card p-8 text-left hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-neural-primary mb-6">$0</div>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>10K API calls/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>All 9 AI systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Community support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Open source (MIT)</span>
                </li>
              </ul>
              <a
                href="/dashboard"
                className="block w-full px-6 py-3 bg-white/10 text-white text-center font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Get Started
              </a>
            </div>

            {/* Developer Tier */}
            <div className="glass-card p-8 text-left hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-2">Developer</h3>
              <div className="text-4xl font-bold text-neural-primary mb-6">
                $29<span className="text-lg text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>100K API calls/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Custom integrations</span>
                </li>
              </ul>
              <a
                href="/dashboard"
                className="block w-full px-6 py-3 bg-gradient-to-r from-neural-primary to-neural-secondary text-white text-center font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Start Free Trial
              </a>
            </div>

            {/* Team Tier */}
            <div className="glass-card p-8 text-left hover:shadow-xl transition-all duration-300 border-2 border-neural-primary">
              <div className="inline-block px-3 py-1 bg-neural-primary text-white text-xs font-bold rounded-full mb-4">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
              <div className="text-4xl font-bold text-neural-primary mb-6">
                $99<span className="text-lg text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>500K API calls/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Shared dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Multi-repo support</span>
                </li>
              </ul>
              <a
                href="/dashboard"
                className="block w-full px-6 py-3 bg-gradient-to-r from-neural-primary to-neural-secondary text-white text-center font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Start Free Trial
              </a>
            </div>

            {/* Enterprise Tier */}
            <div className="glass-card p-8 text-left hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-neural-primary mb-6">
                $299<span className="text-lg text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Unlimited API calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>White-label options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Advanced security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neural-success mt-1">✓</span>
                  <span>Dedicated support</span>
                </li>
              </ul>
              <a
                href="/dashboard"
                className="block w-full px-6 py-3 bg-white/10 text-white text-center font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="glass-card max-w-3xl mx-auto p-10 mb-20 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Get updates about new features, improvements, and best practices for code quality.
          </p>

          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neural-primary"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-neural-primary to-neural-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-neural-success text-xl font-bold mb-2">✓ Subscribed!</div>
              <p className="text-gray-300">Thanks for subscribing. Check your email for updates.</p>
            </div>
          )}
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">
              Ready to Improve Your Code Quality?
            </h3>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Join developers using BEAST MODE to build better software with AI-powered analysis, automated bug detection, and intelligent quality scoring.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-12 py-4 bg-gradient-to-r from-neural-primary to-neural-secondary text-white text-lg font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started Free
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-white">BEAST MODE</span>
                <div className="text-xs text-gray-500">AI-Powered Code Quality Platform</div>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="/privacy" className="text-gray-400 hover:text-neural-primary transition-colors">Privacy</a>
              <a href="/terms" className="text-gray-400 hover:text-neural-primary transition-colors">Terms</a>
              <a href="/support" className="text-gray-400 hover:text-neural-primary transition-colors">Support</a>
              <a href="/dashboard" className="text-gray-400 hover:text-neural-primary transition-colors">Dashboard</a>
            </div>

            <div className="text-center md:text-right">
              <div className="text-gray-500 text-sm mb-1">
                © 2025 BEAST MODE
              </div>
              <div className="text-gray-600 text-xs">
                Open Source (MIT License)
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default CallToAction;
