import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * API Usage Tracking API
 * Returns current API usage for the authenticated user
 * 
 * GET /api/auth/usage
 * Headers: Authorization: Bearer <api_key>
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>'
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    if (!apiKey) {
      return NextResponse.json(
        {
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
      .select('id, user_id, tier')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        {
          error: 'Invalid API key'
        },
        { status: 401 }
      );
    }

    // Get current subscription tier
    const { data: subscription } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', apiKeyData.user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine tier
    let tier = 'free';
    if (subscription) {
      if (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()) {
        tier = subscription.tier;
      }
    } else {
      tier = apiKeyData.tier || 'free';
    }

    // Get tier limits
    const tierLimits: Record<string, number> = {
      free: 10000,
      developer: 100000,
      team: 500000,
      enterprise: 2000000
    };

    const apiCallsLimit = tierLimits[tier] || 10000;

    // Get API usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { count: apiCallsUsed } = await supabase
      .from('beast_mode_api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', apiKeyData.user_id)
      .eq('month_year', currentMonth);

    // Get usage for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentUsage } = await supabase
      .from('beast_mode_api_usage')
      .select('endpoint, method, status_code, created_at')
      .eq('user_id', apiKeyData.user_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate usage percentage
    const usagePercentage = apiCallsLimit > 0 
      ? Math.round(((apiCallsUsed || 0) / apiCallsLimit) * 100)
      : 0;

    // Check if limit exceeded
    const limitExceeded = (apiCallsUsed || 0) >= apiCallsLimit;

    return NextResponse.json({
      tier: tier,
      used: apiCallsUsed || 0,
      limit: apiCallsLimit,
      remaining: Math.max(0, apiCallsLimit - (apiCallsUsed || 0)),
      usagePercentage: usagePercentage,
      limitExceeded: limitExceeded,
      currentMonth: currentMonth,
      recentUsage: recentUsage || [],
      // Overage pricing
      overage: {
        developer: 0.001,  // $0.001 per call after 100K
        team: 0.0008,      // $0.0008 per call after 500K
        enterprise: 0.0005 // $0.0005 per call after 2M
      }
    });

  } catch (error: any) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get usage data'
      },
      { status: 500 }
    );
  }
}

/**
 * Track API usage (called by other endpoints)
 * POST /api/auth/usage
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKeyId, endpoint, method, statusCode, responseTimeMs } = await request.json();

    if (!apiKeyId || !endpoint || !method) {
      return NextResponse.json(
        {
          error: 'Missing required fields: apiKeyId, endpoint, method'
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Get API key to get user_id
    const { data: apiKeyData } = await supabase
      .from('beast_mode_api_keys')
      .select('user_id')
      .eq('id', apiKeyId)
      .single();

    if (!apiKeyData) {
      return NextResponse.json(
        {
          error: 'Invalid API key ID'
        },
        { status: 401 }
      );
    }

    // Record usage
    const { error: insertError } = await supabase
      .from('beast_mode_api_usage')
      .insert({
        user_id: apiKeyData.user_id,
        api_key_id: apiKeyId,
        endpoint: endpoint,
        method: method,
        status_code: statusCode || 200,
        response_time_ms: responseTimeMs || null
      });

    if (insertError) {
      console.error('Failed to record API usage:', insertError);
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      success: true,
      message: 'Usage recorded'
    });

  } catch (error: any) {
    console.error('Usage tracking error:', error);
    // Don't fail the request if usage tracking fails
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to record usage'
    }, { status: 500 });
  }
}

