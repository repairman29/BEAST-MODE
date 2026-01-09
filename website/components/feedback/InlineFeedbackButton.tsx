'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';

interface InlineFeedbackButtonProps {
  predictionId?: string;
  predictedValue?: number;
  serviceName?: string;
  compact?: boolean;
  onFeedbackSubmitted?: () => void;
}

/**
 * Inline Feedback Button Component
 * 
 * One-click feedback collection for quality predictions
 * Designed to be frictionless and encourage feedback
 */
export default function InlineFeedbackButton({
  predictionId,
  predictedValue,
  serviceName = 'quality',
  compact = false,
  onFeedbackSubmitted
}: InlineFeedbackButtonProps) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'not-helpful' | null>(null);

  const handleFeedback = async (helpful: boolean) => {
    if (!predictionId || feedbackState !== 'idle') return;

    setFeedbackType(helpful ? 'helpful' : 'not-helpful');
    setFeedbackState('submitting');

    try {
      const response = await fetch('/api/feedback/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          serviceName,
          feedbackType: 'user',
          feedbackScore: helpful ? 1 : 0,
          predictedValue,
          metadata: {
            source: 'inline-button',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setFeedbackState('submitted');
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
        
        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: '✅ Thank you! Your feedback helps improve predictions.'
            }
          }));
        }
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setFeedbackState('idle');
      setFeedbackType(null);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: 'Failed to submit feedback. Please try again.'
          }
        }));
      }
    }
  };

  if (feedbackState === 'submitted') {
    return (
      <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-green-400`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Thanks!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback(true)}
          disabled={feedbackState === 'submitting'}
          className="p-1 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
          title="This prediction was helpful"
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${feedbackType === 'helpful' ? 'text-green-400' : 'text-slate-400'}`} />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          disabled={feedbackState === 'submitting'}
          className="p-1 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
          title="This prediction was not helpful"
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${feedbackType === 'not-helpful' ? 'text-red-400' : 'text-slate-400'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">Helpful?</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleFeedback(true)}
        disabled={feedbackState === 'submitting'}
        className="h-7 px-2 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-500 disabled:opacity-50"
      >
        {feedbackState === 'submitting' && feedbackType === 'helpful' ? (
          '...'
        ) : (
          <>
            <ThumbsUp className="w-3.5 h-3.5 mr-1" />
            Yes
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleFeedback(false)}
        disabled={feedbackState === 'submitting'}
        className="h-7 px-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50"
      >
        {feedbackState === 'submitting' && feedbackType === 'not-helpful' ? (
          '...'
        ) : (
          <>
            <ThumbsDown className="w-3.5 h-3.5 mr-1" />
            No
          </>
        )}
      </Button>
    </div>
  );
}
