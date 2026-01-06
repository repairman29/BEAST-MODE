import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * License Validation API
 * Validates BEAST MODE API keys and returns subscription tier
 * 
 * GET /api/auth/validate
 * Headers: Authorization: Bearer <api_key>
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          valid: false,
          tier: 'free',
          error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>'
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          valid: false,
          tier: 'free',
          error: 'API key is required'
        },
        { status: 401 }
      );
    }

    // Hash the API key for lookup
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Look up API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('beast_mode_api_keys')
      .select('id, user_id, tier, is_active, expires_at')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      // API key not found - return free tier
      return NextResponse.json({
        valid: false,
        tier: 'free',
        subscription: {
          name: 'Free',
          apiCalls: 10000,
          features: ['basic-quality-checks', 'community-support', 'self-hosted']
        },
        error: 'Invalid API key'
      });
    }

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        tier: 'free',
        error: 'API key has expired'
      }, { status: 401 });
    }

    // Get current subscription for user
    const { data: subscription, error: subError } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', apiKeyData.user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine tier (use subscription tier if active, otherwise use key tier)
    let tier = 'free';
    if (subscription && !subError) {
      // Check if subscription is still valid
      if (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()) {
        tier = subscription.tier;
      } else {
        tier = 'free'; // Subscription expired
      }
    } else {
      // Fall back to key tier if no active subscription
      tier = apiKeyData.tier || 'free';
    }

    // Get API usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { count: apiCallsUsed } = await supabase
      .from('beast_mode_api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', apiKeyData.user_id)
      .eq('month_year', currentMonth);

    // Get tier limits
    const tierLimits: Record<string, number> = {
      free: 10000,
      developer: 100000,
      team: 500000,
      enterprise: 2000000
    };

    const apiCallsLimit = tierLimits[tier] || 10000;
    const apiCallsRemaining = Math.max(0, apiCallsLimit - (apiCallsUsed || 0));

    // Update last_used_at for API key
    await supabase
      .from('beast_mode_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    // Return validation result
    return NextResponse.json({
      valid: true,
      tier: tier,
      subscription: {
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        apiCalls: apiCallsLimit,
        features: getTierFeatures(tier)
      },
      apiCallsUsed: apiCallsUsed || 0,
      apiCallsLimit: apiCallsLimit,
      apiCallsRemaining: apiCallsRemaining
    });

  } catch (error: any) {
    console.error('License validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        tier: 'free',
        error: error.message || 'License validation failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Get features for a subscription tier
 */
function getTierFeatures(tier: string): string[] {
  const features: Record<string, string[]> = {
    free: [
      'basic-quality-checks',
      'community-support',
      'self-hosted'
    ],
    developer: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring'
    ],
    team: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring',
      'team-collaboration',
      'enterprise-guardrail',
      'plain-english-diffs',
      'team-analytics',
      'phone-support',
      'sla'
    ],
    enterprise: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring',
      'team-collaboration',
      'enterprise-guardrail',
      'plain-english-diffs',
      'team-analytics',
      'phone-support',
      'sla',
      'unlimited-api-calls',
      'white-label',
      'sso',
      'custom-integrations',
      'dedicated-manager',
      '24-7-support',
      'on-premise',
      'custom-ai-models'
    ]
  };

  return features[tier] || features.free;
}

