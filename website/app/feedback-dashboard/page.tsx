'use client'

import { useEffect, useState } from 'react'

interface FeedbackStats {
  totalPredictions: number
  withFeedback: number
  feedbackRate: number
  byService: Record<string, number>
  trainingReady: boolean
  predictionsWithFeedback: number
  targetRate: number
  targetFeedback: number
}

export default function FeedbackDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadStats = async () => {
    try {
      const res = await fetch('/api/feedback/stats')
      const data = await res.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load stats:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    
    if (autoRefresh) {
      const interval = setInterval(loadStats, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-red-500">Failed to load stats</div>
      </div>
    )
  }

  const feedbackRatePercent = (stats.feedbackRate * 100).toFixed(2)
  const targetPercent = (stats.targetRate * 100).toFixed(0)
  const isHealthy = stats.feedbackRate >= stats.targetRate
  const progressToTarget = stats.targetFeedback > 0 
    ? Math.min(100, (stats.withFeedback / stats.targetFeedback) * 100)
    : 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ML Feedback Dashboard</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Auto-refresh (30s)</span>
        </label>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600 mb-2">Feedback Rate</h2>
          <p className={`text-4xl font-bold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
            {feedbackRatePercent}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Target: {targetPercent}%</p>
          {!isHealthy && (
            <p className="text-xs text-red-500 mt-1">
              Need {stats.targetFeedback - stats.withFeedback} more
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600 mb-2">Total Predictions</h2>
          <p className="text-4xl font-bold text-gray-900">{stats.totalPredictions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Across all services</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600 mb-2">With Feedback</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.withFeedback.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalPredictions > 0 
              ? `${((stats.withFeedback / stats.totalPredictions) * 100).toFixed(1)}% coverage`
              : 'No predictions yet'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-600 mb-2">Training Ready</h2>
          <p className={`text-4xl font-bold ${stats.trainingReady ? 'text-green-600' : 'text-yellow-600'}`}>
            {stats.trainingReady ? '✅' : '⏳'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.trainingReady 
              ? 'Ready to train!' 
              : `Need ${50 - stats.predictionsWithFeedback} more`}
          </p>
        </div>
      </div>

      {/* Progress to Target */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Progress to Target (5%)</h2>
          <span className="text-sm text-gray-600">
            {stats.withFeedback} / {stats.targetFeedback}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              isHealthy ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressToTarget}%` }}
          />
        </div>
      </div>

      {/* Feedback by Service */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Feedback by Service</h2>
        {Object.keys(stats.byService).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats.byService)
              .sort(([, a], [, b]) => b - a)
              .map(([service, count]) => {
                const serviceTotal = stats.totalPredictions // Approximate
                const serviceRate = serviceTotal > 0 ? (count / serviceTotal) * 100 : 0
                return (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium capitalize">{service.replace('-', ' ')}</span>
                        <span className="text-sm text-gray-600">{count} feedback</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, serviceRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-gray-500">No feedback collected yet</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/feedback/prompts?limit=10"
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            View Feedback Prompts
          </a>
          <a
            href="http://localhost:5000"
            target="_blank"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            Open MLflow UI
          </a>
          {stats.trainingReady && (
            <button
              onClick={() => {
                // Could trigger training via API
                alert('Training can be started via: cd BEAST-MODE-PRODUCT && npm run train:model')
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Train Model
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
