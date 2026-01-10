'use client';

import { useEffect, useState } from 'react';
import { getPLGTracker } from '@/lib/plg-tracker';

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
    // Track component usage
    if (typeof window !== 'undefined') {
      const tracker = getPLGTracker();
      tracker.trackUsage('QualityWidget', 'widget', { repo });
    }
    
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
      <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">Loading quality score...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const quality = Math.round(data.quality * 100);
  const confidence = Math.round(data.confidence * 100);

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Quality Score</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          quality >= 80 ? 'bg-green-500/20 text-green-400' :
          quality >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
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
