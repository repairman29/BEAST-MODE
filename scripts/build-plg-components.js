#!/usr/bin/env node
/**
 * Build PLG Components Using BEAST MODE APIs
 * 
 * Creates pre-built components that deliver instant value:
 * - Quality Badge (SVG)
 * - Quality Widget (React)
 * - Feedback Button (React)
 * - Trends Chart (React)
 * - Recommendation Cards (React)
 */

const fs = require('fs').promises;
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../website/components/plg');
const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

async function createQualityBadgeAPI() {
  const badgeAPI = `import { NextRequest, NextResponse } from 'next/server';

/**
 * Quality Badge API
 * 
 * Generates SVG badge showing repository quality score
 * PLG: Instant value, viral, embeddable
 * 
 * Usage: <img src="https://beast-mode.com/api/badge?repo=owner/repo" />
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get('repo');
  const style = searchParams.get('style') || 'flat'; // flat, plastic, flat-square
  
  if (!repo) {
    return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
  }
  
  try {
    // Get quality score
    const qualityResponse = await fetch(\`\${process.env.BEAST_MODE_API || 'http://localhost:3000'}/api/repos/quality\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, platform: 'badge' })
    });
    
    if (!qualityResponse.ok) {
      throw new Error('Quality API failed');
    }
    
    const qualityData = await qualityResponse.json();
    const quality = Math.round(qualityData.quality * 100);
    const confidence = Math.round(qualityData.confidence * 100);
    
    // Determine color based on quality
    let color = '#e05d44'; // red
    if (quality >= 80) color = '#4c1'; // green
    else if (quality >= 60) color = '#dfb317'; // yellow
    else if (quality >= 40) color = '#fe7d37'; // orange
    
    // Generate SVG badge
    const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="150" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h63v20H0z"/>
    <path fill="\${color}" d="M63 0h87v20H63z"/>
    <path fill="url(#b)" d="M0 0h150v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="31.5" y="15" fill="#010101" fill-opacity=".3">quality</text>
    <text x="31.5" y="14">quality</text>
    <text x="106.5" y="15" fill="#010101" fill-opacity=".3">\${quality}%</text>
    <text x="106.5" y="14">\${quality}%</text>
  </g>
</svg>\`;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    // Return error badge
    const errorSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <rect width="120" height="20" fill="#e05d44" rx="3"/>
  <text x="60" y="14" fill="#fff" text-anchor="middle" font-family="DejaVu Sans" font-size="11">error</text>
</svg>\`;
    
    return new NextResponse(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}
`;

  const apiPath = path.join(__dirname, '../website/app/api/badge/route.ts');
  await fs.mkdir(path.dirname(apiPath), { recursive: true });
  await fs.writeFile(apiPath, badgeAPI);
  console.log('✅ Created Quality Badge API: /api/badge');
}

async function createQualityWidget() {
  const widget = `'use client';

import { useEffect, useState } from 'react';

/**
 * Quality Widget Component
 * 
 * PLG: Instant value, embeddable, self-service
 * Uses: /api/repos/quality
 */

interface QualityWidgetProps {
  repo: string;
  platform?: 'beast-mode' | 'echeo';
  className?: string;
}

export function QualityWidget({ repo, platform = 'beast-mode', className = '' }: QualityWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuality() {
      try {
        const response = await fetch('/api/repos/quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, platform })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quality');
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuality();
  }, [repo, platform]);

  if (loading) {
    return (
      <div className={\`bg-slate-800 rounded-lg p-4 \${className}\`}>
        <div className="animate-pulse">Loading quality score...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={\`bg-red-900/20 border border-red-500 rounded-lg p-4 \${className}\`}>
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const quality = Math.round(data.quality * 100);
  const confidence = Math.round(data.confidence * 100);

  return (
    <div className={\`bg-slate-800 rounded-lg p-6 border border-slate-700 \${className}\`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Quality Score</h3>
        <span className={\`px-3 py-1 rounded-full text-sm font-medium \${
          quality >= 80 ? 'bg-green-500/20 text-green-400' :
          quality >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }\`}>
          {quality}%
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Confidence</span>
          <span className="text-slate-300">{confidence}%</span>
        </div>
        {data.percentile && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Percentile</span>
            <span className="text-slate-300">{Math.round(data.percentile)}th</span>
          </div>
        )}
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Top Recommendations:</p>
          <ul className="space-y-1">
            {data.recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <li key={idx} className="text-sm text-slate-300">
                • {rec.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
`;

  const widgetPath = path.join(COMPONENTS_DIR, 'QualityWidget.tsx');
  await fs.mkdir(COMPONENTS_DIR, { recursive: true });
  await fs.writeFile(widgetPath, widget);
  console.log('✅ Created Quality Widget component');
}

