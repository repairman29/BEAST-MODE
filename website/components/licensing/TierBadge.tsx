"use client";

import React from 'react';
import { getLicenseInfo } from '@/lib/licensing';

interface TierBadgeProps {
  tier: string;
  type?: string;
  className?: string;
}

export function TierBadge({ tier, type, className = '' }: TierBadgeProps) {
  const licenseInfo = getLicenseInfo({ tier, type: type || 'free' });

  const tierStyles: Record<string, string> = {
    free: 'bg-slate-700 text-slate-300',
    developer: 'bg-cyan-900 text-cyan-300',
    team: 'bg-purple-900 text-purple-300',
    sentinel: 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold'
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${tierStyles[tier] || tierStyles.free} ${className}`}
    >
      {licenseInfo.tierName}
    </span>
  );
}

