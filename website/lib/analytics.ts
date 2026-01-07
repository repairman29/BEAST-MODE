/**
 * BEAST MODE Privacy-First Analytics
 * 
 * Tracks user engagement and feature usage without collecting PII.
 * All data is anonymized and aggregated.
 */

interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string; // Optional, anonymized
}

interface UserJourney {
  sessionId: string;
  startTime: number;
  events: AnalyticsEvent[];
  tabsVisited: Set<string>;
  featuresUsed: Set<string>;
  scanCount: number;
  fixCount: number;
  missionCount: number;
}

class Analytics {
  private sessionId: string;
  private userId: string | null = null;
  private journey: UserJourney | null = null;
  private enabled: boolean = true;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Generate session ID
    this.sessionId = this.generateSessionId();
    
    // Check if analytics is disabled
    if (typeof window !== 'undefined') {
      const disabled = localStorage.getItem('beast-mode-analytics-disabled');
      this.enabled = !disabled;
      
      // Initialize user journey
      this.initJourney();
      
      // Start flush timer
      this.startFlushTimer();
      
      // Track page view
      this.track('page', 'navigation', 'view', window.location.pathname);
      
      // Track session start
      this.track('session', 'lifecycle', 'start');
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initJourney() {
    this.journey = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      events: [],
      tabsVisited: new Set(),
      featuresUsed: new Set(),
      scanCount: 0,
      fixCount: 0,
      missionCount: 0
    };
  }

  setUserId(userId: string | null) {
    // Only store anonymized user ID (hash if needed)
    this.userId = userId ? this.hashUserId(userId) : null;
  }

  private hashUserId(userId: string): string {
    // Simple hash function (in production, use crypto.subtle)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  async track(
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number
  ) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      type,
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined
    };

    // Add to queue
    this.eventQueue.push(event);

    // Update journey
    if (this.journey) {
      this.journey.events.push(event);

      // Track tabs visited
      if (category === 'navigation' && action === 'view') {
        if (label) {
          this.journey.tabsVisited.add(label);
        }
      }

      // Track features used
      if (category === 'feature') {
        this.journey.featuresUsed.add(action);
      }

      // Track specific actions
      if (action === 'scan-complete') {
        this.journey.scanCount++;
      }
      if (action === 'fix-applied') {
        this.journey.fixCount++;
      }
      if (action === 'mission-complete') {
        this.journey.missionCount++;
      }
    }

    // Flush if queue is large
    if (this.eventQueue.length >= 50) {
      this.flush();
    }
  }

  // Convenience methods
  trackTabView(tabName: string) {
    this.track('page', 'navigation', 'view', tabName);
  }

  trackFeatureUse(featureName: string, details?: string) {
    this.track('event', 'feature', featureName, details);
  }

  trackScan(repoUrl: string, score?: number) {
    this.track('event', 'quality', 'scan-complete', repoUrl, score);
  }

  trackFix(fixType: string, success: boolean) {
    this.track('event', 'improve', 'fix-applied', fixType, success ? 1 : 0);
  }

  trackMission(missionId: string, completed: boolean) {
    this.track('event', 'intelligence', 'mission-complete', missionId, completed ? 1 : 0);
  }

  trackPluginInstall(pluginId: string) {
    this.track('event', 'marketplace', 'plugin-install', pluginId);
  }

  trackConversion(step: string) {
    this.track('event', 'conversion', step);
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics API
      await fetch('/api/beast-mode/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          journey: this.journey ? {
            sessionId: this.journey.sessionId,
            startTime: this.journey.startTime,
            duration: Date.now() - this.journey.startTime,
            tabsVisited: Array.from(this.journey.tabsVisited),
            featuresUsed: Array.from(this.journey.featuresUsed),
            scanCount: this.journey.scanCount,
            fixCount: this.journey.fixCount,
            missionCount: this.journey.missionCount
          } : null
        })
      });
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Analytics flush failed:', error);
      // Re-queue events if flush failed
      this.eventQueue.unshift(...events);
    }
  }

  async flushSync() {
    await this.flush();
  }

  getEngagementMetrics() {
    if (!this.journey) return null;

    const duration = Date.now() - this.journey.startTime;
    const minutes = Math.floor(duration / 60000);
    const eventCount = this.journey.events.length;
    const actionsPerMinute = minutes > 0 ? eventCount / minutes : eventCount;

    return {
      sessionDuration: duration,
      sessionDurationMinutes: minutes,
      totalEvents: eventCount,
      actionsPerMinute: Math.round(actionsPerMinute * 10) / 10,
      tabsVisited: this.journey.tabsVisited.size,
      featuresUsed: this.journey.featuresUsed.size,
      scanCount: this.journey.scanCount,
      fixCount: this.journey.fixCount,
      missionCount: this.journey.missionCount
    };
  }

  disable() {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('beast-mode-analytics-disabled', 'true');
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Flush remaining events
    this.flush();
  }

  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('beast-mode-analytics-disabled');
    }
    this.startFlushTimer();
  }

  // Cleanup on page unload
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Flush remaining events
    this.flushSync();
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op instance
    return {
      track: () => {},
      trackTabView: () => {},
      trackFeatureUse: () => {},
      trackScan: () => {},
      trackFix: () => {},
      trackMission: () => {},
      trackPluginInstall: () => {},
      trackConversion: () => {},
      setUserId: () => {},
      flush: async () => {},
      flushSync: async () => {},
      getEngagementMetrics: () => null,
      disable: () => {},
      enable: () => {},
      destroy: () => {}
    } as unknown as Analytics;
  }

  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      analyticsInstance?.destroy();
    });
  }

  return analyticsInstance;
}

export default getAnalytics;

