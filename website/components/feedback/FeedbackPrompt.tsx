'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    loadPrompt()
  }, [])

  const loadPrompt = async () => {
    try {
      const response = await fetch('/api/feedback/prompts?limit=1')
      const data = await response.json()
      if (data.success && data.prompts.length > 0) {
        setPrompt(data.prompts[0])
      }
    } catch (error) {
      console.error('Failed to load prompt:', error)
    }
  }

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
        setTimeout(() => {
          setSubmitted(false)
          setPrompt(null)
          loadPrompt()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!prompt) return null

  return (
    <div className="fixed bottom-4 right-4 bg-[#12121a] border border-[#00d9ff] border-opacity-30 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#00d9ff]">Quick Feedback</h3>
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

