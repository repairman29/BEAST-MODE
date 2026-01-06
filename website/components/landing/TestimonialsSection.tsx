"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';

// Testimonials will be added when we have real customer feedback
// For now, we'll show a placeholder encouraging early adopters
const comingSoon = {
  title: 'Early Adopter Program',
  description: 'We\'re looking for early users to help shape BEAST MODE. Join us and get:',
  benefits: [
    'Lifetime discount on paid tiers',
    'Direct input on feature development',
    'Priority support',
    'Early access to new features'
  ]
};

function TestimonialsSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Join Early Adopters
            <br />
            <span className="text-gradient-cyan">Shape the Future</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            BEAST MODE is in active development. Be among the first to use it and help us build the best developer tools.
          </p>
        </div>

        {/* Early Adopter Program */}
        <Card className="bg-slate-900/50 border-slate-800 max-w-3xl mx-auto mb-12">
          <CardContent className="p-10">
            <h3 className="text-3xl font-bold text-white mb-4 text-center">
              {comingSoon.title}
            </h3>
            <p className="text-slate-300 text-center mb-8">
              {comingSoon.description}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {comingSoon.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Card className="bg-slate-950/50 border-slate-900 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Try BEAST MODE?
              </h3>
              <p className="text-slate-400 mb-6">
                Start free. No credit card required. Get instant code quality feedback.
              </p>
              <a
                href="/dashboard?view=auth&action=signup"
                className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
              >
                Get Started Free
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;

