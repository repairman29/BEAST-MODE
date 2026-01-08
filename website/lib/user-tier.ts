/**
 * User Tier Utilities
 * Check if a user is in a paid tier (not free)
 */

import { getSupabaseClient } from './supabase';

const PAID_TIERS = ['developer', 'team', 'enterprise'];

/**
 * Check if a user is in a paid tier
 * @param userId - User ID to check
 * @returns true if user is in a paid tier, false otherwise
 */
export async function isPaidTier(userId: string | null | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const supabase = await getSupabaseClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if subscription is active and not expired
    if (subscription) {
      // Check if subscription is still valid (not expired)
      if (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()) {
        // Check if tier is paid
        return PAID_TIERS.includes(subscription.tier);
      }
    }

    // Check API key tier as fallback
    const { data: apiKey } = await supabase
      .from('beast_mode_api_keys')
      .select('tier')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (apiKey && PAID_TIERS.includes(apiKey.tier)) {
      return true;
    }

    // Default to free tier
    return false;
  } catch (error) {
    console.error('[User Tier] Error checking tier:', error);
    // On error, default to free (most restrictive)
    return false;
  }
}

/**
 * Get user's tier
 * @param userId - User ID to check
 * @returns tier string ('free', 'developer', 'team', 'enterprise')
 */
export async function getUserTier(userId: string | null | undefined): Promise<string> {
  if (!userId) {
    return 'free';
  }

  try {
    const supabase = await getSupabaseClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if subscription is active and not expired
    if (subscription) {
      if (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()) {
        return subscription.tier;
      }
    }

    // Check API key tier as fallback
    const { data: apiKey } = await supabase
      .from('beast_mode_api_keys')
      .select('tier')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (apiKey) {
      return apiKey.tier;
    }

    // Default to free tier
    return 'free';
  } catch (error) {
    console.error('[User Tier] Error getting tier:', error);
    return 'free';
  }
}
