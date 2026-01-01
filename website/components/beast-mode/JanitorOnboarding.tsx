"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  actionUrl?: string;
  completed: boolean;
}

export default function JanitorOnboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'enable',
      title: 'Enable Janitor',
      description: 'Turn on the AI Janitor to start maintaining your code automatically',
      action: 'Enable Janitor',
      actionUrl: '#enable'
    },
    {
      id: 'configure',
      title: 'Configure Silent Refactoring',
      description: 'Set up overnight refactoring schedule (2 AM - 6 AM)',
      action: 'Configure',
      actionUrl: '#configure'
    },
    {
      id: 'test',
      title: 'Create Your First Test',
      description: 'Try Vibe Ops - create a test in plain English',
      action: 'Create Test',
      actionUrl: '#test'
    },
    {
      id: 'review',
      title: 'Review Architecture Rules',
      description: 'Check which rules are active and customize them',
      action: 'View Rules',
      actionUrl: '#rules'
    }
  ];

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(new Set(completedSteps).add(stepId));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-white">Welcome to Day 2 Operations</CardTitle>
        <CardDescription className="text-slate-400">
          Let's get you set up in 4 quick steps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
              {currentStep + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-slate-400 text-sm">
                {currentStepData.description}
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleStepComplete(currentStepData.id)}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"
          >
            {currentStepData.action}
          </Button>
        </div>

        {/* All Steps */}
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                idx === currentStep
                  ? 'bg-cyan-500/20 border border-cyan-500/30'
                  : completedSteps.has(step.id)
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-slate-800/30 border border-slate-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                completedSteps.has(step.id)
                  ? 'bg-green-500 text-white'
                  : idx === currentStep
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {completedSteps.has(step.id) ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${
                  completedSteps.has(step.id) ? 'text-green-400' : idx === currentStep ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skip Button */}
        <div className="text-center">
          <button
            onClick={onComplete}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip onboarding
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

