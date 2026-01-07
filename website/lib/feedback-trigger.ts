/**
 * Proactive Feedback Triggers
 * Trigger feedback prompts immediately after user actions
 */

/**
 * Trigger a feedback prompt for a specific prediction
 * This can be called immediately after a prediction is used
 */
export async function triggerFeedbackPrompt(predictionId: string, context?: {
  service?: string
  actionType?: string
  message?: string
}) {
  try {
    // Store the prediction ID in sessionStorage for immediate feedback
    if (typeof window !== 'undefined') {
      const pendingFeedback = JSON.parse(
        sessionStorage.getItem('pending_feedback') || '[]'
      )
      
      pendingFeedback.push({
        predictionId,
        ...context,
        triggeredAt: new Date().toISOString()
      })
      
      // Keep only last 10 pending feedback items
      const trimmed = pendingFeedback.slice(-10)
      sessionStorage.setItem('pending_feedback', JSON.stringify(trimmed))
      
      // Dispatch event to trigger FeedbackPrompt to reload
      window.dispatchEvent(new CustomEvent('feedback-prompt-available', {
        detail: { predictionId, ...context }
      }))
    }
  } catch (error) {
    console.error('Failed to trigger feedback prompt:', error)
  }
}

/**
 * Get pending feedback prompts from sessionStorage
 */
export function getPendingFeedbackPrompts(): Array<{
  predictionId: string
  service?: string
  actionType?: string
  message?: string
  triggeredAt: string
}> {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(sessionStorage.getItem('pending_feedback') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear a pending feedback prompt after it's been submitted
 */
export function clearPendingFeedback(predictionId: string) {
  if (typeof window === 'undefined') return
  
  try {
    const pending = getPendingFeedbackPrompts()
    const filtered = pending.filter(p => p.predictionId !== predictionId)
    sessionStorage.setItem('pending_feedback', JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to clear pending feedback:', error)
  }
}

