'use client';

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
