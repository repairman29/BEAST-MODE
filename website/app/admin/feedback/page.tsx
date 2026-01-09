'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FeedbackStats {
  totalPredictions: number
  withFeedback: number
  feedbackRate: number
  byService: Record<string, number>
  trainingReady: boolean
  predictionsWithFeedback: number
  targetRate: number
  targetFeedback: number
  inferredFeedback?: number
  manualFeedback?: number
  bySource?: Record<string, number>
  recentActivity?: Array<{
    predictionId: string
    source: string
    score: number
    timestamp: string
  }>
}

/**
 * Feedback Dashboard
 * 
 * INTERNAL ADMIN TOOL - ML feedback collection statistics
 * Protected by admin layout
 */

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
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">ML Feedback Dashboard</h1>
            <p className="text-slate-400">Monitor feedback collection and training readiness</p>
          </div>
          <label className="flex items-center gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-300">Auto-refresh (30s)</span>
          </label>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="pt-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">Feedback Rate</h2>
              <p className={`text-4xl font-bold ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {feedbackRatePercent}%
              </p>
              <p className="text-sm text-slate-500 mt-1">Target: {targetPercent}%</p>
              {!isHealthy && (
                <p className="text-xs text-red-400 mt-1">
                  Need {stats.targetFeedback - stats.withFeedback} more
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="pt-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">Total Predictions</h2>
              <p className="text-4xl font-bold text-white">{stats.totalPredictions.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Across all services</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="pt-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">With Feedback</h2>
              <p className="text-4xl font-bold text-cyan-400">{stats.withFeedback.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.totalPredictions > 0 
                  ? `${((stats.withFeedback / stats.totalPredictions) * 100).toFixed(1)}% coverage`
                  : 'No predictions yet'}
              </p>
              {stats.inferredFeedback !== undefined && stats.manualFeedback !== undefined && (
                <div className="mt-2 flex gap-2 text-xs">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Auto: {stats.inferredFeedback}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    Manual: {stats.manualFeedback}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="pt-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">Training Ready</h2>
              <p className={`text-4xl font-bold ${stats.trainingReady ? 'text-green-400' : 'text-amber-400'}`}>
                {stats.trainingReady ? '✅' : '⏳'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.trainingReady 
                  ? 'Ready to train!' 
                  : `Need ${Math.max(0, 50 - stats.predictionsWithFeedback)} more`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Target */}
        <Card className="bg-slate-900/90 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Progress to Target (5%)</CardTitle>
            <CardDescription className="text-slate-400">
              {stats.withFeedback} / {stats.targetFeedback} predictions with feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-800 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  isHealthy ? 'bg-green-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${progressToTarget}%` }}
              />
            </div>
            
            {/* Feedback Source Breakdown */}
            {stats.bySource && Object.keys(stats.bySource).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Feedback by Source</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(stats.bySource).map(([source, count]: [string, any]) => {
                    const percentage = stats.withFeedback > 0 
                      ? ((count / stats.withFeedback) * 100).toFixed(1)
                      : '0';
                    return (
                      <div key={source} className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1 capitalize">
                          {source.replace('_', ' ')}
                        </div>
                        <div className="text-lg font-bold text-white">{count}</div>
                        <div className="text-xs text-slate-500">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback by Service */}
        <Card className="bg-slate-900/90 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Feedback by Service</CardTitle>
            <CardDescription className="text-slate-400">
              Feedback collection across different services
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            <span className="font-medium text-white capitalize">{service.replace('-', ' ')}</span>
                            <span className="text-sm text-slate-400">{count} feedback</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, serviceRate)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-slate-500">No feedback collected yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <Card className="bg-slate-900/90 border-slate-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Recent Feedback Activity</CardTitle>
              <CardDescription className="text-slate-400">
                Latest feedback collection events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentActivity.slice(0, 10).map((activity, idx) => {
                  const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / (1000 * 60));
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          activity.source.includes('inferred') || activity.source.includes('auto')
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        }>
                          {activity.source.includes('inferred') || activity.source.includes('auto') ? '🤖 Auto' : '👤 Manual'}
                        </Badge>
                        <span className="text-sm text-slate-300">
                          Score: {(activity.score * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500">
                          {activity.predictionId.substring(0, 8)}...
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/feedback/prompts?limit=10"
                target="_blank"
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm transition-colors"
              >
                View Feedback Prompts
              </a>
              <a
                href="http://localhost:5000"
                target="_blank"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
              >
                Open MLflow UI
              </a>
              <a
                href="/quality"
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm transition-colors"
              >
                Quality Dashboard
              </a>
              {stats.trainingReady && (
                <button
                  onClick={() => {
                    // Could trigger training via API
                    alert('Training can be started via: cd BEAST-MODE-PRODUCT && npm run ml:train')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                >
                  🚀 Train Model
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
