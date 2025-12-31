'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Rocket, CheckCircle2 } from 'lucide-react';

interface OnboardingWelcomeProps {
  onDismiss?: () => void;
}

export default function OnboardingWelcome({ onDismiss }: OnboardingWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('beast-mode-onboarding-seen');
    if (hasSeenOnboarding === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('beast-mode-onboarding-seen', 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  const steps = [
    {
      title: 'Welcome to BEAST MODE! 🎸',
      description: 'You\'re about to experience the BEAST MODE VIBE.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            BEAST MODE is built for <strong className="text-cyan-400">vibe coders</strong> like you - developers who code with passion, build with purpose, and ship with style. We're here to help you write better code, learn faster, and have more fun.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">9</div>
              <div className="text-sm text-slate-400">AI Systems</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-sm text-slate-400">Test Coverage</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Your First Quality Check',
      description: 'Let\'s see how your code is doing.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Run your first quality check to see your current score and identify areas for improvement.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <code className="text-cyan-400 text-sm">beast-mode quality check</code>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-400">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400" />
            <span>Don't worry if your score is low - that's why BEAST MODE exists!</span>
          </div>
        </div>
      )
    },
    {
      title: 'Explore the Dashboard',
      description: 'Everything you need is right here.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            This dashboard has 5 main tabs. Each one helps you in different ways:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-slate-300"><strong>Quality:</strong> See your code quality score and issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300"><strong>Intelligence:</strong> AI recommendations and missions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-300"><strong>Marketplace:</strong> Browse and install plugins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-slate-300"><strong>Improve:</strong> Auto-fix and code enhancement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <span className="text-slate-300"><strong>Settings:</strong> Configure your workspace</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Get Help Anytime',
      description: 'We\'ve got your back.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            New to BEAST MODE? Start simple with 3 easy steps:
          </p>
          <div className="space-y-2">
            <a
              href="https://beastmode.dev/docs/3_EASY_STEPS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/30 transition-colors text-cyan-400 font-semibold"
            >
              <Rocket className="w-4 h-4" />
              <span className="text-sm">3 Easy Steps (Start Here!)</span>
            </a>
            <a
              href="https://beastmode.dev/docs/QUICK_START"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <span className="text-sm">Quick Start Guide (5 minutes)</span>
            </a>
            <a
              href="https://beastmode.dev/docs/FTUE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 text-xs"
            >
              <BookOpen className="w-3 h-3" />
              <span className="text-xs">Complete Guide (100 steps - when ready)</span>
            </a>
          </div>
        </div>
      )
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl animate-in slide-up">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-2xl text-white pr-8">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[currentStep].content}
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-cyan-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleDismiss}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Get Started! 🚀
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

