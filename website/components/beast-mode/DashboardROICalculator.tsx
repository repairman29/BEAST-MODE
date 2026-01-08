"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useUser } from '@/lib/user-context';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * Dashboard ROI Calculator
 * Pre-filled with user's actual usage data
 */
export default function DashboardROICalculator() {
  const { user } = useUser();
  const [apiCallsUsed, setApiCallsUsed] = useState(0);
  const [tier, setTier] = useState<'free' | 'developer' | 'team' | 'enterprise'>('free');
  const [developers, setDevelopers] = useState(1);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [selectedTier, setSelectedTier] = useState('developer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  async function fetchUserData() {
    try {
      setLoading(true);
      
      // Get API usage
      const apiKey = localStorage.getItem('beastModeApiKey');
      if (!apiKey) {
        // No API key - use default free tier values
        setApiCallsUsed(0);
        setTier('free');
        setLoading(false);
        return;
      }
      
      const usageResponse = await fetch(`/api/auth/usage`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setApiCallsUsed(usageData.used || 0);
        setTier(usageData.tier || 'free');
        setSelectedTier(usageData.tier || 'developer');
        
        // Estimate developers based on usage
        // Conservative: 1 developer per 10K calls/month
        const estimatedDevs = Math.max(1, Math.ceil((usageData.used || 0) / 10000));
        setDevelopers(estimatedDevs);
        
        // Estimate hours saved based on actual usage
        // 13 minutes saved per API call (conservative)
        const hoursSaved = ((usageData.used || 0) * 13) / 60;
        const hoursPerWeekPerDev = hoursSaved / (estimatedDevs * 4.33); // weeks to months
        setHoursPerWeek(Math.max(1, Math.round(hoursPerWeekPerDev)));
      } else if (usageResponse.status === 401) {
        // Unauthorized - use default free tier values
        setApiCallsUsed(0);
        setTier('free');
        setSelectedTier('developer');
        setDevelopers(1);
        setHoursPerWeek(1);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }

  const tiers = {
    free: { price: 0, name: 'Free', calls: '10K' },
    developer: { price: 79, name: 'Developer', calls: '100K' },
    team: { price: 299, name: 'Team', calls: '500K' },
    enterprise: { price: 799, name: 'Enterprise', calls: 'Unlimited' }
  };

  // Calculate ROI
  const monthlyTimeValue = developers * hoursPerWeek * hourlyRate * 4.33; // weeks to months
  const annualTimeValue = monthlyTimeValue * 12;
  const monthlyCost = tiers[selectedTier as keyof typeof tiers].price;
  const annualCost = monthlyCost * 12;
  const monthlyROI = monthlyTimeValue - monthlyCost;
  const annualROI = annualTimeValue - annualCost;
  const roiMultiplier = monthlyCost > 0 ? (monthlyTimeValue / monthlyCost).toFixed(1) : '∞';

  // Calculate actual value from usage
  const actualTimeSaved = (apiCallsUsed * 13) / 60; // hours
  const actualValue = actualTimeSaved * hourlyRate;

  if (loading) {
    return (
      <Card className="bg-slate-950/50 border-slate-900">
        <CardContent className="p-6">
          <LoadingSpinner size="md" text="Loading ROI calculator..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950/50 border-slate-900">
      <CardHeader>
        <CardTitle className="text-2xl text-white">ROI Calculator</CardTitle>
        <CardDescription className="text-slate-400">
          Calculate your potential savings with BEAST MODE
          {apiCallsUsed > 0 && (
            <span className="block mt-1 text-xs">
              Pre-filled with your actual usage: {apiCallsUsed.toLocaleString()} API calls
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Actual Value from Usage */}
          {apiCallsUsed > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Your Actual Value This Month</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Time Saved</div>
                  <div className="text-2xl font-bold text-green-400">
                    {actualTimeSaved.toFixed(1)} hrs
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Estimated Value</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    ${actualValue.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Based on {apiCallsUsed.toLocaleString()} API calls × 13 min/call × ${hourlyRate}/hr
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Developers
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={developers}
                onChange={(e) => setDevelopers(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hours Saved Per Week (per dev)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Average Hourly Rate ($)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseInt(e.target.value) || 20)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Plan
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(tiers).map(([key, tier]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTier(key)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedTier === key
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{tier.name}</div>
                  <div className="text-xs text-slate-500">${tier.price}/mo</div>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Estimated Value</h3>
            <div className="mb-4 p-3 bg-slate-900/50 rounded border border-slate-800">
              <p className="text-xs text-slate-400 italic">
                ⚠️ This calculator provides estimates based on your inputs. Actual time savings and value will vary based on your specific use case and codebase.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">Estimated Monthly Time Value</div>
                <div className="text-3xl font-bold text-green-400">
                  ${monthlyTimeValue.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  If time saved = value
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Monthly Cost</div>
                <div className="text-3xl font-bold text-slate-300">
                  ${monthlyCost.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Potential Net Value</div>
                <div className="text-3xl font-bold text-cyan-400">
                  ${monthlyROI.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  If estimates are accurate
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Value Multiplier</div>
                <div className="text-3xl font-bold text-purple-400">
                  {roiMultiplier}x
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Estimated ratio
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Potential Annual Value</div>
              <div className="text-4xl font-bold text-gradient-cyan">
                ${annualROI.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                Based on {developers} developers × {hoursPerWeek} hours/week × ${hourlyRate}/hour
              </div>
              <div className="text-xs text-slate-600 mt-2 italic">
                *These are estimates. Actual results will vary.
              </div>
            </div>
          </div>

          {/* Tier Comparison Table */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-white mb-3">Compare All Tiers</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Tier</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Price</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Monthly Value</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Net Value</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">ROI</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-medium">Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tiers).map(([key, tierData]) => {
                    const tierMonthlyValue = developers * hoursPerWeek * hourlyRate * 4.33;
                    const tierCost = tierData.price;
                    const tierNetValue = tierMonthlyValue - tierCost;
                    const tierROI = tierCost > 0 ? ((tierMonthlyValue - tierCost) / tierCost * 100).toFixed(0) : '∞';
                    const isCurrentTier = tier === key;
                    const isSelectedTier = selectedTier === key;
                    
                    return (
                      <tr
                        key={key}
                        className={`border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors ${
                          isCurrentTier ? 'bg-cyan-500/10' : ''
                        } ${isSelectedTier ? 'ring-2 ring-cyan-500/50' : ''}`}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{tierData.name}</span>
                            {isCurrentTier && (
                              <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                                Current
                              </span>
                            )}
                            {isSelectedTier && !isCurrentTier && (
                              <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-2 px-3 text-slate-300">
                          ${tierCost.toLocaleString()}/mo
                        </td>
                        <td className="text-right py-2 px-3 text-green-400 font-medium">
                          ${tierMonthlyValue.toLocaleString()}
                        </td>
                        <td className={`text-right py-2 px-3 font-medium ${
                          tierNetValue >= 0 ? 'text-cyan-400' : 'text-red-400'
                        }`}>
                          ${tierNetValue.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-3 text-purple-400 font-medium">
                          {tierROI === '∞' ? '∞' : `${tierROI}%`}
                        </td>
                        <td className="text-center py-2 px-3 text-slate-400">
                          {tierData.calls}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgrade CTA */}
          {tier !== selectedTier && (
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-cyan-500/20 mt-6">
              <p className="text-sm text-slate-300 mb-3">
                Upgrade to <span className="text-cyan-400 font-semibold">{tiers[selectedTier as keyof typeof tiers].name}</span> to unlock more value
              </p>
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => window.location.href = '/pricing'}
              >
                View Pricing & Upgrade
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

