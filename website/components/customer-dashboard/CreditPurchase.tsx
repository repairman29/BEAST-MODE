"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';

interface CreditPackage {
  name: string;
  credits: number;
  price: number; // in cents
  priceId: string;
  description: string;
  popular?: boolean;
}

// Credit packages - Price IDs will be loaded from Stripe or config
// TODO: Fetch from API or environment variables for production
const DEFAULT_PACKAGES: CreditPackage[] = [
  {
    name: '100 Credits',
    credits: 100,
    price: 500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS || '', // Set in .env.local
    description: 'Perfect for trying premium features',
  },
  {
    name: '500 Credits',
    credits: 500,
    price: 2000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_500_CREDITS || '',
    description: 'Great for small projects',
  },
  {
    name: '1,000 Credits',
    credits: 1000,
    price: 3500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_1000_CREDITS || '',
    description: 'Best value for regular users',
    popular: true,
  },
  {
    name: '5,000 Credits',
    credits: 5000,
    price: 15000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_5000_CREDITS || '',
    description: 'For power users and teams',
  },
  {
    name: '10,000 Credits',
    credits: 10000,
    price: 25000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_10000_CREDITS || '',
    description: 'Maximum value for heavy usage',
  },
];

export function CreditPurchase() {
  const { user } = useUser();
  const [packages, setPackages] = useState<CreditPackage[]>(DEFAULT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch actual Stripe price IDs from API or config
    // For now, using default packages
  }, []);

  async function handlePurchase(packageItem: CreditPackage) {
    if (!user?.id) {
      setError('Please sign in to purchase credits');
      return;
    }

    if (!packageItem.priceId) {
      setError('Price ID not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: packageItem.priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-slate-900 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
        <p className="text-slate-400">
          Purchase credits to exceed your monthly limits without upgrading your plan.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className={`p-6 bg-slate-800 rounded-lg border-2 transition-all ${
              pkg.popular
                ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            {pkg.popular && (
              <div className="mb-2">
                <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded">
                  Most Popular
                </span>
              </div>
            )}

            <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
            <p className="text-sm text-slate-400 mb-4">{pkg.description}</p>

            <div className="mb-4">
              <div className="text-3xl font-bold text-cyan-400">
                ${(pkg.price / 100).toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">
                {pkg.credits.toLocaleString()} credits
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ${((pkg.price / 100) / pkg.credits).toFixed(3)} per credit
              </div>
            </div>

            <button
              onClick={() => handlePurchase(pkg)}
              disabled={loading || !pkg.priceId}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                pkg.popular
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : pkg.priceId ? 'Purchase' : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h3 className="font-semibold mb-2">How Credits Work</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Credits never expire</li>
          <li>• Use credits when you exceed your monthly limits</li>
          <li>• 1 credit = 1 API call or 1 PR analysis</li>
          <li>• Credits are used automatically when needed</li>
          <li>• View your credit balance in the Usage tab</li>
        </ul>
      </div>
    </div>
  );
}
