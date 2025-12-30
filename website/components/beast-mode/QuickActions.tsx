"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: 'cyan' | 'purple' | 'green' | 'amber';
}

interface QuickActionsProps {
  onScanRepo: () => void;
  onSignIn: () => void;
  onPricing: () => void;
  onImprove: () => void;
}

export default function QuickActions({ onScanRepo, onSignIn, onPricing, onImprove }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: 'Scan GitHub Repo',
      description: 'Analyze any repository for code quality',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      onClick: onScanRepo,
      color: 'cyan'
    },
    {
      title: 'Sign In / Sign Up',
      description: 'Create an account to save your scans',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: onSignIn,
      color: 'purple'
    },
    {
      title: 'View Pricing',
      description: 'Upgrade to unlock more features',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: onPricing,
      color: 'green'
    },
    {
      title: 'Self-Improve',
      description: 'Analyze and improve this website',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: onImprove,
      color: 'amber'
    }
  ];

  const colorClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`p-4 rounded-lg border transition-all hover:scale-105 ${colorClasses[action.color]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{action.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold mb-1">{action.title}</div>
                  <div className="text-sm opacity-80">{action.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

