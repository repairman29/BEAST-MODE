"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { TierBadge } from '../licensing/TierBadge';
import { LicenseGate } from '../licensing/LicenseGate';
import { CreditPurchase } from './CreditPurchase';

interface BillingInfo {
  subscription: {
    tier: string;
    status: string;
    price_amount: number;
    current_period_end: string;
  } | null;
  recentPayments: Array<{
    amount: number;
    status: string;
    created_at: string;
  }>;
  hasActiveSubscription: boolean;
}

export function BillingManager() {
  const { user } = useUser();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBilling();
    }
  }, [user?.id]);

  async function fetchBilling() {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/billing?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch billing info');
      const data = await response.json();
      setBilling(data);
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  }

  // Show credit purchase if requested
  if (showCreditPurchase) {
    return (
      <div>
        <button
          onClick={() => setShowCreditPurchase(false)}
          className="mb-4 text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Billing
        </button>
        <CreditPurchase />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Billing Management</h2>
        <button
          onClick={() => setShowCreditPurchase(true)}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
        >
          Buy Credits
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading billing information...</div>
      ) : !billing ? (
        <div className="text-center py-8 text-slate-400">No billing information available</div>
      ) : (
        <div className="space-y-6">
          {/* Current Subscription */}
          <div className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Current Subscription</h3>
            {billing.subscription ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TierBadge tier={billing.subscription.tier} />
                  <span className="text-slate-400">({billing.subscription.status})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Price:</span>
                  <span className="font-semibold">${(billing.subscription.price_amount / 100).toFixed(2)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Billing Date:</span>
                  <span>
                    {new Date(billing.subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <a
                    href="/dashboard?view=pricing"
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                  >
                    Change Plan
                  </a>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription?')) {
                        // Handle cancellation
                        alert('Cancellation feature coming soon');
                      }
                    }}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 mb-4">No active subscription. You're on the free tier.</p>
                <a
                  href="/dashboard?view=pricing"
                  className="inline-block px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                >
                  View Pricing Plans
                </a>
              </div>
            )}
          </div>

          {/* Payment History */}
          {billing.recentPayments.length > 0 && (
            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
              <div className="space-y-2">
                {billing.recentPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-slate-700 rounded"
                  >
                    <div>
                      <span className="font-semibold">${(payment.amount / 100).toFixed(2)}</span>
                      <span className="text-sm text-slate-400 ml-2">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        payment.status === 'completed'
                          ? 'bg-green-900 text-green-300'
                          : payment.status === 'pending'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

