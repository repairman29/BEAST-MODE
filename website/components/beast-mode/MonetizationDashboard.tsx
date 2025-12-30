"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface RevenueMetrics {
  totalRevenue: number;
  revenueByType: Record<string, number>;
  topEarningPlugins: Array<[string, number]>;
  growthRate: number;
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
}

interface AnalyticsData {
  analytics: {
    metrics: {
      users?: any;
      plugins?: any;
      revenue?: RevenueMetrics;
      engagement?: any;
      marketplace?: any;
    };
  };
  marketplace: {
    totalPlugins: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  stripe?: {
    totalRevenue: number;
    monthlyRevenue: number;
    transactions: number;
    growthRate?: number;
    note?: string;
    subscriptions?: {
      active: number;
      total: number;
      churnRate?: number;
      trialing?: number;
      canceled?: number;
      pastDue?: number;
    };
    customers?: {
      total: number;
      new: number;
    };
    plans?: Array<{
      id: string;
      name: string;
      price: number;
      subscribers: number;
    }>;
    recentTransactions?: Array<{
      id: string;
      amount: number;
      customer: string;
      date: string;
      status: string;
    }>;
    revenueByType?: Record<string, number>;
    revenueByPlan?: Record<string, number>;
    conversion?: {
      rate: number;
      trials: number;
      converted: number;
    };
    projections?: {
      nextMonth: number;
      nextQuarter: number;
      nextYear: number;
    };
    mrr?: number;
    arr?: number;
  };
}

/**
 * BEAST MODE Monetization & Analytics Dashboard
 *
 * Revenue tracking, marketplace analytics, and monetization insights
 */
function MonetizationDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Try Stripe analytics first
      const stripeResponse = await fetch(`/api/stripe/analytics?timeframe=${timeframe}`);
      let stripeData = null;
      if (stripeResponse.ok) {
        stripeData = await stripeResponse.json();
      }

      // Also fetch marketplace analytics
      const marketplaceResponse = await fetch(`/api/beast-mode/marketplace/analytics?timeframe=${timeframe}`);
      let marketplaceData = null;
      if (marketplaceResponse.ok) {
        marketplaceData = await marketplaceResponse.json();
      }

