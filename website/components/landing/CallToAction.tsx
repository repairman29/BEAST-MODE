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
      {/* Quantum Field Background */}
      <div className="absolute inset-0 quantum-field opacity-40"></div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Quantum CTA */}
        <div className="mb-20">
          <h2 className="neural-display text-5xl md:text-8xl text-neural-primary mb-8">
            JOIN THE NEURAL REVOLUTION
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed">
            Experience the quantum future of software development. BEAST MODE is not just a tool—
            it's the complete neural network ecosystem that will transform how you build software.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <a href="/dashboard" className="future-button px-12 py-6 text-xl font-semibold text-neural-primary hover:scale-105 transition-all duration-300">
              🚀 Launch Neural Dashboard
            </a>

            <button
              className="future-button px-12 py-6 text-xl font-semibold text-neural-secondary hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              🧠 Explore Networks
            </button>
          </div>
        </div>

        {/* Neural Intelligence Newsletter */}
        <HudPanel className="glass-card max-w-3xl mx-auto p-10 mb-20">
          <h3 className="neural-heading text-3xl text-neural-primary mb-6">
            Stay Connected to Neural Intelligence
          </h3>
          <p className="neural-body text-neural-gray-300 mb-8 leading-relaxed">
            Get early access to new neural features, quantum roadmap updates, and exclusive enterprise insights.
            Join the neural network revolution.
          </p>

          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-holo-black/50 border border-holo-cyan/30 rounded-lg text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan focus:shadow-holo-soft"
                required
              />
              <HudButton
                type="submit"
                className="px-8 py-3 bg-holo-cyan text-holo-black hover:bg-holo-cyan/90 font-semibold"
              >
                Subscribe
              </HudButton>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-holo-green text-xl font-bold mb-2">✅ Subscribed!</div>
              <p className="text-holo-cyan/80">Welcome to the AI revolution. Check your email for updates.</p>
            </div>
          )}
        </HudPanel>

        {/* Feature Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <HudPanel className="p-6 bg-holo-black/60 backdrop-blur-hud border border-holo-red/30">
            <h4 className="text-xl font-bold text-holo-red mb-3">Traditional Development</h4>
            <ul className="space-y-2 text-left text-holo-cyan/70">
              <li>• Manual code review</li>
              <li>• Reactive bug fixing</li>
              <li>• Slow deployment cycles</li>
              <li>• Limited automation</li>
              <li>• High error rates</li>
            </ul>
          </HudPanel>

          <HudPanel className="p-6 bg-gradient-to-br from-holo-cyan/10 to-holo-amber/10 border border-holo-cyan/50 shadow-holo-medium">
            <h4 className="text-xl font-bold text-holo-cyan mb-3">BEAST MODE</h4>
            <ul className="space-y-2 text-left text-holo-cyan">
              <li>• AI-powered code analysis</li>
              <li>• Predictive bug prevention</li>
              <li>• Automated deployments</li>
              <li>• Full AI automation</li>
              <li>• 97% error reduction</li>
            </ul>
          </HudPanel>

          <HudPanel className="p-6 bg-holo-black/60 backdrop-blur-hud border border-holo-green/30">
            <h4 className="text-xl font-bold text-holo-green mb-3">Competitor Solutions</h4>
            <ul className="space-y-2 text-left text-holo-cyan/70">
              <li>• Basic linting tools</li>
              <li>• Manual testing</li>
              <li>• Single-platform deploy</li>
              <li>• Limited AI features</li>
              <li>• Fragmented solutions</li>
            </ul>
          </HudPanel>
        </div>

        {/* Final Message */}
        <div className="border-t border-holo-cyan/20 pt-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-holo-cyan mb-6">
              The Future is Here
            </h3>
            <p className="text-lg text-holo-cyan/80 mb-8 leading-relaxed">
              BEAST MODE represents the culmination of AI-assisted development.
              Nine integrated AI systems working in perfect harmony to deliver
              unparalleled productivity, quality, and innovation.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 bg-holo-cyan/10 text-holo-cyan rounded-full">🤖 AI-Powered</span>
              <span className="px-4 py-2 bg-holo-amber/10 text-holo-amber rounded-full">⚡ Enterprise-Grade</span>
              <span className="px-4 py-2 bg-holo-green/10 text-holo-green rounded-full">🚀 Production-Ready</span>
              <span className="px-4 py-2 bg-holo-purple/10 text-holo-purple rounded-full">🎯 Market-Leading</span>
            </div>
          </div>
        </div>

        {/* Neural Footer */}
        <footer className="mt-20 pt-12 border-t border-neural-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center ai-glow">
                  <span className="text-xl">🧠</span>
                </div>
                <div className="absolute -inset-1 bg-neural-primary/20 rounded-xl blur-md"></div>
              </div>
              <div>
                <span className="neural-heading text-xl text-neural-primary">BEAST MODE</span>
                <div className="neural-mono text-xs text-neural-gray-500">Neural Intelligence Platform</div>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="#" className="text-neural-gray-400 hover:text-neural-primary transition-colors neural-mono">Privacy</a>
              <a href="#" className="text-neural-gray-400 hover:text-neural-primary transition-colors neural-mono">Terms</a>
              <a href="#" className="text-neural-gray-400 hover:text-neural-primary transition-colors neural-mono">Support</a>
              <a href="#" className="text-neural-gray-400 hover:text-neural-secondary transition-colors neural-mono">Enterprise</a>
            </div>

            <div className="text-center md:text-right">
              <div className="neural-mono text-neural-gray-500 text-sm mb-1">
                © 2025 BEAST MODE
              </div>
              <div className="neural-body text-neural-gray-600 text-xs">
                Neural Revolution Established
              </div>
            </div>
          </div>

          {/* Neural Network Status */}
          <div className="mt-8 pt-6 border-t border-neural-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-xs neural-mono text-neural-gray-600">
              <div className="w-2 h-2 bg-neural-success rounded-full animate-pulse"></div>
              <span>9 Neural Networks Active</span>
              <div className="w-2 h-2 bg-neural-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span>Quantum Synchronization</span>
              <div className="w-2 h-2 bg-neural-secondary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span>Adaptive Intelligence</span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default CallToAction;
