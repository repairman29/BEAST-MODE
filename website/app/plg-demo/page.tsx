'use client';

import { QualityWidget } from '@/components/plg/QualityWidget';
import { FeedbackButton } from '@/components/plg/FeedbackButton';
import { RecommendationCards } from '@/components/plg/RecommendationCards';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * PLG Demo Page
 * 
 * Shows how to use pre-built components for fast delivery
 * Time to value: < 5 minutes
 */

export default function PLGDemoPage() {
  const [repo, setRepo] = useState('facebook/react');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = [
    {
      id: 'quality-widget',
      name: 'Quality Widget',
      description: 'Full quality display in one component',
      timeToIntegrate: '2 minutes',
      category: 'display'
    },
    {
      id: 'quality-badge',
      name: 'Quality Badge',
      description: 'Compact quality indicator',
      timeToIntegrate: '1 minute',
      category: 'badge'
    },
    {
      id: 'feedback-button',
      name: 'Feedback Button',
      description: 'Collect user feedback',
      timeToIntegrate: '1 minute',
      category: 'interaction'
    },
    {
      id: 'recommendation-cards',
      name: 'Recommendation Cards',
      description: 'Actionable improvement suggestions',
      timeToIntegrate: '2 minutes',
      category: 'display'
    }
  ];

  const codeExamples = {
    'quality-widget': {
      react: `import { QualityWidget } from '@beast-mode/plg-components';

function MyComponent() {
  return (
    <QualityWidget 
      repo="owner/repo" 
      platform="beast-mode"
    />
  );
}`,
      vue: `<template>
  <QualityWidget 
    repo="owner/repo" 
    platform="beast-mode"
  />
</template>

<script setup>
import { QualityWidget } from '@beast-mode/plg-components';
</script>`,
      html: `<div id="quality-widget"></div>
<script src="https://cdn.beast-mode.com/plg-components.js"></script>
<script>
  BeastMode.renderQualityWidget('quality-widget', {
    repo: 'owner/repo',
    platform: 'beast-mode'
  });
</script>`
    },
    'quality-badge': {
      react: `import { QualityBadge } from '@beast-mode/plg-components';

function MyComponent() {
  return (
    <QualityBadge 
      repo="owner/repo"
      size="md"
    />
  );
}`,
      vue: `<template>
  <QualityBadge 
    repo="owner/repo"
    size="md"
  />
</template>

<script setup>
import { QualityBadge } from '@beast-mode/plg-components';
</script>`,
      html: `<div id="quality-badge"></div>
<script src="https://cdn.beast-mode.com/plg-components.js"></script>
<script>
  BeastMode.renderQualityBadge('quality-badge', {
    repo: 'owner/repo',
    size: 'md'
  });
</script>`
    },
    'feedback-button': {
      react: `import { FeedbackButton } from '@beast-mode/plg-components';

function MyComponent({ predictionId }) {
  return (
    <FeedbackButton
      predictionId={predictionId}
      predictedValue={0.85}
      serviceName="quality"
    />
  );
}`,
      vue: `<template>
  <FeedbackButton
    :prediction-id="predictionId"
    :predicted-value="0.85"
    service-name="quality"
  />
</template>

<script setup>
import { FeedbackButton } from '@beast-mode/plg-components';
</script>`,
      html: `<div id="feedback-button"></div>
<script src="https://cdn.beast-mode.com/plg-components.js"></script>
<script>
  BeastMode.renderFeedbackButton('feedback-button', {
    predictionId: 'prediction-id',
    predictedValue: 0.85,
    serviceName: 'quality'
  });
</script>`
    },
    'recommendation-cards': {
      react: `import { RecommendationCards } from '@beast-mode/plg-components';

function MyComponent() {
  return (
    <RecommendationCards 
      repo="owner/repo"
      limit={5}
    />
  );
}`,
      vue: `<template>
  <RecommendationCards 
    repo="owner/repo"
    :limit="5"
  />
</template>

<script setup>
import { RecommendationCards } from '@beast-mode/plg-components';
</script>`,
      html: `<div id="recommendation-cards"></div>
<script src="https://cdn.beast-mode.com/plg-components.js"></script>
<script>
  BeastMode.renderRecommendationCards('recommendation-cards', {
    repo: 'owner/repo',
    limit: 5
  });
</script>`
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">PLG Fast Delivery Demo</h1>
          <p className="text-slate-400 mb-4">
            Pre-built components using BEAST MODE APIs - Build features in hours, not weeks
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              ⚡ < 5 min integration
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              📦 Copy-paste ready
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
              🎨 Fully styled
            </Badge>
          </div>
        </div>

        {/* Repository Input */}
        <Card className="bg-slate-900/90 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Test Repository</CardTitle>
            <CardDescription>Enter a repository to see components in action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                placeholder="owner/repo"
              />
              <Button
                onClick={() => setPredictionId(null)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {components.map((component) => (
            <Card
              key={component.id}
              className={`bg-slate-900/90 border-slate-800 cursor-pointer transition-all ${
                selectedComponent === component.id ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'hover:border-cyan-500/50'
              }`}
              onClick={() => setSelectedComponent(selectedComponent === component.id ? null : component.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{component.name}</CardTitle>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                    {component.timeToIntegrate}
                  </Badge>
                </div>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {component.id === 'quality-widget' && (
                  <QualityWidget repo={repo} />
                )}
                {component.id === 'quality-badge' && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-lg px-3 py-1">
                      Quality: 85%
                    </Badge>
                    <span className="text-sm text-slate-400">(Badge component)</span>
                  </div>
                )}
                {component.id === 'feedback-button' && (
                  <div className="flex items-center gap-2">
                    <FeedbackButton
                      predictionId={predictionId || 'demo-id'}
                      predictedValue={0.85}
                      serviceName="quality"
                    />
                    <span className="text-sm text-slate-400">(Feedback component)</span>
                  </div>
                )}
                {component.id === 'recommendation-cards' && (
                  <RecommendationCards repo={repo} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Code Examples */}
        {selectedComponent && (
          <Card className="bg-slate-900/90 border-slate-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Code Examples - {components.find(c => c.id === selectedComponent)?.name}</CardTitle>
              <CardDescription>Copy-paste ready code for your framework</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(codeExamples[selectedComponent as keyof typeof codeExamples] || {}).map(([framework, code]) => (
                  <div key={framework}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white capitalize">{framework}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          alert('Code copied to clipboard!');
                        }}
                        className="text-xs"
                      >
                        📋 Copy
                      </Button>
                    </div>
                    <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
                      <code className="text-slate-300">{code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integration Guide */}
        <Card className="bg-cyan-900/20 border-cyan-500/50">
          <CardHeader>
            <CardTitle className="text-white">🚀 Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Install Package</h3>
                <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300">npm install @beast-mode/plg-components</code>
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Import Component</h3>
                <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300">{`import { QualityWidget } from '@beast-mode/plg-components';`}</code>
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Use in Your App</h3>
                <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300">{`<QualityWidget repo="owner/repo" />`}</code>
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. That's It! 🎉</h3>
                <p className="text-slate-300">
                  Components automatically track usage, collect feedback, and improve over time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">
            Need more customization? Check out our API documentation
          </p>
          <Button
            onClick={() => window.open('/docs/api', '_blank')}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            📚 View API Docs
          </Button>
        </div>
      </div>
    </div>
  );
}
