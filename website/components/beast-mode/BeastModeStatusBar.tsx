"use client";

import React from 'react';

interface BeastModeStatusBarProps {
  quality: {
    score: number;
    issues: number;
    improvements: number;
  };
  intelligence: {
    accuracy: number;
    insights: number;
  };
  enterprise: {
    uptime: number;
  };
  marketplace: {
    revenue: number;
  };
}

/**
 * BEAST MODE Status Bar - Shows code quality metrics
 * Replaces game-themed status bar with actual development metrics
 */
export default function BeastModeStatusBar({
  quality,
  intelligence,
  enterprise,
  marketplace
}: BeastModeStatusBarProps) {
  const StatItem = ({
    label,
    value,
    max,
    color = 'cyan',
    icon
  }: {
    label: string;
    value: number;
    max?: number;
    color?: 'cyan' | 'green' | 'amber' | 'red' | 'purple';
    icon?: React.ReactNode;
  }) => {
    const colorClass = {
      cyan: 'text-cyan-400',
      green: 'text-green-400',
      amber: 'text-amber-400',
      red: 'text-red-400',
      purple: 'text-purple-400'
    }[color];

    const barColor = {
      cyan: 'bg-cyan-500',
      green: 'bg-green-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    }[color];

    const percentage = max ? (value / max) * 100 : 100;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
            {icon}
            {label}
          </span>
          <span className={`text-sm font-bold ${colorClass}`}>
            {Math.round(value)}
            {max && <span className="text-slate-500 text-xs">/{max}</span>}
          </span>
        </div>
        {max && (
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-64 max-w-[calc(100vw-2rem)]">
      <div className="bg-black/80 backdrop-blur-md border border-slate-800 shadow-xl rounded-lg p-4 space-y-3 max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-cyan-500/50 rounded-tr-lg" />

        <StatItem
          label="QUALITY SCORE"
          value={quality.score}
          max={100}
          color={quality.score >= 80 ? 'green' : quality.score >= 60 ? 'amber' : 'red'}
          icon={<span className="text-xs">⚡</span>}
        />

        <StatItem
          label="AI ACCURACY"
          value={intelligence.accuracy}
          max={100}
          color={intelligence.accuracy >= 90 ? 'cyan' : intelligence.accuracy >= 75 ? 'amber' : 'red'}
          icon={<span className="text-xs">🧠</span>}
        />

        <StatItem
          label="UPTIME"
          value={enterprise.uptime}
          max={100}
          color={enterprise.uptime >= 99 ? 'green' : enterprise.uptime >= 95 ? 'amber' : 'red'}
          icon={<span className="text-xs">🚀</span>}
        />

        <StatItem
          label="INSIGHTS"
          value={intelligence.insights}
          max={100}
          color="purple"
          icon={<span className="text-xs">💡</span>}
        />

        <div className="pt-2 border-t border-slate-800">
          <StatItem
            label="REVENUE"
            value={marketplace.revenue}
            color="amber"
            icon={<span className="text-xs">💰</span>}
          />
        </div>
      </div>
    </div>
  );
}

