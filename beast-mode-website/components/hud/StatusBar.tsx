"use client";

import React from 'react';

interface StatusBarProps {
  player: {
    health?: number;
    maxHealth?: number;
    shields?: number;
    maxShields?: number;
    credits?: number;
  };
  ship: {
    hull?: number;
    fuel?: number;
  };
}

/**
 * Always-visible status bar showing critical stats
 * Positioned in top-right corner
 */
export default function StatusBar({ player, ship }: StatusBarProps) {
  const health = player?.health ?? 100;
  const maxHealth = player?.maxHealth ?? 100;
  const shields = player?.shields ?? 0;
  const maxShields = player?.maxShields ?? 100;
  const credits = player?.credits ?? 0;
  const hull = ship?.hull ?? 80;
  const fuel = ship?.fuel ?? 80;

  const healthPercent = (health / maxHealth) * 100;
  const shieldsPercent = maxShields > 0 ? (shields / maxShields) * 100 : 0;

  const StatItem = ({
    label,
    value,
    max,
    color = 'amber',
    icon
  }: {
    label: string;
    value: number;
    max?: number;
    color?: 'amber' | 'green' | 'cyan' | 'red';
    icon?: string;
  }) => {
    const colorClass = {
      amber: 'text-holo-amber',
      green: 'text-holo-green',
      cyan: 'text-holo-cyan',
      red: 'text-holo-red'
    }[color];

    const barColor = {
      amber: 'bg-holo-amber',
      green: 'bg-holo-green',
      cyan: 'bg-holo-cyan',
      red: 'bg-holo-red'
    }[color];

    const percentage = max ? (value / max) * 100 : 100;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-holo-amber-faint uppercase tracking-widest">
            {icon && <span className="mr-1">{icon}</span>}
            {label}
          </span>
          <span className={`text-sm font-bold ${colorClass}`}>
            {Math.round(value)}
            {max && <span className="text-holo-amber-ghost text-xs">/{max}</span>}
          </span>
        </div>
        {max && (
          <div className="h-1 bg-void-surface rounded-full overflow-hidden">
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
    <div className="fixed top-4 right-4 z-50 w-64">
      <div className="bg-void-surface/80 backdrop-blur-hud shadow-holo-soft p-3 space-y-2">
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-holo-amber-faint" />

        <StatItem
          label="HEALTH"
          value={health}
          max={maxHealth}
          color={healthPercent > 50 ? 'green' : healthPercent > 25 ? 'amber' : 'red'}
          icon="❤️"
        />

        {maxShields > 0 && (
          <StatItem
            label="SHIELDS"
            value={shields}
            max={maxShields}
            color="cyan"
            icon="🛡️"
          />
        )}

        <StatItem
          label="HULL"
          value={hull}
          max={100}
          color={hull > 60 ? 'green' : hull > 30 ? 'amber' : 'red'}
          icon="🚀"
        />

        <StatItem
          label="FUEL"
          value={fuel}
          max={100}
          color={fuel > 40 ? 'amber' : 'red'}
          icon="⚡"
        />

        <div className="pt-2 border-t border-holo-amber-ghost">
          <StatItem
            label="CREDITS"
            value={credits}
            color="amber"
            icon="₡"
          />
        </div>
      </div>
    </div>
  );
}
