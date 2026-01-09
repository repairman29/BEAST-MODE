'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';

interface EnhancedFeedbackPromptProps {
  predictionId: string;
  predictedValue: number;
  repo?: string;
  onClose?: () => void;
  onFeedbackSubmitted?: (score: number) => void;
}

/**
 * Enhanced Feedback Prompt
 * 
 * More prominent, engaging feedback collection UI
 * Designed to increase feedback collection rate
 */
export default function EnhancedFeedbackPrompt({
  predictionId,
  predictedValue,
  repo,
  onClose,
  onFeedbackSubmitted
}: EnhancedFeedbackPromptProps) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'rating' | 'comment' | 'submitted'>('idle');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-show after 3 seconds if user is still on page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (feedbackState === 'idle') {
        setFeedbackState('rating');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [feedbackState]);

  const handleQuickFeedback = async (helpful: boolean) => {
    const score = helpful ? 0.9 : 0.3;
    await submitFeedback(score, helpful ? 'helpful' : 'not-helpful');
  };

  const handleRatingSelect = (value: number) => {
    setRating(value);
    setFeedbackState('comment');
  };

  const submitFeedback = async (score: number, type: string, text?: string) => {
    if (!predictionId || submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          actualValue: score,
          context: {
            source: 'enhanced-prompt',
            type,
            comment: text || comment,
            repo,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setFeedbackState('submitted');
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(score);
        }

        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beast-mode-notification', {
            detail: {
              type: 'success',
              message: '🎉 Thank you! Your feedback helps improve predictions for everyone.'
            }
          }));
        }
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: 'Failed to submit feedback. Please try again.'
          }
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = () => {
    if (rating !== null) {
      submitFeedback(rating, 'detailed', comment);
    }
  };

  if (feedbackState === 'submitted') {
    return (
      <Card className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border-green-500/50 shadow-2xl z-50 animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-green-400 fill-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Thank You! 🎉</h3>
              <p className="text-sm text-slate-400">
                Your feedback helps us improve predictions for everyone.
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbackState === 'idle') {
    return null; // Don't show until auto-trigger
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/50 shadow-2xl z-50 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-base text-white">Help Us Improve</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Rate this quality prediction
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedbackState === 'rating' && (
          <>
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                How accurate was this quality prediction?
              </p>
              
              {/* Quick feedback buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFeedback(true)}
                  disabled={submitting}
                  className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-500"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Accurate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFeedback(false)}
                  disabled={submitting}
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Inaccurate
                </Button>
              </div>

              <div className="text-center text-xs text-slate-500">or</div>

              {/* Detailed rating */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Rate from 0-100%:</p>
                <div className="grid grid-cols-5 gap-2">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((value) => (
                    <Button
                      key={value}
                      variant={rating === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRatingSelect(value)}
                      className={`${
                        rating === value
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {(value * 100).toFixed(0)}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {feedbackState === 'comment' && rating !== null && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-300 mb-2">
                Selected: <span className="font-semibold text-cyan-400">{(rating * 100).toFixed(0)}%</span>
              </p>
              <p className="text-xs text-slate-400 mb-2">
                Optional: Tell us what we got right or wrong
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., 'The prediction was too high because...' or 'Spot on! The repo really does have...'"
                className="w-full min-h-[80px] bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFeedbackState('rating');
                  setComment('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={submitting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}

        {submitting && (
          <div className="text-center text-sm text-slate-400">
            Submitting feedback...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
