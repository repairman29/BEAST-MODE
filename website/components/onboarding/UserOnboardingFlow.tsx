"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  completed: boolean;
}

interface OnboardingFlowProps {
  userId?: string;
  onComplete?: () => void;
}

export default function UserOnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to BEAST MODE',
      description: 'Let\'s get you started',
      component: <WelcomeStep />,
      completed: false
    },
    {
      id: 'scan-repo',
      title: 'Scan Your First Repository',
      description: 'Connect and analyze your code',
      component: <ScanRepoStep />,
      completed: false
    },
    {
      id: 'explore-features',
      title: 'Explore Features',
      description: 'Discover what BEAST MODE can do',
      component: <ExploreFeaturesStep />,
      completed: false
    },
    {
      id: 'setup-integrations',
      title: 'Set Up Integrations',
      description: 'Connect your development tools',
      component: <SetupIntegrationsStep />,
      completed: false
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start using BEAST MODE',
      component: <CompleteStep onComplete={onComplete} />,
      completed: false
    }
  ]);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('beast-mode-onboarding-completed');
    if (completed === 'true' && onComplete) {
      onComplete();
    }
  }, [onComplete]);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkip() {
    handleComplete();
  }

  function handleComplete() {
    localStorage.setItem('beast-mode-onboarding-completed', 'true');
    if (onComplete) {
      onComplete();
    }
  }

  function markStepComplete(stepId: string) {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900/95 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-white text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                {steps[currentStep].description}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={handleSkip} className="text-slate-400">
              Skip
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 flex items-center ${
                  index < steps.length - 1 ? 'mr-2' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index < currentStep
                      ? 'bg-green-600 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-green-600' : 'bg-slate-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="mt-6">
          {steps[currentStep].component}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-white text-xl font-semibold mb-2">
          Welcome to BEAST MODE
        </h3>
        <p className="text-slate-400">
          Your AI-powered code quality and development intelligence platform
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-slate-800 rounded border border-slate-700">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-white font-semibold">Fast Analysis</div>
          <div className="text-slate-400 text-sm">Get quality insights in seconds</div>
        </div>
        <div className="p-4 bg-slate-800 rounded border border-slate-700">
          <div className="text-2xl mb-2">🧠</div>
          <div className="text-white font-semibold">AI-Powered</div>
          <div className="text-slate-400 text-sm">Intelligent code suggestions</div>
        </div>
        <div className="p-4 bg-slate-800 rounded border border-slate-700">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-white font-semibold">Actionable Insights</div>
          <div className="text-slate-400 text-sm">Real improvements you can make</div>
        </div>
      </div>
    </div>
  );
}

function ScanRepoStep() {
  const [repo, setRepo] = useState('');
  const [scanning, setScanning] = useState(false);

  async function handleScan() {
    if (!repo) return;
    
    setScanning(true);
    try {
      // Trigger scan
      const response = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo })
      });
      
      if (response.ok) {
        // Success - mark step complete
        setTimeout(() => setScanning(false), 2000);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      setScanning(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-300">
        Connect your GitHub repository to get started with code quality analysis.
      </p>
      
      <div className="space-y-2">
        <label className="text-white text-sm font-semibold">
          Repository (owner/repo)
        </label>
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="facebook/react"
          className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
        />
        <p className="text-slate-400 text-xs">
          Example: facebook/react, vercel/next.js
        </p>
      </div>
      
      <Button
        onClick={handleScan}
        disabled={!repo || scanning}
        className="w-full"
      >
        {scanning ? 'Scanning...' : 'Scan Repository'}
      </Button>
    </div>
  );
}

function ExploreFeaturesStep() {
  const features = [
    { name: 'Quality Analysis', icon: '⚡', path: '/quality' },
    { name: 'AI Intelligence', icon: '🧠', path: '/dashboard' },
    { name: 'Marketplace', icon: '📦', path: '/marketplace' },
    { name: 'Integrations', icon: '🔌', path: '/integrations' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-300">
        Discover the powerful features BEAST MODE offers:
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {features.map(feature => (
          <a
            key={feature.name}
            href={feature.path}
            className="p-4 bg-slate-800 rounded border border-slate-700 hover:border-blue-600 transition-colors"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <div className="text-white font-semibold">{feature.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SetupIntegrationsStep() {
  const integrations = [
    { name: 'GitHub Actions', icon: '⚙️', status: 'available' },
    { name: 'Slack', icon: '💬', status: 'available' },
    { name: 'Jira', icon: '🎯', status: 'available' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-300">
        Connect your favorite development tools for seamless workflows:
      </p>
      
      <div className="space-y-2">
        {integrations.map(integration => (
          <div
            key={integration.name}
            className="p-4 bg-slate-800 rounded border border-slate-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <div className="text-white font-semibold">{integration.name}</div>
                <Badge className="bg-green-600 text-white text-xs">
                  {integration.status}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline">Connect</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompleteStep({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-white text-2xl font-semibold mb-2">
        You're All Set!
      </h3>
      <p className="text-slate-400 mb-6">
        You're ready to start using BEAST MODE. Explore the dashboard and discover all the features.
      </p>
      
      <div className="flex gap-4 justify-center">
        <Button onClick={onComplete} className="px-8">
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={onComplete}>
          Explore Features
        </Button>
      </div>
    </div>
  );
}
