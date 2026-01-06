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
    valueProp: '10K free calls/month',
    features: [
      '10K API calls/month',
      'All 9 AI systems',
      'Community support',
      'MIT License',
      'Instant quality scores'
    ],
    cta: 'Get Started Free',
    ctaValue: 'No credit card required',
    popular: false
  },
  {
    name: 'Developer',
    price: '$79',
    period: '/month',
    description: 'For professional developers',
    valueProp: 'Lower than CodeClimate ($99)',
    features: [
      '100K API calls/month',
      'Priority support',
      'Advanced analytics',
      'Day 2 Operations',
      'Email support'
    ],
    cta: 'Start Free Trial',
    ctaValue: '14-day free trial',
    popular: true
  },
  {
    name: 'Team',
    price: '$299',
    period: '/month',
    description: 'For growing teams',
    valueProp: 'All-in-one platform',
    features: [
      '500K API calls/month',
      'Team collaboration',
      'Shared dashboards',
      'Multi-repo support',
      'Architecture enforcement'
    ],
    cta: 'Start Free Trial',
    ctaValue: '14-day free trial',
    popular: false
  },
  {
    name: 'Enterprise',
    price: '$799',
    period: '/month',
    description: 'SENTINEL governance layer',
    valueProp: 'Unlimited + compliance',
    features: [
      'Unlimited API calls',
      'Plain English reviews',
      'Compliance & audit logs',
      'White-label & SSO',
      '99.9% confidence threshold'
    ],
    cta: 'Contact Sales',
    ctaValue: 'Custom pricing available',
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
            Start free and scale as you grow. BEAST MODE for vibe coders. SENTINEL for enterprise.
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
                <CardDescription className="text-slate-400 mb-2">{tier.description}</CardDescription>
                {tier.valueProp && (
                  <div className="text-sm text-cyan-400 font-semibold">
                    {tier.valueProp}
                  </div>
                )}
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
                <div className="space-y-2">
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
                  {tier.ctaValue && (
                    <p className="text-xs text-slate-500 text-center">
                      {tier.ctaValue}
                    </p>
                  )}
                </div>
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
            Stop Guessing If Your Code Is Good
          </h3>
          <p className="text-lg text-slate-400 mb-6 max-w-2xl mx-auto">
            Get instant quality scores, automated fixes, and Day 2 Operations. All 9 AI systems in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <div className="text-sm text-slate-500">
              ✓ 10K free calls/month
            </div>
            <div className="text-sm text-slate-500">
              ✓ No credit card required
            </div>
            <div className="text-sm text-slate-500">
              ✓ Start in seconds
            </div>
          </div>
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-slate-100 px-8 py-6 text-lg"
            onClick={handleGetStarted}
          >
            Get Started Free →
          </Button>
          <p className="text-sm text-slate-600 mt-4">
            Join early adopters shaping the future of code quality
          </p>
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
