'use client';

import { QualityWidget } from '@/components/plg/QualityWidget';
import { FeedbackButton } from '@/components/plg/FeedbackButton';
import { RecommendationCards } from '@/components/plg/RecommendationCards';
import { useState } from 'react';

/**
 * PLG Demo Page
 * 
 * Shows how to use pre-built components for fast delivery
 * Time to value: < 5 minutes
 */

export default function PLGDemoPage() {
  const [repo, setRepo] = useState('facebook/react');
  const [predictionId, setPredictionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">PLG Fast Delivery Demo</h1>
        <p className="text-slate-400 mb-8">
          Pre-built components using BEAST MODE APIs - Build features in hours, not weeks
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Repository:</label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            placeholder="owner/repo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quality Widget */}
          <div>
            <h2 className="text-xl font-semibold mb-4">1. Quality Widget</h2>
            <p className="text-sm text-slate-400 mb-4">
              Full quality display in one component. Time to integrate: 2 minutes.
            </p>
            <QualityWidget repo={repo} />
          </div>

          {/* Quality Badge */}
          <div>
            <h2 className="text-xl font-semibold mb-4">2. Quality Badge</h2>
            <p className="text-sm text-slate-400 mb-4">
              SVG badge - embed anywhere. Time to embed: 30 seconds.
            </p>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <img 
                src={`/api/badge?repo=${encodeURIComponent(repo)}`} 
                alt="Quality Badge"
                className="mb-4"
              />
              <code className="text-xs text-slate-400 block">
                {`<img src="/api/badge?repo=${repo}" />`}
              </code>
            </div>
          </div>
        </div>

        {/* Recommendation Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Recommendation Cards</h2>
          <p className="text-sm text-slate-400 mb-4">
            Actionable insights, prioritized. Time to add: 3 minutes.
          </p>
          <RecommendationCards repo={repo} limit={5} />
        </div>

        {/* Feedback Button */}
        {predictionId && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Feedback Button</h2>
            <p className="text-sm text-slate-400 mb-4">
              One-click feedback. Time to add: 1 minute.
            </p>
            <FeedbackButton 
              predictionId={predictionId}
              predictedValue={0.8}
            />
          </div>
        )}

        {/* Code Examples */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">💡 How to Use</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Quality Widget:</p>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`import { QualityWidget } from '@/components/plg/QualityWidget';

<QualityWidget repo="owner/repo" />`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Quality Badge:</p>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`<img src="/api/badge?repo=owner/repo" />`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Recommendation Cards:</p>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`import { RecommendationCards } from '@/components/plg/RecommendationCards';

<RecommendationCards repo="owner/repo" limit={5} />`}
              </pre>
            </div>
          </div>
        </div>

        {/* PLG Principles */}
        <div className="mt-8 bg-cyan-900/20 rounded-lg p-6 border border-cyan-500/50">
          <h2 className="text-xl font-semibold mb-4">🚀 PLG Principles Applied</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Time to Value:</strong> < 5 minutes (not days)</li>
            <li>✅ <strong>Self-Service:</strong> No setup, works out of the box</li>
            <li>✅ <strong>Product-Led:</strong> Components teach API usage</li>
            <li>✅ <strong>Viral:</strong> Badges/widgets spread organically</li>
            <li>✅ <strong>Usage-Based Value:</strong> More usage = better model</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
