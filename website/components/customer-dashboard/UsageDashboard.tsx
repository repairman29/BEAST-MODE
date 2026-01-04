"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { LicenseGate } from '../licensing/LicenseGate';

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

export function UsageDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user?.id) {
      fetchUsage();
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

  return (
    <LicenseGate feature="usage-tracking" requireTier="developer">
      <div className="p-6 bg-slate-900 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Usage Statistics</h2>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading usage statistics...</div>
        ) : !stats ? (
          <div className="text-center py-8 text-slate-400">No usage data available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="mt-6 p-4 bg-slate-800 rounded-lg">
          <h3 className="font-semibold mb-2">Period</h3>
          <p className="text-slate-400">Last {stats?.period || `${days} days`}</p>
        </div>
      </div>
    </LicenseGate>
  );
}

