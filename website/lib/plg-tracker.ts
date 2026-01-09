/**
 * PLG Component Usage Tracker
 * 
 * Tracks which components are used most
 */

class PLGTracker {
  private enabled: boolean = true;
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.getOrCreateSessionId();
      this.loadUserId();
    } else {
      this.sessionId = 'server';
    }
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('plg_session_id');
    if (stored) return stored;
    
    const newId = `plg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('plg_session_id', newId);
    return newId;
  }

  private loadUserId() {
    // Try to get user ID from auth context or localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('plg_user_id');
      if (stored) {
        this.userId = stored;
      }
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('plg_user_id', userId);
    }
  }

  async trackUsage(
    componentName: string,
    componentType: 'badge' | 'widget' | 'button' | 'cards',
    metadata: Record<string, any> = {}
  ) {
    if (!this.enabled) return;

    try {
      await fetch('/api/plg/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName,
          componentType,
          userId: this.userId,
          sessionId: this.sessionId,
          repo: metadata.repo || null,
          metadata
        })
      });
    } catch (error) {
      // Silently fail - don't break user experience
      console.debug('PLG tracking failed:', error);
    }
  }

  trackBadge(repo: string) {
    return this.trackUsage('QualityBadge', 'badge', { repo });
  }

  trackWidget(repo: string) {
    return this.trackUsage('QualityWidget', 'widget', { repo });
  }

  trackButton(predictionId: string, repo?: string) {
    return this.trackUsage('FeedbackButton', 'button', { predictionId, repo });
  }

  trackCards(repo: string) {
    return this.trackUsage('RecommendationCards', 'cards', { repo });
  }
}

// Singleton instance
let trackerInstance: PLGTracker | null = null;

export function getPLGTracker(): PLGTracker {
  if (!trackerInstance) {
    trackerInstance = new PLGTracker();
  }
  return trackerInstance;
}

// Auto-track on component mount
export function usePLGTracking(
  componentName: string,
  componentType: 'badge' | 'widget' | 'button' | 'cards',
  metadata: Record<string, any> = {}
) {
  if (typeof window !== 'undefined') {
    const tracker = getPLGTracker();
    tracker.trackUsage(componentName, componentType, metadata);
  }
}
