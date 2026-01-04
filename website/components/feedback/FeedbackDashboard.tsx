'use client'

import { useState, useEffect } from 'react'
import FeedbackIncentive from './FeedbackIncentive'

interface FeedbackStats {
  stats: {
    totalPredictions: number
    withActuals: number
    withoutActuals: number
    feedbackRate: number
    targetRate: number
    health: string
  }
  byService: Record<string, any>
  needingFeedback: number
}

export default function FeedbackDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/feedback/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-[#78909c]">Loading feedback stats...</div>
  }

  if (!stats) {
    return <div className="text-[#f59e0b]">Failed to load feedback stats</div>
  }

  const healthColor = {
    healthy: 'text-[#39ff14]',
    'needs-attention': 'text-[#ffb300]',
    critical: 'text-[#ef4444]'
  }[stats.stats.health] || 'text-[#78909c]'

  return (
    <div className="bg-[#12121a] border border-[#1e293b] rounded-lg p-6">
      <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Feedback Collection</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a24] p-4 rounded border border-[#1e293b]">
          <div className="text-sm text-[#b0bec5] mb-1">Total Predictions</div>
          <div className="text-2xl font-bold text-white">{stats.stats.totalPredictions.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1a1a24] p-4 rounded border border-[#1e293b]">
          <div className="text-sm text-[#b0bec5] mb-1">With Feedback</div>
          <div className="text-2xl font-bold text-white">{stats.stats.withActuals}</div>
        </div>
        
        <div className="bg-[#1a1a24] p-4 rounded border border-[#1e293b]">
          <div className="text-sm text-[#b0bec5] mb-1">Auto-Collected</div>
          <div className="text-2xl font-bold text-[#00d9ff]">
            {(stats.stats as any).autoCollected || 0}
          </div>
          <div className="text-xs text-[#78909c] mt-1">
            {stats.stats.withActuals > 0 
              ? `${((stats.stats.autoCollected || 0) / stats.stats.withActuals * 100).toFixed(0)}% of feedback`
              : 'No feedback yet'}
          </div>
        </div>
        
        <div className="bg-[#1a1a24] p-4 rounded border border-[#1e293b]">
          <div className="text-sm text-[#b0bec5] mb-1">Feedback Rate</div>
          <div className={`text-2xl font-bold ${healthColor}`}>
            {(stats.stats.feedbackRate * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-[#78909c] mt-1">
            Target: {(stats.stats.targetRate * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#00d9ff] mb-3">By Service</h3>
        <div className="space-y-2">
          {Object.entries(stats.byService).map(([service, data]: [string, any]) => (
            <div key={service} className="bg-[#1a1a24] p-3 rounded border border-[#1e293b]">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">{service}</span>
                <span className="text-sm text-[#b0bec5]">{data.total} needing feedback</span>
              </div>
              <div className="text-xs text-[#78909c] mt-1">
                Recent: {data.recent} | Old: {data.old} | With Context: {data.withContext}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a24] p-4 rounded border border-[#1e293b]">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#b0bec5]">Predictions Needing Feedback</span>
          <span className="text-lg font-bold text-[#00d9ff]">{stats.needingFeedback}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-[#00d9ff] mb-3">Your Progress</h3>
        <FeedbackIncentive />
      </div>
    </div>
  )
}

