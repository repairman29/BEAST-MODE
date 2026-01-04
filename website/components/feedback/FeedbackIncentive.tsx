'use client'

import { useState, useEffect } from 'react'

interface FeedbackStreak {
  currentStreak: number
  longestStreak: number
  totalFeedback: number
  level: number
}

export default function FeedbackIncentive() {
  const [streak, setStreak] = useState<FeedbackStreak | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadStreak()
  }, [])

  const loadStreak = async () => {
    try {
      const response = await fetch('/api/feedback/streak')
      const data = await response.json()
      if (data.success) {
        setStreak(data.streak)
        
        // Show celebration if streak increased
        if (data.streak.currentStreak > 0 && data.streak.currentStreak % 5 === 0) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to load streak:', error)
    }
  }

  if (!streak) return null

  const level = Math.floor(streak.totalFeedback / 10) + 1
  const progress = (streak.totalFeedback % 10) / 10

  return (
    <div className="bg-[#12121a] border border-[#00d9ff] border-opacity-30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#00d9ff]">Feedback Streak</h3>
        {showCelebration && (
          <span className="text-[#39ff14] animate-pulse">🎉 +5 Streak!</span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-[#b0bec5] mb-1">
            <span>Current Streak</span>
            <span className="text-[#00d9ff] font-bold">{streak.currentStreak}</span>
          </div>
          <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00d9ff] to-[#00f0ff] transition-all"
              style={{ width: `${Math.min(streak.currentStreak * 10, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs">
          <div>
            <span className="text-[#b0bec5]">Longest: </span>
            <span className="text-white font-semibold">{streak.longestStreak}</span>
          </div>
          <div>
            <span className="text-[#b0bec5]">Total: </span>
            <span className="text-white font-semibold">{streak.totalFeedback}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1e293b]">
          <div className="flex justify-between text-xs text-[#b0bec5] mb-1">
            <span>Level {level}</span>
            <span>{Math.round(progress * 100)}% to Level {level + 1}</span>
          </div>
          <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#39ff14] to-[#00ff88] transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#78909c] text-center">
        Keep providing feedback to maintain your streak! 🔥
      </div>
    </div>
  )
}