      // Merge data
      const mergedData = {
        ...marketplaceData,
        stripe: stripeData
      };
      setAnalytics(mergedData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRevenueChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800 w-full max-w-6xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400">Loading monetization analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-slate-900/90 border-slate-800 w-full max-w-6xl">
        <CardContent className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">❌ Analytics unavailable</div>
          <p className="text-slate-400 text-sm mb-4">Unable to fetch analytics data. Please try again later.</p>
          <Button onClick={fetchAnalytics} className="bg-white text-black hover:bg-slate-100">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { metrics } = analytics.analytics;
  const { marketplace } = analytics;

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">💰 BEAST MODE Monetization</CardTitle>
            <div className="flex gap-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button onClick={fetchAnalytics} variant="outline" size="sm" className="border-slate-800">
                🔄 Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(analytics.stripe?.totalRevenue || marketplace.totalRevenue)}
            </div>
            <div className="text-slate-400 text-sm">Total Revenue</div>
            <div className="text-xs text-green-400">
              +{(analytics.stripe?.growthRate || metrics.revenue?.growthRate || 0).toFixed(1)}% growth
            </div>
            {analytics.stripe?.note && (
              <div className="text-xs text-amber-400 mt-1">{analytics.stripe.note}</div>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {formatCurrency(analytics.stripe?.monthlyRevenue || marketplace.monthlyRevenue)}
            </div>
            <div className="text-slate-400 text-sm">Monthly Revenue</div>
            <div className="text-xs text-cyan-400">
              {analytics.stripe?.subscriptions?.active || 0} active subscriptions
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {marketplace.totalPlugins}
            </div>
            <div className="text-slate-400 text-sm">Total Plugins</div>
            <div className="text-xs text-amber-400">
              {metrics.plugins?.summary?.totalInstalls || 0} installs
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {metrics.users?.totalUsers || 0}
            </div>
            <div className="text-slate-400 text-sm">Active Users</div>
            <div className="text-xs text-purple-400">
              {metrics.marketplace?.downloads?.total || 0} downloads
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Stripe Subscriptions */}
      {analytics.stripe?.subscriptions && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">💳 Stripe Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {analytics.stripe.subscriptions.active}
                </div>
                <div className="text-slate-400 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {analytics.stripe.subscriptions.trialing}
                </div>
                <div className="text-slate-400 text-sm">Trialing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {analytics.stripe.subscriptions.canceled}
                </div>
                <div className="text-slate-400 text-sm">Canceled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {analytics.stripe?.recentTransactions && analytics.stripe.recentTransactions.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.stripe.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="text-white text-sm">{tx.description}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(tx.created * 1000).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      tx.status === 'succeeded' ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown */}
      {(metrics.revenue || analytics.stripe) && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">💵 Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Type */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Revenue by Type</h4>
              <div className="space-y-2">
                {Object.entries(analytics.stripe?.revenueByType || metrics.revenue?.revenueByType || {}).map(([type, amount]) => {
                  const total = analytics.stripe?.totalRevenue || metrics.revenue?.totalRevenue || 1;
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-white capitalize">{type}</span>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">{formatCurrency(amount as number)}</div>
                        <div className="text-xs text-slate-400">
                          {((amount as number / total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Earning Plugins */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Top Earning Plugins</h4>
              <div className="space-y-2">
                {metrics.revenue.topEarningPlugins.slice(0, 5).map(([pluginId, revenue], index) => (
                  <div key={pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{index + 1}</span>
                      <span className="text-white text-sm">{pluginId}</span>
                    </div>
                    <span className="text-green-400 font-semibold">{formatCurrency(revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Projections */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-amber-400 font-semibold mb-3">Revenue Projections</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  {formatCurrency(analytics.stripe?.projections?.nextMonth || metrics.revenue?.projections?.nextMonth || 0)}
                </div>
                <div className="text-slate-400 text-sm">Next Month</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">
                  {formatCurrency(analytics.stripe?.projections?.nextQuarter || metrics.revenue?.projections?.nextQuarter || 0)}
                </div>
                <div className="text-slate-400 text-sm">Next Quarter</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {formatCurrency(analytics.stripe?.projections?.nextYear || metrics.revenue?.projections?.nextYear || 0)}
                </div>
                <div className="text-slate-400 text-sm">Next Year</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Marketplace Performance */}
      {metrics.marketplace && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🛒 Marketplace Performance</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Searches */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Search Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Total Searches</span>
                  <span className="text-cyan-400 font-semibold">{metrics.marketplace.searches.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Unique Queries</span>
                  <span className="text-cyan-400 font-semibold">{metrics.marketplace.searches.uniqueQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Conversion Rate</span>
                  <span className="text-green-400 font-semibold">{metrics.marketplace.purchases.conversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Downloads</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Total Downloads</span>
                  <span className="text-cyan-400 font-semibold">{metrics.marketplace.downloads.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Purchases</span>
                  <span className="text-green-400 font-semibold">{metrics.marketplace.purchases.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Avg Order Value</span>
                  <span className="text-purple-400 font-semibold">
                    {formatCurrency(metrics.marketplace.purchases.avgOrderValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Search Terms */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Top Search Terms</h4>
              <div className="space-y-1">
                {metrics.marketplace.searches.topTerms.slice(0, 5).map(([term, count], index) => (
                  <div key={term} className="flex justify-between text-sm">
                    <span className="text-white">{term}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Plugin Performance */}
      {metrics.plugins && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔌 Plugin Performance</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Installed */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Most Installed</h4>
              <div className="space-y-2">
                {metrics.plugins.mostInstalled.slice(0, 5).map((plugin, index) => (
                  <div key={plugin.pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{index + 1}</span>
                      <span className="text-white text-sm">{plugin.pluginId}</span>
                    </div>
                    <span className="text-green-400 font-semibold">{plugin.installs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Used */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Most Used</h4>
              <div className="space-y-2">
                {metrics.plugins.mostUsed.slice(0, 5).map((plugin, index) => (
                  <div key={plugin.pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{index + 1}</span>
                      <span className="text-white text-sm">{plugin.pluginId}</span>
                    </div>
                    <span className="text-cyan-400 font-semibold">{plugin.uses}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Rates */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Success Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Avg Success Rate</span>
                  <span className="text-green-400 font-semibold">{metrics.plugins.summary.avgSuccessRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Avg Retention</span>
                  <span className="text-purple-400 font-semibold">{metrics.plugins.summary.avgRetentionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Total Uses</span>
                  <span className="text-cyan-400 font-semibold">{metrics.plugins.summary.totalUses}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="text-xs text-slate-400 text-center">
          💰 Monetization Dashboard | 📊 {timeframe} analytics |
          💵 {formatCurrency(marketplace.totalRevenue)} total revenue |
          📈 {metrics.revenue?.growthRate.toFixed(1)}% growth |
          🔄 Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default MonetizationDashboard;
