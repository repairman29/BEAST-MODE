"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

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
      const response = await fetch(`/api/beast-mode/marketplace/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
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
      <HudPanel className="w-full max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-holo-cyan border-t-transparent rounded-full mr-4"></div>
          <span className="text-holo-cyan">Loading monetization analytics...</span>
        </div>
      </HudPanel>
    );
  }

  if (!analytics) {
    return (
      <HudPanel className="w-full max-w-6xl">
        <div className="text-center py-12">
          <span className="text-holo-red">❌ Analytics unavailable</span>
        </div>
      </HudPanel>
    );
  }

  const { metrics } = analytics.analytics;
  const { marketplace } = analytics;

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <HudPanel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-holo-cyan font-bold text-xl">💰 BEAST MODE Monetization</h2>
          <div className="flex gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-1 text-holo-cyan text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <HudButton onClick={fetchAnalytics}>
              🔄 Refresh
            </HudButton>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-holo-green">
              {formatCurrency(marketplace.totalRevenue)}
            </div>
            <div className="text-holo-cyan/70 text-sm">Total Revenue</div>
            <div className="text-xs text-holo-green">
              +{metrics.revenue?.growthRate.toFixed(1)}% growth
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-cyan">
              {formatCurrency(marketplace.monthlyRevenue)}
            </div>
            <div className="text-holo-cyan/70 text-sm">Monthly Revenue</div>
            <div className="text-xs text-holo-cyan">
              Recurring
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-amber">
              {marketplace.totalPlugins}
            </div>
            <div className="text-holo-cyan/70 text-sm">Total Plugins</div>
            <div className="text-xs text-holo-amber">
              {metrics.plugins?.summary?.totalInstalls || 0} installs
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-purple">
              {metrics.users?.totalUsers || 0}
            </div>
            <div className="text-holo-cyan/70 text-sm">Active Users</div>
            <div className="text-xs text-holo-purple">
              {metrics.marketplace?.downloads?.total || 0} downloads
            </div>
          </div>
        </div>
      </HudPanel>

      {/* Revenue Breakdown */}
      {metrics.revenue && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">💵 Revenue Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Type */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Revenue by Type</h4>
              <div className="space-y-2">
                {Object.entries(metrics.revenue.revenueByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-holo-cyan capitalize">{type}</span>
                    <div className="text-right">
                      <div className="text-holo-green font-semibold">{formatCurrency(amount)}</div>
                      <div className="text-xs text-holo-cyan/70">
                        {((amount / metrics.revenue.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Earning Plugins */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Top Earning Plugins</h4>
              <div className="space-y-2">
                {metrics.revenue.topEarningPlugins.slice(0, 5).map(([pluginId, revenue], index) => (
                  <div key={pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-holo-cyan/70">#{index + 1}</span>
                      <span className="text-holo-cyan text-sm">{pluginId}</span>
                    </div>
                    <span className="text-holo-green font-semibold">{formatCurrency(revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Projections */}
          <div className="mt-6 pt-4 border-t border-holo-cyan/30">
            <h4 className="text-holo-amber font-semibold mb-3">Revenue Projections</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-holo-green">
                  {formatCurrency(metrics.revenue.projections.nextMonth)}
                </div>
                <div className="text-holo-cyan/70 text-sm">Next Month</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-holo-cyan">
                  {formatCurrency(metrics.revenue.projections.nextQuarter)}
                </div>
                <div className="text-holo-cyan/70 text-sm">Next Quarter</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-holo-purple">
                  {formatCurrency(metrics.revenue.projections.nextYear)}
                </div>
                <div className="text-holo-cyan/70 text-sm">Next Year</div>
              </div>
            </div>
          </div>
        </HudPanel>
      )}

      {/* Marketplace Performance */}
      {metrics.marketplace && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">🛒 Marketplace Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Searches */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Search Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Total Searches</span>
                  <span className="text-holo-cyan font-semibold">{metrics.marketplace.searches.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Unique Queries</span>
                  <span className="text-holo-cyan font-semibold">{metrics.marketplace.searches.uniqueQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Conversion Rate</span>
                  <span className="text-holo-green font-semibold">{metrics.marketplace.purchases.conversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Downloads</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Total Downloads</span>
                  <span className="text-holo-cyan font-semibold">{metrics.marketplace.downloads.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Purchases</span>
                  <span className="text-holo-green font-semibold">{metrics.marketplace.purchases.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Avg Order Value</span>
                  <span className="text-holo-purple font-semibold">
                    {formatCurrency(metrics.marketplace.purchases.avgOrderValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Search Terms */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Top Search Terms</h4>
              <div className="space-y-1">
                {metrics.marketplace.searches.topTerms.slice(0, 5).map(([term, count], index) => (
                  <div key={term} className="flex justify-between text-sm">
                    <span className="text-holo-cyan">{term}</span>
                    <span className="text-holo-cyan/70">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </HudPanel>
      )}

      {/* Plugin Performance */}
      {metrics.plugins && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">🔌 Plugin Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Installed */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Most Installed</h4>
              <div className="space-y-2">
                {metrics.plugins.mostInstalled.slice(0, 5).map((plugin, index) => (
                  <div key={plugin.pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-holo-cyan/70">#{index + 1}</span>
                      <span className="text-holo-cyan text-sm">{plugin.pluginId}</span>
                    </div>
                    <span className="text-holo-green font-semibold">{plugin.installs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Used */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Most Used</h4>
              <div className="space-y-2">
                {metrics.plugins.mostUsed.slice(0, 5).map((plugin, index) => (
                  <div key={plugin.pluginId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-holo-cyan/70">#{index + 1}</span>
                      <span className="text-holo-cyan text-sm">{plugin.pluginId}</span>
                    </div>
                    <span className="text-holo-cyan font-semibold">{plugin.uses}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Rates */}
            <div>
              <h4 className="text-holo-amber font-semibold mb-3">Success Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Avg Success Rate</span>
                  <span className="text-holo-green font-semibold">{metrics.plugins.summary.avgSuccessRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Avg Retention</span>
                  <span className="text-holo-purple font-semibold">{metrics.plugins.summary.avgRetentionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-holo-cyan">Total Uses</span>
                  <span className="text-holo-cyan font-semibold">{metrics.plugins.summary.totalUses}</span>
                </div>
              </div>
            </div>
          </div>
        </HudPanel>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-void-surface/50 rounded-lg border border-holo-cyan/20">
        <div className="text-xs text-holo-cyan/70 text-center">
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
