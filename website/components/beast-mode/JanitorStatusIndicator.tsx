"use client";

import React from 'react';
import { Badge } from '../ui/badge';

interface JanitorStatusIndicatorProps {
  status: {
    enabled: boolean;
    silentRefactoring: { enabled: boolean; overnightMode: boolean };
    architectureEnforcement: { enabled: boolean };
    vibeRestoration: { enabled: boolean };
    repoMemory: { enabled: boolean };
    vibeOps: { enabled: boolean };
    invisibleCICD: { enabled: boolean };
  };
}

export default function JanitorStatusIndicator({ status }: JanitorStatusIndicatorProps) {
  const enabledCount = [
    status.silentRefactoring.enabled,
    status.architectureEnforcement.enabled,
    status.vibeRestoration.enabled,
    status.repoMemory.enabled,
    status.vibeOps.enabled,
    status.invisibleCICD.enabled
  ].filter(Boolean).length;

  const getStatusColor = () => {
    if (!status.enabled) return 'bg-slate-800 text-slate-400 border-slate-700';
    if (enabledCount === 6) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (enabledCount >= 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  const getStatusText = () => {
    if (!status.enabled) return 'Inactive';
    if (enabledCount === 6) return 'Fully Active';
    if (enabledCount >= 3) return 'Partially Active';
    return 'Limited';
  };

  return (
    <div className="flex items-center gap-4">
      <Badge variant="outline" className={getStatusColor()}>
        {status.enabled ? '✓' : '○'} {getStatusText()}
      </Badge>
      <div className="text-sm text-slate-400">
        {enabledCount} of 6 features enabled
      </div>
      {status.silentRefactoring.overnightMode && (
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          🌙 Overnight Mode
        </Badge>
      )}
    </div>
  );
}

