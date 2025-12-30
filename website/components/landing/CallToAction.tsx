"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individual developers',
    features: [
      '10K API calls/month',
      'All 6 AI systems',
      'Community support',
      'MIT License',
      'Self-hosted option'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Developer',
    price: '$29',
    period: '/month',
    description: 'For professional developers',
    features: [
      '100K API calls/month',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    description: 'For growing teams',
    features: [
      '500K API calls/month',
      'Team collaboration',
      'Shared dashboards',
      'Multi-repo support',
      '99.9% SLA guarantee'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited API calls',
      'White-label options',
      'Advanced security',
      'Dedicated support',
      'Custom SLA'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

function CallToAction() {
  const router = useRouter();
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

  const handlePricingClick = (tierName: string) => {
    if (tierName === 'Enterprise') {
      // For enterprise, could open contact form or email
      window.location.href = 'mailto:sales@beastmode.dev?subject=Enterprise Inquiry';
    } else {
      // For other tiers, go to dashboard with signup
      router.push('/dashboard?view=auth&action=signup');
    }
  };

  const handleGetStarted = () => {
    router.push('/dashboard?view=auth&action=signup');
  };

  return (
    <section className="py-32 px-6 relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Pricing Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Simple Pricing
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include access to all AI systems.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-black/50 border-slate-900 hover:border-slate-800 transition-all ${
                tier.popular ? 'border-cyan-500/50 shadow-xl shadow-cyan-500/10' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0">
                    POPULAR
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white text-xl">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-gradient-cyan">{tier.price}</span>
                  <span className="text-slate-500">{tier.period}</span>
                </div>
                <CardDescription className="text-slate-400">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300 text-sm">
                      <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-white text-black hover:bg-slate-100'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                  onClick={() => handlePricingClick(tier.name)}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter */}
        <Card className="bg-black/50 border-slate-900 max-w-2xl mx-auto mb-24">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Stay Updated</CardTitle>
            <CardDescription className="text-slate-400">
              Get updates about new features, improvements, and best practices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-900 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
                <Button type="submit" className="bg-white text-black hover:bg-slate-100">
                  Subscribe
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="text-cyan-400 text-lg font-bold mb-2">✓ Subscribed!</div>
                <p className="text-slate-400">Thanks for subscribing. Check your email for updates.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Improve Your Code Quality?
          </h3>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Join developers using BEAST MODE to build better software with AI-powered analysis and automated bug detection.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-slate-100"
            onClick={handleGetStarted}
          >
            Get Started Free
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-white">BEAST MODE</span>
                <div className="text-xs text-slate-500">AI-Powered Code Quality Platform</div>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="/privacy" className="text-slate-500 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-slate-500 hover:text-white transition-colors">Terms</a>
              <a href="/support" className="text-slate-500 hover:text-white transition-colors">Support</a>
              <a href="/dashboard" className="text-slate-500 hover:text-white transition-colors">Dashboard</a>
            </div>

            <div className="text-center md:text-right">
              <div className="text-slate-500 text-sm mb-1">© 2025 BEAST MODE</div>
              <div className="text-slate-600 text-xs">Open Source (MIT License)</div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default CallToAction;
