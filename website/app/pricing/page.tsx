'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UpgradePrompt from '../../components/upgrade-prompt';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceAnnual?: number;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  limits: {
    prsPerMonth: number | string;
    reposPerMonth: number | string;
    apiCallsPerMonth: number | string;
  };
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying BEAST MODE on personal projects',
    features: [
      'Basic quality analysis (10 PRs/month)',
      'Quality score (0-100)',
      'Top 3 recommendations per PR',
      'Basic PR comments',
      'Status checks (quality gate)',
      'Rate limited',
      'No historical data',
      'No team features'
    ],
    cta: 'Get Started Free',
    limits: {
      prsPerMonth: 10,
      reposPerMonth: 3,
      apiCallsPerMonth: 100
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    priceAnnual: 190,
    description: 'Professional-grade code quality for solo developers',
    features: [
      'Everything in Free',
      '✅ Unlimited PR analysis',
      '✅ Advanced AI recommendations',
      '✅ Historical quality trends',
      '✅ Custom quality thresholds',
      '✅ Priority support',
      '✅ Export quality reports',
      '✅ Integration with 3 repos'
    ],
    popular: true,
    cta: 'Upgrade to Pro',
    limits: {
      prsPerMonth: 'Unlimited',
      reposPerMonth: 3,
      apiCallsPerMonth: 1000
    }
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    priceAnnual: 990,
    description: 'Keep your team\'s code quality high without micromanaging',
    features: [
      'Everything in Pro',
      '✅ Team dashboard',
      '✅ Custom quality rules',
      '✅ Quality metrics per developer',
      '✅ Team leaderboards',
      '✅ Integration with 20 repos',
      '✅ Slack/Discord notifications',
      '✅ API access',
      '✅ Priority support'
    ],
    cta: 'Upgrade to Team',
    limits: {
      prsPerMonth: 'Unlimited',
      reposPerMonth: 20,
      apiCallsPerMonth: 5000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    description: 'Enterprise-grade code quality at scale',
    features: [
      'Everything in Team',
      '✅ Unlimited repos',
      '✅ SSO (SAML, OAuth)',
      '✅ Custom integrations',
      '✅ Dedicated support',
      '✅ SLA guarantees',
      '✅ On-premise deployment option',
      '✅ Custom AI model training',
      '✅ White-label options',
      '✅ Compliance reporting (SOC2, etc.)'
    ],
    cta: 'Contact Sales',
    limits: {
      prsPerMonth: 'Unlimited',
      reposPerMonth: 'Unlimited',
      apiCallsPerMonth: 'Unlimited'
    }
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current subscription and usage
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.subscription) {
          setCurrentTier(data.subscription.tier);
        }
        if (data.usage) {
          setUsage(data.usage);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleUpgrade = async (tierId: string) => {
    if (tierId === 'enterprise') {
      // Redirect to contact form or email
      window.location.href = 'mailto:sales@beast-mode.dev?subject=Enterprise Inquiry';
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: tierId })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const getTierFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tier');
    }
    return null;
  };

  const highlightedTier = getTierFromUrl();

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Start free, upgrade as you grow. All plans include our core quality analysis features.</p>
        
        <div className="billing-toggle">
          <button
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingCycle === 'annual' ? 'active' : ''}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="save-badge">Save 17%</span>
          </button>
        </div>
      </div>

      {currentTier && usage && (
        <div className="current-usage">
          <UpgradePrompt
            currentTier={currentTier}
            currentUsage={usage.prs_analyzed || 0}
            limit={usage.limits?.prsPerMonth || 10}
            actionType="analyze_pr"
          />
        </div>
      )}

      <div className="pricing-grid">
        {tiers.map((tier) => {
          const isCurrentTier = currentTier === tier.id;
          const isHighlighted = highlightedTier === tier.id;
          const displayPrice = billingCycle === 'annual' && tier.priceAnnual 
            ? tier.priceAnnual 
            : tier.price;
          const monthlyEquivalent = billingCycle === 'annual' && tier.priceAnnual
            ? Math.round(tier.priceAnnual / 12)
            : tier.price;

          return (
            <div
              key={tier.id}
              className={`pricing-card ${tier.popular ? 'popular' : ''} ${isCurrentTier ? 'current' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            >
              {tier.popular && (
                <div className="popular-badge">Most Popular</div>
              )}
              {isCurrentTier && (
                <div className="current-badge">Current Plan</div>
              )}

              <div className="tier-header">
                <h2>{tier.name}</h2>
                <div className="price">
                  {tier.price === 0 ? (
                    <span className="price-amount">Free</span>
                  ) : (
                    <>
                      <span className="price-amount">${monthlyEquivalent}</span>
                      <span className="price-period">/month</span>
                      {billingCycle === 'annual' && tier.priceAnnual && (
                        <span className="price-annual">Billed ${displayPrice}/year</span>
                      )}
                    </>
                  )}
                </div>
                <p className="tier-description">{tier.description}</p>
              </div>

              <div className="tier-limits">
                <h3>Limits</h3>
                <ul>
                  <li>PRs: {tier.limits.prsPerMonth}</li>
                  <li>Repos: {tier.limits.reposPerMonth}</li>
                  <li>API Calls: {tier.limits.apiCallsPerMonth}</li>
                </ul>
              </div>

              <ul className="tier-features">
                {tier.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>

              <div className="tier-cta">
                {isCurrentTier ? (
                  <button className="btn btn-current" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button
                    className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Can I change plans later?</h3>
            <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="faq-item">
            <h3>What happens if I exceed my limits?</h3>
            <p>We'll notify you when you're approaching your limits. You can upgrade at any time to continue using BEAST MODE.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.</p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel anytime?</h3>
            <p>Absolutely! Cancel anytime with no penalties. Your subscription will remain active until the end of your billing period.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .pricing-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pricing-header > p {
          font-size: 1.25rem;
          color: #6b7280;
          margin-bottom: 32px;
        }

        .billing-toggle {
          display: inline-flex;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 4px;
          gap: 4px;
        }

        .billing-toggle button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .billing-toggle button.active {
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .save-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .current-usage {
          margin-bottom: 40px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 80px;
        }

        .pricing-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          position: relative;
          transition: all 0.3s;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .pricing-card.popular {
          border-color: #667eea;
          border-width: 3px;
        }

        .pricing-card.current {
          border-color: #10b981;
        }

        .pricing-card.highlighted {
          border-color: #f59e0b;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .current-badge {
          position: absolute;
          top: -12px;
          right: 16px;
          background: #10b981;
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .tier-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .price {
          margin-bottom: 16px;
        }

        .price-amount {
          font-size: 3rem;
          font-weight: 700;
          color: #111827;
        }

        .price-period {
          font-size: 1.25rem;
          color: #6b7280;
          margin-left: 4px;
        }

        .price-annual {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 4px;
        }

        .tier-description {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .tier-limits {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .tier-limits h3 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .tier-limits ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tier-limits li {
          padding: 4px 0;
          color: #374151;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          flex: 1;
        }

        .tier-features li {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        .tier-features li:last-child {
          border-bottom: none;
        }

        .tier-cta {
          margin-top: auto;
        }

        .btn {
          width: 100%;
          padding: 14px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-current {
          background: #10b981;
          color: white;
          cursor: not-allowed;
        }

        .pricing-faq {
          margin-top: 80px;
        }

        .pricing-faq h2 {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 40px;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .faq-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
        }

        .faq-item h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .faq-item p {
          color: #6b7280;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
