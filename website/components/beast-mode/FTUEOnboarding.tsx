"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface FTUEOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function FTUEOnboarding({ onComplete, onSkip }: FTUEOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to BEAST MODE",
      description: "Your AI-powered code quality platform",
      content: (
        <div className="space-y-4">
          <div className="text-6xl text-center mb-4">⚔️</div>
          <p className="text-slate-400 text-center">
            BEAST MODE helps you ship better code, faster. Let's get you started with a quick tour.
          </p>
        </div>
      )
    },
    {
      title: "Scan Your First Repository",
      description: "Analyze code quality instantly",
      content: (
        <div className="space-y-4">
          <div className="text-4xl text-center mb-4">🔍</div>
          <p className="text-slate-400">
            Use <strong className="text-white">Scan Repo</strong> in the sidebar to analyze any GitHub repository. 
            Get instant quality scores, issue detection, and improvement suggestions.
          </p>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <code className="text-sm text-cyan-400">github.com/owner/repo</code>
          </div>
        </div>
      )
    },
    {
      title: "Explore Quality Metrics",
      description: "Track your code health",
      content: (
        <div className="space-y-4">
          <div className="text-4xl text-center mb-4">⚡</div>
          <p className="text-slate-400">
            The <strong className="text-white">Quality</strong> view shows your code quality score, 
            issues found, and improvement opportunities. Monitor your progress over time.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-2xl font-bold text-cyan-400">87</div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-xs text-slate-500">Issues</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-2xl font-bold text-green-400">8</div>
              <div className="text-xs text-slate-500">Improvements</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Keyboard Shortcuts",
      description: "Work faster with shortcuts",
      content: (
        <div className="space-y-4">
          <div className="text-4xl text-center mb-4">⌘</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="text-slate-300">Toggle Sidebar</span>
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">⌘B</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="text-slate-300">Command Palette</span>
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">⌘K</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="text-slate-300">Quick Navigation</span>
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">1-9</kbd>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      description: "Start improving your code quality",
      content: (
        <div className="space-y-4">
          <div className="text-6xl text-center mb-4">🚀</div>
          <p className="text-slate-400 text-center">
            You're ready to use BEAST MODE! Start by scanning a repository or exploring the dashboard.
          </p>
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 rounded-lg border border-cyan-500/20">
            <p className="text-sm text-cyan-400 text-center">
              💡 Tip: Sign in to save your scans and access advanced features
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl mb-2">{currentStepData.title}</CardTitle>
              <p className="text-slate-400 text-sm">{currentStepData.description}</p>
            </div>
            <button
              onClick={onSkip}
              className="text-slate-500 hover:text-white transition-colors text-sm"
            >
              Skip Tour
            </button>
          </div>
          {/* Progress indicator */}
          <div className="mt-4 flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col">
            <div className="flex-1">{currentStepData.content}</div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  }
                }}
                disabled={currentStep === 0}
                className="border-slate-800 text-slate-400 hover:bg-slate-900"
              >
                Previous
              </Button>
              <div className="text-xs text-slate-500">
                Step {currentStep + 1} of {steps.length}
              </div>
              <Button
                variant="default"
                onClick={() => {
                  if (isLastStep) {
                    onComplete();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="bg-white text-black hover:bg-slate-100"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

