"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    priceAnnual: null,
    savings: null,
    features: [
      '10,000 API calls/month',
      'Core library (MIT licensed)',
      'Basic quality checks',
      'Community support',
      'Self-hosted deployment'
    ],
    cta: 'Get Started Free',
    popular: false
  },
  {
    id: 'developer',
    name: 'Developer',
    price: '$79',
    period: 'month',
    priceAnnual: '$790',
    savings: 'Save $158/year',
    features: [
      '100K API calls/month',
      'Day 2 Operations (AI Janitor)',
      'Priority email support',
      'Advanced analytics',
      'Quality tracking',
      'Overnight janitor',
      'Silent refactoring'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    id: 'team',
    name: 'Team',
    price: '$299',
    period: 'month',
    priceAnnual: '$2,990',
    savings: 'Save $598/year',
    features: [
      '500K API calls/month',
      'Everything in Developer',
      'Team collaboration',
      'Enterprise guardrail',
      'Plain English diffs',
      'Team analytics',
      'Phone support',
      '99.9% SLA guarantee'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$799',
    period: 'month',
    priceAnnual: '$7,990',
    savings: 'Save $1,598/year',
    features: [
      '2M API calls/month',
      'Everything in Team',
      'Unlimited API calls (overage)',
      'White-label deployment',
      'SSO integration',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 phone support',
      'On-premise option',
      'Custom AI models'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

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

  const allFeatures = [
    { name: 'API Calls/Month', free: '10,000', developer: '100,000', team: '500,000', enterprise: '2,000,000' },
    { name: 'Overage Pricing', free: 'N/A', developer: '$0.001/call', team: '$0.0008/call', enterprise: '$0.0005/call' },
    { name: 'Core Library (MIT)', free: true, developer: true, team: true, enterprise: true },
    { name: 'Day 2 Operations', free: false, developer: true, team: true, enterprise: true },
    { name: 'AI Janitor', free: false, developer: true, team: true, enterprise: true },
    { name: 'Silent Refactoring', free: false, developer: true, team: true, enterprise: true },
    { name: 'Support', free: 'Community', developer: 'Email (24h)', team: 'Phone + Email', enterprise: '24/7 Dedicated' },
    { name: 'Team Collaboration', free: false, developer: false, team: true, enterprise: true },
    { name: 'Enterprise Guardrail', free: false, developer: false, team: true, enterprise: true },
    { name: 'SLA Guarantee', free: false, developer: false, team: '99.9%', enterprise: '99.99%' },
    { name: 'White-label', free: false, developer: false, team: false, enterprise: true },
    { name: 'SSO Integration', free: false, developer: false, team: false, enterprise: true },
    { name: 'Custom AI Models', free: false, developer: false, team: false, enterprise: true },
    { name: 'On-premise Option', free: false, developer: false, team: false, enterprise: true }
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.'
    },
    {
      question: 'What happens if I exceed my API limit?',
      answer: 'We\'ll notify you when you\'re approaching your limit. You can upgrade your plan or purchase additional API calls as needed.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.'
    },
    {
      question: 'Can I self-host BEAST MODE?',
      answer: 'Yes! The Free plan includes self-hosting options. Enterprise plans include managed hosting with dedicated support.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and for Enterprise plans, we can arrange invoicing.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'The Free plan is always free! For paid plans, you can start with the Free plan and upgrade when you\'re ready.'
    }
  ];

  return (
    <div className="w-full max-w-7xl space-y-6 mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-slate-400">Start free, upgrade as you grow</p>
        <div className="flex gap-4 justify-center mt-4">
          <Button
            onClick={() => setShowComparison(!showComparison)}
            variant="outline"
            className="border-slate-800"
          >
            {showComparison ? '📊 Hide Comparison' : '📊 Compare Plans'}
          </Button>
          <Button
            onClick={() => setShowFAQ(!showFAQ)}
            variant="outline"
            className="border-slate-800"
          >
            {showFAQ ? '❓ Hide FAQ' : '❓ FAQ'}
          </Button>
        </div>
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
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                    Most Popular
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period !== 'forever' && (
                    <span className="text-slate-400 text-sm">/{plan.period}</span>
                  )}
                </div>
                {plan.priceAnnual && (
                  <div className="mt-1">
                    <div className="text-sm text-slate-400">
                      <span className="line-through">{plan.priceAnnual}/year</span>
                      <span className="ml-2 text-green-400 font-semibold">{plan.savings}</span>
                    </div>
                  </div>
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
                  plan.popular
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-500'
                    : plan.id === 'free'
                    ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {loadingPlan === plan.id ? 'Loading...' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📊 Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-400 py-3 px-4">Feature</th>
                    <th className="text-center text-slate-400 py-3 px-4">Free</th>
                    <th className="text-center text-slate-400 py-3 px-4">Developer</th>
                    <th className="text-center text-slate-400 py-3 px-4">Team</th>
                    <th className="text-center text-slate-400 py-3 px-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50">
                      <td className="text-white py-3 px-4">{feature.name}</td>
                      <td className="text-center text-slate-300 py-3 px-4">
                        {typeof feature.free === 'boolean' ? (feature.free ? '✓' : '✗') : feature.free}
                      </td>
                      <td className="text-center text-slate-300 py-3 px-4">
                        {typeof feature.developer === 'boolean' ? (feature.developer ? '✓' : '✗') : feature.developer}
                      </td>
                      <td className="text-center text-slate-300 py-3 px-4">
                        {typeof feature.team === 'boolean' ? (feature.team ? '✓' : '✗') : feature.team}
                      </td>
                      <td className="text-center text-slate-300 py-3 px-4">
                        {typeof feature.enterprise === 'boolean' ? (feature.enterprise ? '✓' : '✗') : feature.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      {showFAQ && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">❓ Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-slate-800 pb-4 last:border-0">
                  <h4 className="text-white font-semibold mb-2">{faq.question}</h4>
                  <p className="text-slate-300 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

