'use client';

import { useEffect, useState } from 'react';
import { usePLGTracking } from '@/lib/plg-tracker';

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
    // Track component usage
    usePLGTracking('RecommendationCards', 'cards', { repo });
    
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
              <span className={`px-2 py-1 text-xs rounded ${
                rec.categorization.type === 'quick-win' ? 'bg-green-500/20 text-green-400' :
                rec.categorization.type === 'high-impact' ? 'bg-blue-500/20 text-blue-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
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
