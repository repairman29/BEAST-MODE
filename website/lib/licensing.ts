/**
 * License Checker for BEAST MODE
 * SKU-based license validation for customer tools
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Check if user has license for BEAST MODE
 */
export async function checkBeastModeLicense(userId: string) {
  const client = getSupabase();
  if (!client) {
    return { hasLicense: false, tier: 'free', type: 'free', error: 'Supabase not configured' };
  }

  try {
    // Check Stripe subscription
    const { data: subscription, error: subError } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subError && subscription) {
      // Map subscription tier to BEAST MODE tier
      const tierMap: Record<string, string> = {
        'free': 'free',
        'developer': 'developer',
        'team': 'team',
        'sentinel': 'sentinel'
      };

      const subscriptionTier = (subscription as any).tier as string | undefined;
      const tier = subscriptionTier ? tierMap[subscriptionTier] || 'free' : 'free';
      const subscriptionId = (subscription as any).stripe_subscription_id as string | undefined;

      return {
        hasLicense: true,
        sku: 'beast-mode',
        tier,
        type: 'subscription',
        subscriptionId: subscriptionId || undefined
      };
    }

    // Free tier access
    return {
      hasLicense: true,
      sku: 'beast-mode',
      tier: 'free',
      type: 'free'
    };
  } catch (error: any) {
    return {
      hasLicense: false,
      tier: 'free',
      type: 'free',
      error: error.message
    };
  }
}

/**
 * Check if user can access feature based on tier
 */
export function canAccessFeature(license: { tier: string }, feature: string) {
  const tierFeatures: Record<string, string[]> = {
    free: ['basic-quality', 'basic-analytics'],
    developer: ['basic-quality', 'basic-analytics', 'api-keys', 'usage-tracking'],
    team: ['basic-quality', 'basic-analytics', 'api-keys', 'usage-tracking', 'team-workspace', 'collaboration'],
    sentinel: ['all'] // All features
  };

  if (license.tier === 'sentinel') {
    return true;
  }

  const features = tierFeatures[license.tier] || [];
  return features.includes(feature) || features.includes('all');
}

/**
 * Get license info for display
 */
export function getLicenseInfo(license: { tier: string; type: string }) {
  const tierNames: Record<string, string> = {
    free: 'Free',
    developer: 'Developer',
    team: 'Team',
    sentinel: 'SENTINEL'
  };

  return {
    tierName: tierNames[license.tier] || 'Free',
    tier: license.tier,
    type: license.type
  };
}

