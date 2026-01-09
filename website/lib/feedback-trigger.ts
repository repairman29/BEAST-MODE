/**
 * Feedback Trigger System
 * 
 * Proactively prompts users for feedback at key moments
 * to improve feedback collection rate
 */

interface FeedbackPromptOptions {
  service?: string;
  actionType?: string;
  message?: string;
  delay?: number; // Delay in milliseconds before showing prompt
  priority?: 'high' | 'medium' | 'low';
}

let feedbackPromptQueue: Array<{
  predictionId: string;
  options: FeedbackPromptOptions;
  timestamp: number;
}> = [];

let isPromptVisible = false;
let lastPromptTime = 0;
const MIN_PROMPT_INTERVAL = 30000; // 30 seconds between prompts

/**
 * Trigger a feedback prompt
 */
export function triggerFeedbackPrompt(
  predictionId: string,
  options: FeedbackPromptOptions = {}
) {
  if (!predictionId) return;

  // Don't show too many prompts
  const now = Date.now();
  if (now - lastPromptTime < MIN_PROMPT_INTERVAL) {
    // Queue for later
    feedbackPromptQueue.push({
      predictionId,
      options: {
        ...options,
        delay: MIN_PROMPT_INTERVAL - (now - lastPromptTime)
      },
      timestamp: now
    });
    return;
  }

  // Show prompt after delay
  const delay = options.delay || 2000; // Default 2 second delay
  
  setTimeout(() => {
    if (isPromptVisible) {
      // Queue for later if another prompt is visible
      feedbackPromptQueue.push({
        predictionId,
        options,
        timestamp: Date.now()
      });
      return;
    }

    showFeedbackPrompt(predictionId, options);
    lastPromptTime = Date.now();
  }, delay);
}

/**
 * Show feedback prompt to user
 */
function showFeedbackPrompt(
  predictionId: string,
  options: FeedbackPromptOptions
) {
  if (typeof window === 'undefined') return;
  
  isPromptVisible = true;

  // Create prompt element
  const prompt = document.createElement('div');
  prompt.id = 'beast-mode-feedback-prompt';
  prompt.className = 'fixed bottom-4 right-4 bg-slate-900 border-2 border-cyan-500/50 rounded-lg p-4 shadow-xl z-50 max-w-sm slide-up';
  prompt.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1">
        <p class="text-sm font-semibold text-white mb-1">
          ${options.message || 'Was this prediction helpful?'}
        </p>
        <p class="text-xs text-slate-400 mb-3">
          Your feedback helps improve our AI predictions
        </p>
        <div class="flex gap-2">
          <button
            id="feedback-helpful"
            class="px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors border border-green-500/30"
          >
            👍 Yes
          </button>
          <button
            id="feedback-not-helpful"
            class="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            👎 No
          </button>
          <button
            id="feedback-dismiss"
            class="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(prompt);

  // Handle feedback
  const handleFeedback = async (helpful: boolean) => {
    try {
      await fetch('/api/feedback/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          serviceName: options.service || 'unknown',
          feedbackType: 'user',
          feedbackScore: helpful ? 1 : 0,
          metadata: {
            source: 'feedback-prompt',
            actionType: options.actionType,
            timestamp: new Date().toISOString()
          }
        })
      });

      // Show success
      prompt.innerHTML = `
        <div class="flex items-center gap-2 text-green-400">
          <span>✓</span>
          <span class="text-sm">Thank you for your feedback!</span>
        </div>
      `;

      setTimeout(() => {
        prompt.remove();
        isPromptVisible = false;
        processFeedbackQueue();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      prompt.remove();
      isPromptVisible = false;
      processFeedbackQueue();
    }
  };

  // Attach event listeners
  prompt.querySelector('#feedback-helpful')?.addEventListener('click', () => handleFeedback(true));
  prompt.querySelector('#feedback-not-helpful')?.addEventListener('click', () => handleFeedback(false));
  prompt.querySelector('#feedback-dismiss')?.addEventListener('click', () => {
    prompt.remove();
    isPromptVisible = false;
    processFeedbackQueue();
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.body.contains(prompt)) {
      prompt.remove();
      isPromptVisible = false;
      processFeedbackQueue();
    }
  }, 30000);
}

/**
 * Process queued feedback prompts
 */
function processFeedbackQueue() {
  if (feedbackPromptQueue.length === 0 || isPromptVisible) return;

  const now = Date.now();
  const next = feedbackPromptQueue.find(p => {
    const elapsed = now - p.timestamp;
    return elapsed >= (p.options.delay || 0);
  });

  if (next) {
    feedbackPromptQueue = feedbackPromptQueue.filter(p => p !== next);
    showFeedbackPrompt(next.predictionId, next.options);
  }
}

// Process queue periodically
if (typeof window !== 'undefined') {
  setInterval(processFeedbackQueue, 5000);
}

/**
 * Get pending feedback prompts (for FeedbackPrompt component)
 */
export function getPendingFeedbackPrompts() {
  return feedbackPromptQueue.map(item => ({
    predictionId: item.predictionId,
    options: item.options,
    timestamp: item.timestamp
  }));
}

/**
 * Clear pending feedback prompts
 */
export function clearPendingFeedback(predictionId?: string) {
  if (predictionId) {
    feedbackPromptQueue = feedbackPromptQueue.filter(item => item.predictionId !== predictionId);
  } else {
    feedbackPromptQueue = [];
  }
}