async function createFeedbackButton() {
  const button = `'use client';

import { useState } from 'react';

/**
 * Feedback Button Component
 * 
 * PLG: One-click feedback, improves model, user feels heard
 * Uses: /api/feedback/submit
 */

interface FeedbackButtonProps {
  predictionId: string;
  predictedValue: number;
  serviceName?: string;
  compact?: boolean;
}

export function FeedbackButton({ 
  predictionId, 
  predictedValue, 
  serviceName = 'beast-mode',
  compact = false 
}: FeedbackButtonProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitFeedback(isHelpful: boolean) {
    setLoading(true);
    try {
      const actualValue = isHelpful ? predictedValue : (predictedValue * 0.5);
      
      await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          actualValue,
          context: {
            serviceName,
            source: 'feedback-button',
            isHelpful
          }
        })
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-sm text-green-400">
        ✅ Thanks for your feedback!
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => submitFeedback(true)}
          disabled={loading}
          className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
        >
          👍 Helpful
        </button>
        <button
          onClick={() => submitFeedback(false)}
          disabled={loading}
          className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
        >
          👎 Not helpful
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p className="text-sm text-slate-300 mb-3">Was this helpful?</p>
      <div className="flex gap-3">
        <button
          onClick={() => submitFeedback(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 transition-colors"
        >
          👍 Yes, helpful
        </button>
        <button
          onClick={() => submitFeedback(false)}
          disabled={loading}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50 transition-colors"
        >
          👎 Not helpful
        </button>
      </div>
    </div>
  );
}
`;

  const buttonPath = path.join(COMPONENTS_DIR, 'FeedbackButton.tsx');
  await fs.writeFile(buttonPath, button);
  console.log('✅ Created Feedback Button component');
}

async function createRecommendationCards() {
  const cards = `'use client';

import { useEffect, useState } from 'react';

/**
 * Recommendation Cards Component
 * 
 * PLG: Actionable insights, prioritized, categorized
 * Uses: /api/repos/quality (recommendations)
 */

interface RecommendationCardsProps {
  repo: string;
  platform?: 'beast-mode' | 'echeo';
  limit?: number;
}

export function RecommendationCards({ repo, platform = 'beast-mode', limit = 5 }: RecommendationCardsProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/repos/quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, platform })
        });

        if (!response.ok) return;

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [repo, platform]);

  if (loading) {
    return <div className="animate-pulse">Loading recommendations...</div>;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {recommendations.slice(0, limit).map((rec, idx) => (
        <div
          key={idx}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-slate-200">{rec.action}</h4>
            {rec.categorization && (
              <span className={\`px-2 py-1 text-xs rounded \${
                rec.categorization.type === 'quick-win' ? 'bg-green-500/20 text-green-400' :
                rec.categorization.type === 'high-impact' ? 'bg-blue-500/20 text-blue-400' :
                'bg-purple-500/20 text-purple-400'
              }\`}>
                {rec.categorization.type}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-400 mb-3">{rec.insight}</p>
          
          {rec.actionable && (
            <div className="text-sm text-slate-300 bg-slate-900/50 rounded p-2">
              <p className="font-medium mb-1">Actionable Steps:</p>
              <p>{rec.actionable}</p>
            </div>
          )}

          {rec.categorization && (
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>ROI: {rec.categorization.roi}</span>
              <span>Effort: {rec.categorization.effort}</span>
              {rec.categorization.estimatedHours && (
                <span>Time: {rec.categorization.estimatedHours}h</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
`;

  const cardsPath = path.join(COMPONENTS_DIR, 'RecommendationCards.tsx');
  await fs.writeFile(cardsPath, cards);
  console.log('✅ Created Recommendation Cards component');
}

async function main() {
  console.log('🚀 Building PLG Components Using BEAST MODE APIs\n');
  console.log('='.repeat(70));
  console.log();

  await createQualityBadgeAPI();
  await createQualityWidget();
  await createFeedbackButton();
  await createRecommendationCards();

  console.log();
  console.log('='.repeat(70));
  console.log('✅ PLG Components Created!');
  console.log('='.repeat(70));
  console.log();
  console.log('📦 Components:');
  console.log('   1. Quality Badge API - /api/badge');
  console.log('   2. Quality Widget - components/plg/QualityWidget.tsx');
  console.log('   3. Feedback Button - components/plg/FeedbackButton.tsx');
  console.log('   4. Recommendation Cards - components/plg/RecommendationCards.tsx');
  console.log();
  console.log('💡 Usage:');
  console.log('   - Badge: <img src="/api/badge?repo=owner/repo" />');
  console.log('   - Widget: <QualityWidget repo="owner/repo" />');
  console.log('   - Feedback: <FeedbackButton predictionId="..." predictedValue={0.8} />');
  console.log('   - Recommendations: <RecommendationCards repo="owner/repo" />');
  console.log();
  console.log('🚀 These components deliver instant value using existing APIs!');
  console.log();
}

main().catch(console.error);
