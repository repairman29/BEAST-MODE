"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

function ROICalculator() {
  const [developers, setDevelopers] = useState(5);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [selectedTier, setSelectedTier] = useState('developer');

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

  return (
    <Card className="bg-slate-950/50 border-slate-900">
      <CardHeader>
        <CardTitle className="text-3xl text-white">ROI Calculator</CardTitle>
        <CardDescription className="text-slate-400">
          Calculate your potential savings with BEAST MODE
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => window.location.href = '/dashboard?view=auth&action=signup'}
            >
              Start Saving Today
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ROICalculator;

