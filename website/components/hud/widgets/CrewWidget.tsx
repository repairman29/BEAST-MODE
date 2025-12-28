"use client";

import React from 'react';
import HudPanel from '../HudPanel';

interface CrewMember {
  id: number;
  name: string;
  role: string;
  health: number;
  morale: number;
  skill: number;
}

interface CrewWidgetProps {
  crew: CrewMember[];
  showDetails?: boolean;
}

/**
 * Crew status widget - shows crew health and morale
 */
export default function CrewWidget({ crew, showDetails = false }: CrewWidgetProps) {
  if (!showDetails || crew.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 w-72">
      <HudPanel corners glow="soft">
        <div className="text-holo-amber uppercase tracking-widest text-xs mb-3">
          Crew Status
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {crew.map(member => (
            <div key={member.id} className="bg-void-surface/50 p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-holo-amber">{member.name}</div>
                <div className="text-xs text-holo-amber-faint uppercase">
                  {member.role}
                </div>
              </div>

              <div className="space-y-1">
                {/* Health */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-holo-amber-faint w-12">HP</span>
                  <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        member.health > 60 ? 'bg-holo-green' :
                        member.health > 30 ? 'bg-holo-amber' : 'bg-holo-red'
                      }`}
                      style={{ width: `${member.health}%` }}
                    />
                  </div>
                  <span className="text-xs text-holo-amber-dim w-8 text-right">
                    {member.health}%
                  </span>
                </div>

                {/* Morale */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-holo-amber-faint w-12">Morale</span>
                  <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        member.morale > 60 ? 'bg-holo-green' :
                        member.morale > 30 ? 'bg-holo-amber' : 'bg-holo-red'
                      }`}
                      style={{ width: `${member.morale}%` }}
                    />
                  </div>
                  <span className="text-xs text-holo-amber-dim w-8 text-right">
                    {member.morale}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </HudPanel>
    </div>
  );
}
