"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '10,000 API calls/month',
      'All 9 AI systems',
      'Community support',
      'Self-hosted deployment'
    ],
    cta: 'Get Started Free'
  },
  {
    id: 'developer',
    name: 'Developer',
    price: '$29',
    period: 'month',
    features: [
      '100K API calls/month',
      'Priority support',
      'Advanced analytics',
      'Email support'
    ],
    cta: 'Subscribe'
  },
  {
    id: 'team',
    name: 'Team',
    price: '$99',
    period: 'month',
    features: [
      '500K API calls/month',
      'Team collaboration',
      'Advanced features',
      'Dedicated support'
    ],
    cta: 'Subscribe'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$299',
    period: 'month',
    features: [
      'Unlimited usage',
      'White-label options',
      'Custom integrations',
      '24/7 support'
    ],
    cta: 'Contact Sales'
  }
];

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      // Handle free plan signup
      window.location.href = '/dashboard';
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-slate-400">Start free, upgrade as you grow</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`bg-slate-900/90 border-slate-800 hover:border-slate-800 transition-all ${
              plan.id === 'developer' ? 'border-cyan-500/50' : ''
            }`}
          >
            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period !== 'forever' && (
                  <span className="text-slate-400 text-sm">/{plan.period}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan === plan.id}
                className={`w-full ${
                  plan.id === 'developer'
                    ? 'bg-white text-black hover:bg-slate-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {loadingPlan === plan.id ? 'Loading...' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

