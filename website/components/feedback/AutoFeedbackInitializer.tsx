'use client'

import { useEffect } from 'react'
import { getAutoFeedbackTracker } from '../../lib/autoFeedbackTracker'

/**
 * Auto Feedback Initializer Component
 * Initializes auto-feedback tracking on page load
 */
export default function AutoFeedbackInitializer() {
  useEffect(() => {
    // Initialize auto feedback tracker
    const tracker = getAutoFeedbackTracker();
    tracker.enable();

    // Cleanup on unmount
    return () => {
      tracker.disable();
    };
  }, []);

  // This component doesn't render anything
  return null;
}

