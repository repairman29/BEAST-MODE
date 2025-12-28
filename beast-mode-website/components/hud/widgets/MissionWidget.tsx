"use client";

import React from 'react';
import HudPanel from '../HudPanel';
import HudButton from '../HudButton';
import { useWidget, WIDGET_CONFIGS } from '../HudController';

interface Mission {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  reward: number;
  progress: number;
  deadline?: string;
}

interface MissionWidgetProps {
  missions: Mission[];
  onAccept?: (id: number) => void;
  onAbandon?: (id: number) => void;
}

/**
 * Mission tracking widget - shows when missions are active
 */
export default function MissionWidget({ missions, onAccept, onAbandon }: MissionWidgetProps) {
  const isVisible = useWidget(WIDGET_CONFIGS.MISSION_BRIEF);

  if (!isVisible || missions.length === 0) return null;

  return (
    <div className="fixed top-20 left-4 z-40 w-80">
      <HudPanel corners glow="soft">
        <div className="flex items-center justify-between mb-3">
          <div className="text-holo-amber uppercase tracking-widest text-xs">
            Active Missions
          </div>
          <div className="text-holo-amber-faint text-xs">
            {missions.length}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {missions.map(mission => (
            <div key={mission.id} className="bg-void-surface/50 p-2 space-y-1">
              <div className="flex items-start justify-between">
                <div className="text-sm text-holo-amber">{mission.title}</div>
                <DifficultyBadge difficulty={mission.difficulty} />
              </div>

              <div className="text-xs text-holo-amber-faint">
                {mission.type} • ₡{mission.reward}
              </div>

              {mission.deadline && (
                <div className="text-xs text-holo-red">
                  ⏰ {mission.deadline}
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1 bg-void rounded-full overflow-hidden">
                <div
                  className="h-full bg-holo-amber transition-all duration-300"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <HudButton
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => onAbandon?.(mission.id)}
                >
                  Abandon
                </HudButton>
              </div>
            </div>
          ))}
        </div>
      </HudPanel>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = {
    'Low': 'text-holo-green',
    'Medium': 'text-holo-amber',
    'High': 'text-holo-red',
    'Extreme': 'text-holo-purple'
  }[difficulty] || 'text-holo-amber';

  return (
    <span className={`text-xs ${color} uppercase tracking-wider`}>
      {difficulty}
    </span>
  );
}
