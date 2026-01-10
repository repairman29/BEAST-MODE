/**
 * Rate Limiter
 * 
 * Enforces usage limits based on subscription tier
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('RateLimiter');

// Tier limits
const TIER_LIMITS = {
  free: {
    prsPerMonth: 10,
    reposPerMonth: 3,
    apiCallsPerMonth: 100
  },
  pro: {
    prsPerMonth: -1, // Unlimited
    reposPerMonth: 3,
    apiCallsPerMonth: 1000
  },
  team: {
    prsPerMonth: -1, // Unlimited
    reposPerMonth: 20,
    apiCallsPerMonth: 5000
  },
  enterprise: {
    prsPerMonth: -1, // Unlimited
    reposPerMonth: -1, // Unlimited
    apiCallsPerMonth: -1 // Unlimited
  }
};

class RateLimiter {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
  }

  /**
   * Get user's subscription tier
   */
  async getUserTier(userId) {
    if (!this.supabase) {
      // Fallback to free tier if no Supabase
      return 'free';
    }

    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Default to free tier
        return 'free';
      }

      // Check if subscription is active
      if (data.status !== 'active' && data.status !== 'trialing') {
        return 'free';
      }

      return data.tier || 'free';
    } catch (error) {
      log.error(`Failed to get user tier: ${error.message}`);
      return 'free';
    }
  }

  /**
   * Get user's current month usage
   */
  async getUserUsage(userId) {
    if (!this.supabase) {
      return { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 };
    }

    try {
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of month
      const monthStr = currentMonth.toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .rpc('get_or_create_user_usage', {
          p_user_id: userId,
          p_month: monthStr
        });

      if (error || !data) {
        return { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 };
      }

      return {
        prs_analyzed: data.prs_analyzed || 0,
        repos_scanned: data.repos_scanned || 0,
        api_calls: data.api_calls || 0
      };
    } catch (error) {
      log.error(`Failed to get user usage: ${error.message}`);
      return { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 };
    }
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(userId, actionType) {
    const tier = await this.getUserTier(userId);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const usage = await this.getUserUsage(userId);

    let limit, current;
    switch (actionType) {
      case 'analyze_pr':
        limit = limits.prsPerMonth;
        current = usage.prs_analyzed;
        break;
      case 'scan_repo':
        limit = limits.reposPerMonth;
        current = usage.repos_scanned;
        break;
      case 'api_call':
        limit = limits.apiCallsPerMonth;
        current = usage.api_calls;
        break;
      default:
        return { allowed: false, reason: 'Unknown action type' };
    }

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1, current };
    }

    if (current >= limit) {
      return {
        allowed: false,
        limit,
        current,
        reason: `Monthly limit reached (${current}/${limit}). Upgrade to continue.`
      };
    }

    return {
      allowed: true,
      limit,
      current,
      remaining: limit - current
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId, actionType, amount = 1) {
    if (!this.supabase) {
      log.warn('Supabase not configured - usage not tracked');
      return;
    }

    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthStr = currentMonth.toISOString().split('T')[0];

      let field;
      switch (actionType) {
        case 'analyze_pr':
          field = 'prs_analyzed';
          break;
        case 'scan_repo':
          field = 'repos_scanned';
          break;
        case 'api_call':
          field = 'api_calls';
          break;
        default:
          log.warn(`Unknown action type: ${actionType}`);
          return;
      }

      // Get or create usage record
      const { data: usage } = await this.supabase
        .rpc('get_or_create_user_usage', {
          p_user_id: userId,
          p_month: monthStr
        });

      if (!usage) {
        // Create new usage record
        await this.supabase
          .from('user_usage')
          .insert({
            user_id: userId,
            month: monthStr,
            [field]: amount
          });
      } else {
        // Update existing usage record
        await this.supabase
          .from('user_usage')
          .update({
            [field]: (usage[field] || 0) + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('month', monthStr);
      }

      log.info(`Incremented ${actionType} usage for user ${userId}: +${amount}`);
    } catch (error) {
      log.error(`Failed to increment usage: ${error.message}`);
    }
  }

  /**
   * Get upgrade URL based on current tier
   */
  getUpgradeUrl(currentTier) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
    
    switch (currentTier) {
      case 'free':
        return `${baseUrl}/pricing?tier=pro`;
      case 'pro':
        return `${baseUrl}/pricing?tier=team`;
      case 'team':
        return `${baseUrl}/pricing?tier=enterprise`;
      default:
        return `${baseUrl}/pricing`;
    }
  }
}

// Singleton instance
let rateLimiterInstance = null;

function getRateLimiter(supabaseClient = null) {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(supabaseClient);
  }
  return rateLimiterInstance;
}

module.exports = {
  RateLimiter,
  getRateLimiter,
  TIER_LIMITS
};
