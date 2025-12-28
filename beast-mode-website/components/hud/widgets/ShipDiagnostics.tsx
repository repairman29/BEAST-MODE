"use client";

import React from 'react';
import HudPanel from '../HudPanel';
import HudButton from '../HudButton';
import { useWidget, WIDGET_CONFIGS } from '../HudController';

interface ShipSystem {
  name: string;
  status: 'online' | 'damaged' | 'offline';
  health: number;
}

interface ShipDiagnosticsProps {
  systems: ShipSystem[];
  onRepair?: (systemName: string) => void;
}

/**
 * Ship diagnostics - shows when ship systems are damaged
 */
export default function ShipDiagnostics({ systems, onRepair }: ShipDiagnosticsProps) {
  const isVisible = useWidget(WIDGET_CONFIGS.SHIP_DIAGNOSTICS);

  const damagedSystems = systems.filter(s => s.status !== 'online');

  if (!isVisible || damagedSystems.length === 0) return null;

  return (
    <div className="fixed top-20 right-80 z-40 w-72">
      <HudPanel corners glow="medium" className="border-l-2 border-holo-red">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-holo-red text-lg">⚠</span>
          <div className="text-holo-red uppercase tracking-widest text-xs">
            System Damage
          </div>
        </div>

        <div className="space-y-2">
          {damagedSystems.map(system => (
            <div key={system.name} className="bg-void-surface/50 p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-holo-amber">{system.name}</div>
                <SystemStatus status={system.status} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      system.health > 60 ? 'bg-holo-green' :
                      system.health > 30 ? 'bg-holo-amber' : 'bg-holo-red'
                    }`}
                    style={{ width: `${system.health}%` }}
                  />
                </div>
                <span className="text-xs text-holo-amber-dim">
                  {system.health}%
                </span>
              </div>

              {system.status === 'damaged' && (
                <HudButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onRepair?.(system.name)}
                >
                  Repair System
                </HudButton>
              )}

              {system.status === 'offline' && (
                <div className="text-xs text-holo-red text-center">
                  Critical damage - requires station repair
                </div>
              )}
            </div>
          ))}
        </div>
      </HudPanel>
    </div>
  );
}

function SystemStatus({ status }: { status: string }) {
  const config = {
    online: { text: 'ONLINE', color: 'text-holo-green' },
    damaged: { text: 'DAMAGED', color: 'text-holo-amber' },
    offline: { text: 'OFFLINE', color: 'text-holo-red' }
  }[status] || { text: status, color: 'text-holo-amber-faint' };

  return (
    <span className={`text-xs ${config.color} uppercase tracking-wider`}>
      {config.text}
    </span>
  );
}
