"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Developer',
    company: 'TechStart Inc.',
    image: '👩‍💻',
    quote: 'BEAST MODE saved me 20 hours per week. I can finally focus on building features instead of fixing bugs.',
    metrics: '20 hours/week saved',
    tier: 'Developer'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CTO',
    company: 'ScaleUp Co.',
    image: '👨‍💼',
    quote: 'Our team quality score improved by 30 points in the first month. Technical debt is actually decreasing now.',
    metrics: '+30 quality points, $150K/year saved',
    tier: 'Team'
  },
  {
    name: 'Alex Kim',
    role: 'Solo Developer',
    company: 'Indie Studio',
    image: '👨‍💻',
    quote: 'The free tier is incredibly generous. I get instant quality feedback without any setup. Game changer.',
    metrics: '10K free calls/month',
    tier: 'Free'
  },
  {
    name: 'Jordan Taylor',
    role: 'Engineering Manager',
    company: 'Enterprise Corp',
    image: '👩‍💼',
    quote: 'Day 2 Operations is exactly what we needed. Code maintains itself while we build. ROI is off the charts.',
    metrics: '400 hours/week saved, $80K/month value',
    tier: 'Enterprise'
  },
  {
    name: 'Riley Patel',
    role: 'Full-Stack Developer',
    company: 'StartupXYZ',
    image: '🧑‍💻',
    quote: 'New developers are productive 50% faster. The AI answers questions about our codebase 24/7.',
    metrics: '50% faster onboarding',
    tier: 'Team'
  },
  {
    name: 'Casey Morgan',
    role: 'DevOps Lead',
    company: 'CloudFirst',
    image: '👨‍🔧',
    quote: 'Silent refactoring runs overnight. We wake up to cleaner code. It\'s like having a senior dev working 24/7.',
    metrics: '23 issues fixed overnight',
    tier: 'Developer'
  }
];

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
            Real Results from
            <br />
            <span className="text-gradient-cyan">Real Developers</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            See how developers and teams are using BEAST MODE to save time, improve quality, and ship better code.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 transition-all hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                    <div className="text-sm text-slate-500">{testimonial.company}</div>
                  </div>
                  <div className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded border border-cyan-500/20">
                    {testimonial.tier}
                  </div>
                </div>
                <blockquote className="text-slate-300 mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-sm text-cyan-400 font-semibold">
                  {testimonial.metrics}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Card className="bg-slate-950/50 border-slate-900 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Join Thousands of Developers Using BEAST MODE
              </h3>
              <p className="text-slate-400 mb-6">
                Start free. No credit card required. See results in minutes.
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

