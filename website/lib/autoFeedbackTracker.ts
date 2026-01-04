/**
 * Auto Feedback Tracker (Client-Side)
 * Tracks user actions and automatically collects feedback
 * 
 * Phase 3: Automated Feedback Collection
 */

interface TrackedAction {
  actionType: string;
  predictionId: string | null;
  metadata?: Record<string, any>;
}

class AutoFeedbackTracker {
  private enabled: boolean = true;
  private actionQueue: TrackedAction[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
      this.setupEventListeners();
    }
  }

  /**
   * Track a user action
   */
  trackAction(actionType: string, predictionId: string | null = null, metadata: Record<string, any> = {}) {
    if (!this.enabled) return;

    const action: TrackedAction = {
      actionType,
      predictionId,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }
    };

    this.actionQueue.push(action);

    // Flush immediately for important actions
    if (this.isImportantAction(actionType)) {
      this.flush();
    }
  }

  /**
   * Check if an action is important enough to flush immediately
   */
  private isImportantAction(actionType: string): boolean {
    const importantActions = [
      'fix_applied',
      'fix_reverted',
      'quality_rated',
      'narrative_rated'
    ];
    return importantActions.includes(actionType);
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track clicks on fix buttons
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Check for fix-related buttons
      if (target.closest('[data-fix-action]')) {
        const fixAction = target.closest('[data-fix-action]')?.getAttribute('data-fix-action');
        const predictionId = target.closest('[data-prediction-id]')?.getAttribute('data-prediction-id') || null;
        
        if (fixAction === 'apply') {
          this.trackAction('fix_applied', predictionId, {
            element: target.tagName,
            className: target.className
          });
        } else if (fixAction === 'revert') {
          this.trackAction('fix_reverted', predictionId, {
            element: target.tagName,
            className: target.className
          });
        }
      }

      // Track quality ratings
      if (target.closest('[data-quality-rating]')) {
        const rating = target.closest('[data-quality-rating]')?.getAttribute('data-quality-rating');
        const predictionId = target.closest('[data-prediction-id]')?.getAttribute('data-prediction-id') || null;
        
        if (rating) {
          this.trackAction('quality_rated', predictionId, {
            rating: parseFloat(rating)
          });
        }
      }

      // Track search usage
      if (target.closest('[data-search-result]')) {
        const predictionId = target.closest('[data-search-result]')?.getAttribute('data-prediction-id') || null;
        this.trackAction('search_used', predictionId);
      }
    });
  }

  /**
   * Flush queued actions to the server
   */
  private async flush() {
    if (this.actionQueue.length === 0) return;

    const actions = [...this.actionQueue];
    this.actionQueue = [];

    try {
      await fetch('/api/feedback/auto-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
    } catch (error) {
      console.error('[Auto Feedback] Failed to flush actions:', error);
      // Re-queue actions on failure
      this.actionQueue.unshift(...actions);
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer() {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop the flush timer
   */
  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Enable tracking
   */
  enable() {
    this.enabled = true;
    this.startFlushTimer();
  }

  /**
   * Disable tracking
   */
  disable() {
    this.enabled = false;
    this.stopFlushTimer();
  }

  /**
   * Manually flush actions
   */
  async flushNow() {
    await this.flush();
  }
}

// Singleton instance
let tracker: AutoFeedbackTracker | null = null;

export function getAutoFeedbackTracker(): AutoFeedbackTracker {
  if (typeof window === 'undefined') {
    // Return a no-op tracker for SSR
    return {
      trackAction: () => {},
      enable: () => {},
      disable: () => {},
      flushNow: async () => {}
    } as AutoFeedbackTracker;
  }

  if (!tracker) {
    tracker = new AutoFeedbackTracker();
  }
  return tracker;
}

export default getAutoFeedbackTracker;

