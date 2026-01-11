"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { LicenseGate } from '../licensing/LicenseGate';
import Link from 'next/link';

interface UsageStats {
  period: string;
  predictions: {
    total: number;
    withFeedback: number;
  };
  apiCalls: {
    total: number;
  };
}

interface UsageData {
  tier: string;
  usage: {
    prs_analyzed: number;
    repos_scanned: number;
    api_calls: number;
  };
  limits: {
    prsPerMonth: number;
    reposPerMonth: number;
    apiCallsPerMonth: number;
  };
  credits: {
    balance: number;
    total_purchased: number;
    total_used: number;
  };
}

export function UsageDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user?.id) {
      fetchUsage();
      fetchUsageData();
    }
  }, [user?.id, days]);

  async function fetchUsage() {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/usage?userId=${user?.id}&days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch usage stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsageData() {
    try {
      // Fetch usage and limits
      const usageResponse = await fetch('/api/user/usage');
      const usageJson = await usageResponse.json();

      // Fetch credit balance
      const creditsResponse = await fetch(`/api/credits/balance?userId=${user?.id}`);
      const creditsJson = await creditsResponse.json();

      setUsageData({
        tier: usageJson.tier || 'free',
        usage: usageJson.usage || { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 },
        limits: usageJson.limits || { prsPerMonth: 10, reposPerMonth: 3, apiCallsPerMonth: 100 },
        credits: creditsJson || { balance: 0, total_purchased: 0, total_used: 0 }
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  }

  function getUsagePercentage(used: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  function getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  }

  function formatLimit(limit: number): string {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  }

  return (
    <LicenseGate feature="usage-tracking" requireTier="developer">
      <div className="p-6 bg-slate-900 rounded-lg space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Usage Statistics</h2>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Credit Balance */}
        {usageData && (
          <div className="p-4 bg-gradient-to-r from-cyan-900 to-purple-900 rounded-lg border border-cyan-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm text-cyan-300 mb-1">Credit Balance</h3>
                <p className="text-3xl font-bold text-white">{usageData.credits.balance.toLocaleString()}</p>
                <p className="text-sm text-cyan-200 mt-1">
                  {usageData.credits.total_purchased > 0 && (
                    <>
                      {usageData.credits.total_used.toLocaleString()} used of {usageData.credits.total_purchased.toLocaleString()} purchased
                    </>
                  )}
                </p>
              </div>
              <Link
                href="/dashboard/customer?tab=billing&buy-credits=true"
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-semibold"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        )}

        {/* Usage Limits with Progress Bars */}
        {usageData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Monthly Usage Limits</h3>
            
            {/* PRs Analyzed */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">PRs Analyzed</span>
                <span className="text-sm text-slate-400">
                  {usageData.usage.prs_analyzed.toLocaleString()} / {formatLimit(usageData.limits.prsPerMonth)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(usageData.usage.prs_analyzed, usageData.limits.prsPerMonth)
                  )}`}
                  style={{
                    width: `${Math.min(100, getUsagePercentage(usageData.usage.prs_analyzed, usageData.limits.prsPerMonth))}%`
                  }}
                />
              </div>
              {getUsagePercentage(usageData.usage.prs_analyzed, usageData.limits.prsPerMonth) >= 80 && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Approaching limit. <Link href="/pricing" className="underline">Upgrade</Link> or <Link href="/dashboard/customer?tab=billing&buy-credits=true" className="underline">buy credits</Link>
                </p>
              )}
            </div>

            {/* Repos Scanned */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Repos Scanned</span>
                <span className="text-sm text-slate-400">
                  {usageData.usage.repos_scanned.toLocaleString()} / {formatLimit(usageData.limits.reposPerMonth)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(usageData.usage.repos_scanned, usageData.limits.reposPerMonth)
                  )}`}
                  style={{
                    width: `${Math.min(100, getUsagePercentage(usageData.usage.repos_scanned, usageData.limits.reposPerMonth))}%`
                  }}
                />
              </div>
            </div>

            {/* API Calls */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">API Calls</span>
                <span className="text-sm text-slate-400">
                  {usageData.usage.api_calls.toLocaleString()} / {formatLimit(usageData.limits.apiCallsPerMonth)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(usageData.usage.api_calls, usageData.limits.apiCallsPerMonth)
                  )}`}
                  style={{
                    width: `${Math.min(100, getUsagePercentage(usageData.usage.api_calls, usageData.limits.apiCallsPerMonth))}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Historical Stats */}
        {loading ? (
          <div className="text-center py-8">Loading usage statistics...</div>
        ) : !stats ? (
          <div className="text-center py-8 text-slate-400">No usage data available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-sm text-slate-400 mb-2">Predictions</h3>
              <p className="text-3xl font-bold text-cyan-400">{stats.predictions.total.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.predictions.withFeedback} with feedback
              </p>
            </div>

            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-sm text-slate-400 mb-2">API Calls</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.apiCalls.total.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Total requests</p>
            </div>

            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-sm text-slate-400 mb-2">Feedback Rate</h3>
              <p className="text-3xl font-bold text-green-400">
                {stats.predictions.total > 0
                  ? ((stats.predictions.withFeedback / stats.predictions.total) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500 mt-1">With feedback</p>
            </div>
          </div>
        )}

        {/* Period Info */}
        {stats && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">Period</h3>
            <p className="text-slate-400">Last {stats.period || `${days} days`}</p>
          </div>
        )}
      </div>
    </LicenseGate>
  );
}
