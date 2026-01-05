'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeedbackPrompt {
  predictionId: string
  service: string
  prompt: string
  actionType: string
  context: any
  createdAt: string
}

export default function FeedbackPrompt() {
  const [prompt, setPrompt] = useState<FeedbackPrompt | null>(null)
  const [rating, setRating] = useState<number>(0.5)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadPrompt = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback/prompts?limit=1')
      const data = await response.json()
      if (data.success && data.prompts.length > 0) {
        setPrompt(data.prompts[0])
        setSubmitted(false) // Reset submitted state when new prompt loads
      } else if (!prompt) {
        // Only hide if we don't have a prompt already
        setPrompt(null)
      }
    } catch (error) {
      console.error('Failed to load prompt:', error)
    }
  }, [prompt])

  useEffect(() => {
    loadPrompt()
    
      // Auto-refresh more frequently to catch new predictions
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (!prompt || submitted) {
          loadPrompt()
        }
      }, 5000) // 5 seconds - very frequent to catch predictions immediately
      
      return () => clearInterval(interval)
    }
  }, [loadPrompt, autoRefresh, prompt, submitted])
  
  // Also load prompt when user interacts with the page (visibility change, focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !prompt) {
        loadPrompt()
      }
    }
    
    const handleFocus = () => {
      if (!prompt) {
        loadPrompt()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadPrompt, prompt])

  const submitFeedback = async () => {
    if (!prompt) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: prompt.predictionId,
          actualValue: rating,
          context: {
            service: prompt.service,
            actionType: prompt.actionType
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setSubmitted(true)
        // Load next prompt after 2 seconds
        setTimeout(() => {
          setSubmitted(false)
          setPrompt(null)
          loadPrompt()
        }, 2000)
      } else {
        console.error('Failed to submit feedback:', data.error)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Always show a subtle indicator when auto-refresh is enabled, even if no prompt
  // This makes users aware feedback collection is active
  if (!prompt && !autoRefresh) return null
  
  // Show a more visible "waiting for feedback" indicator when no prompt but auto-refresh is on
  // This makes users aware that feedback collection is active
  if (!prompt && autoRefresh) {
    return (
      <div className="fixed bottom-4 right-4 bg-[#12121a] border-2 border-[#00d9ff] border-opacity-30 rounded-lg p-3 max-w-xs shadow-lg z-40 hover:border-opacity-60 transition-all cursor-pointer"
           onClick={() => loadPrompt()}
           title="Click to check for feedback prompts">
        <p className="text-xs text-[#00d9ff] flex items-center gap-2 font-semibold">
          <span className="animate-pulse text-lg">💡</span>
          <span>Help improve AI - Rate predictions</span>
        </p>
        <p className="text-[10px] text-[#78909c] mt-1">Click to check for prompts</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#12121a] border-2 border-[#00d9ff] border-opacity-70 rounded-lg p-4 max-w-sm shadow-2xl shadow-[#00d9ff]/30 z-50 animate-bounce-subtle hover:scale-105 transition-transform">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="text-sm font-semibold text-[#00d9ff]">Quick Feedback</h3>
        </div>
        <button
          onClick={() => setPrompt(null)}
          className="text-[#78909c] hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <p className="text-sm text-[#e8e6e3] mb-4">{prompt.prompt}</p>
      
      {!submitted ? (
        <>
          <div className="mb-4">
            <label className="text-xs text-[#b0bec5] mb-2 block">
              Rating: {(rating * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#78909c] mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <button
            onClick={submitFeedback}
            disabled={submitting}
            className="w-full bg-[#00d9ff] text-[#050505] px-4 py-2 rounded font-semibold hover:bg-[#00f0ff] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-[#39ff14]">✅ Thank you!</p>
        </div>
      )}
    </div>
  )
}

