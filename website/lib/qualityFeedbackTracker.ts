/**
 * Quality Feedback Tracker
 * 
 * Automatically infers feedback from user interactions with quality predictions
 * - Clicking recommendations = positive feedback
 * - Viewing details = engagement = positive feedback
 * - Time spent viewing = positive feedback
 * - Ignoring recommendations = neutral/negative feedback
 */

interface QualityInteraction {
  predictionId: string;
  repo: string;
  interactionType: 'recommendation_click' | 'details_view' | 'time_spent' | 'recommendation_ignore';
  metadata?: Record<string, any>;
  timestamp: number;
}

class QualityFeedbackTracker {
  private enabled: boolean = true;
  private interactionQueue: QualityInteraction[] = [];
  private viewStartTimes: Map<string, number> = new Map();
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MIN_VIEW_TIME = 3000; // 3 seconds for positive feedback

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startFlushInterval();
    }
  }

  /**
   * Track when user clicks on a recommendation
   */
  trackRecommendationClick(predictionId: string, repo: string, recommendationIndex: number, recommendation: any) {
    if (!this.enabled || !predictionId) return;

    this.interactionQueue.push({
      predictionId,
      repo,
      interactionType: 'recommendation_click',
      metadata: {
        recommendationIndex,
        action: recommendation.action,
        priority: recommendation.priority,
        category: recommendation.categorization?.type
      },
      timestamp: Date.now()
    });

    // Immediately infer positive feedback (user found recommendation useful)
    this.inferFeedback(predictionId, 0.8, {
      source: 'recommendation_click',
      recommendation: recommendation.action
    });

    console.log(`[Quality Feedback] Tracked recommendation click for ${repo}`);
  }

  /**
   * Track when user views quality details
   */
  trackDetailsView(predictionId: string, repo: string) {
    if (!this.enabled || !predictionId) return;

    this.viewStartTimes.set(predictionId, Date.now());

    this.interactionQueue.push({
      predictionId,
      repo,
      interactionType: 'details_view',
      timestamp: Date.now()
    });

    console.log(`[Quality Feedback] Tracked details view for ${repo}`);
  }

  /**
   * Track time spent viewing quality results
   */
  trackTimeSpent(predictionId: string, repo: string, timeSpent: number) {
    if (!this.enabled || !predictionId) return;

    // If user spent significant time viewing, infer positive feedback
    if (timeSpent >= this.MIN_VIEW_TIME) {
      const feedbackScore = Math.min(0.7, 0.5 + (timeSpent / 10000)); // Max 0.7 for time-based
      
      this.inferFeedback(predictionId, feedbackScore, {
        source: 'time_spent',
        timeSpentMs: timeSpent
      });

      this.interactionQueue.push({
        predictionId,
        repo,
        interactionType: 'time_spent',
        metadata: { timeSpentMs: timeSpent },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track when user ignores recommendations (scrolls past without clicking)
   */
  trackRecommendationIgnore(predictionId: string, repo: string) {
    if (!this.enabled || !predictionId) return;

    // Infer neutral feedback (not negative, just not engaging)
    this.inferFeedback(predictionId, 0.5, {
      source: 'recommendation_ignore'
    });

    this.interactionQueue.push({
      predictionId,
      repo,
      interactionType: 'recommendation_ignore',
      timestamp: Date.now()
    });
  }

  /**
   * Infer feedback score from interaction
   */
  private async inferFeedback(predictionId: string, score: number, context: Record<string, any>) {
    try {
      const response = await fetch('/api/feedback/auto-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          inferredValue: score,
          context: {
            ...context,
            inferred: true,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log(`[Quality Feedback] Inferred feedback: ${score} for ${predictionId.substring(0, 8)}...`);
      }
    } catch (error) {
      console.warn('[Quality Feedback] Failed to infer feedback:', error);
    }
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track when user leaves a quality result (calculate time spent)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User left the page, calculate time spent for all active views
        this.viewStartTimes.forEach((startTime, predictionId) => {
          const timeSpent = Date.now() - startTime;
          if (timeSpent >= 1000) { // At least 1 second
            // We need repo name, but we can infer from context
            // For now, just track the time
            this.viewStartTimes.delete(predictionId);
          }
        });
      }
    });

    // Track clicks on recommendation cards
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Check if clicked element is inside a recommendation card
      const recommendationCard = target.closest('[data-recommendation-card]');
      if (recommendationCard) {
        const predictionId = recommendationCard.getAttribute('data-prediction-id');
        const repo = recommendationCard.getAttribute('data-repo');
        const recommendationIndex = parseInt(recommendationCard.getAttribute('data-recommendation-index') || '0');
        
        if (predictionId && repo) {
          // Get recommendation data from the card
          const action = recommendationCard.querySelector('[data-recommendation-action]')?.textContent || '';
          const priority = recommendationCard.getAttribute('data-priority') || 'medium';
          
          this.trackRecommendationClick(predictionId, repo, recommendationIndex, {
            action,
            priority
          });
        }
      }
    });
  }

  /**
   * Start interval to flush interaction queue
   */
  private startFlushInterval() {
    setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush interaction queue to server
   */
  private async flush() {
    if (this.interactionQueue.length === 0) return;

    const interactions = [...this.interactionQueue];
    this.interactionQueue = [];

    try {
      await fetch('/api/feedback/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactions })
      });
    } catch (error) {
      console.warn('[Quality Feedback] Failed to flush interactions:', error);
      // Re-queue on failure
      this.interactionQueue.unshift(...interactions);
    }
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Export singleton instance
let trackerInstance: QualityFeedbackTracker | null = null;

export function getQualityFeedbackTracker(): QualityFeedbackTracker {
  if (typeof window === 'undefined') {
    // Return a no-op tracker for SSR
    return {
      trackRecommendationClick: (_predictionId: string, _repo: string, _recommendationIndex: number, _recommendation: any) => {},
      trackDetailsView: (_predictionId: string, _repo: string) => {},
      trackTimeSpent: (_predictionId: string, _repo: string, _timeSpent: number) => {},
      trackRecommendationIgnore: (_predictionId: string, _repo: string) => {},
      setEnabled: (_enabled: boolean) => {}
    } as QualityFeedbackTracker;
  }

  if (!trackerInstance) {
    trackerInstance = new QualityFeedbackTracker();
  }
  return trackerInstance;
}

export default getQualityFeedbackTracker;
