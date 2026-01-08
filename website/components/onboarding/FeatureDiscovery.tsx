"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface FeatureTip {
  id: string;
  title: string;
  description: string;
  feature: string;
  action?: {
    label: string;
    path: string;
  };
}

export default function FeatureDiscovery() {
  const [currentTip, setCurrentTip] = useState<FeatureTip | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user has seen tips
    const dismissed = localStorage.getItem('beast-mode-dismissed-tips');
    if (dismissed) {
      setDismissedTips(new Set(JSON.parse(dismissed)));
    }

    // Show tip based on current page/feature
    const path = window.location.pathname;
    const tip = getTipForPath(path);
    
    if (tip && !dismissedTips.has(tip.id)) {
      setCurrentTip(tip);
    }
  }, []);

  function getTipForPath(path: string): FeatureTip | null {
    const tips: Record<string, FeatureTip> = {
      '/quality': {
        id: 'quality-tips',
        title: 'Quality Analysis Tips',
        description: 'Use the "Scan Now" button to analyze your code. Compare scans over time to track improvements.',
        feature: 'quality',
        action: {
          label: 'Scan Repository',
          path: '/quality'
        }
      },
      '/dashboard': {
        id: 'intelligence-tips',
        title: 'AI Intelligence',
        description: 'Ask questions about your codebase. Try: "What are the biggest quality issues?" or "Suggest improvements for my code."',
        feature: 'intelligence'
      },
      '/marketplace': {
        id: 'marketplace-tips',
        title: 'Model Marketplace',
        description: 'Browse and download AI models shared by the community. Share your own models to help others.',
        feature: 'marketplace'
      },
      '/integrations': {
        id: 'integrations-tips',
        title: 'Integrations',
        description: 'Connect GitHub Actions, Slack, Jira, and more to integrate BEAST MODE into your workflow.',
        feature: 'integrations'
      }
    };

    return tips[path] || null;
  }

  function handleDismiss() {
    if (currentTip) {
      const newDismissed = new Set(dismissedTips);
      newDismissed.add(currentTip.id);
      setDismissedTips(newDismissed);
      localStorage.setItem('beast-mode-dismissed-tips', JSON.stringify(Array.from(newDismissed)));
      setCurrentTip(null);
    }
  }

  function handleAction() {
    if (currentTip?.action) {
      window.location.href = currentTip.action.path;
    }
    handleDismiss();
  }

  if (!currentTip) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="bg-slate-900/95 border-slate-800 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white text-lg">{currentTip.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 text-sm mb-4">{currentTip.description}</p>
          {currentTip.action && (
            <Button onClick={handleAction} size="sm" className="w-full">
              {currentTip.action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
