"use client";

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  onClick: () => void;
  color: string;
}

interface JanitorQuickActionsProps {
  onManualRefactor: () => void;
  onCreateTest: () => void;
  onViewHistory: () => void;
  onViewRules: () => void;
}

export default function JanitorQuickActions({
  onManualRefactor,
  onCreateTest,
  onViewHistory,
  onViewRules
}: JanitorQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'refactor',
      label: 'Run Refactor',
      icon: '🧹',
      description: 'Trigger manual refactoring now',
      onClick: onManualRefactor,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'test',
      label: 'Create Test',
      icon: '🤖',
      description: 'Create Vibe Ops test in plain English',
      onClick: onCreateTest,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'history',
      label: 'View History',
      icon: '📜',
      description: 'See past refactoring runs',
      onClick: onViewHistory,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'rules',
      label: 'View Rules',
      icon: '🛡️',
      description: 'Manage architecture rules',
      onClick: onViewRules,
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-white mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-all bg-gradient-to-br ${action.color} bg-opacity-10 hover:bg-opacity-20 group`}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="text-xs font-semibold text-white mb-1">
                {action.label}
              </div>
              <div className="text-xs text-slate-400 line-clamp-2">
                {action.description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

