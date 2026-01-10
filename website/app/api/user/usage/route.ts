import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRateLimiter } from '../../../../../lib/integrations/rateLimiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/user/usage
 * Get user's current usage and limits
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const rateLimiter = getRateLimiter(supabase);

    // Get tier and usage
    const tier = await rateLimiter.getUserTier(userId);
    const usage = await rateLimiter.getUserUsage(userId);

    // Get limits for tier
    const { TIER_LIMITS } = require('../../../../../lib/integrations/rateLimiter');
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    // Check if user can perform actions
    const canAnalyzePR = await rateLimiter.canPerformAction(userId, 'analyze_pr');
    const canScanRepo = await rateLimiter.canPerformAction(userId, 'scan_repo');
    const canApiCall = await rateLimiter.canPerformAction(userId, 'api_call');

    return NextResponse.json({
      tier,
      usage,
      limits: {
        prsPerMonth: limits.prsPerMonth,
        reposPerMonth: limits.reposPerMonth,
        apiCallsPerMonth: limits.apiCallsPerMonth
      },
      canPerform: {
        analyze_pr: canAnalyzePR.allowed,
        scan_repo: canScanRepo.allowed,
        api_call: canApiCall.allowed
      },
      upgradeUrl: rateLimiter.getUpgradeUrl(tier)
    });
  } catch (error: any) {
    console.error('Error in usage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/usage/increment
 * Increment usage counter (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionType, amount = 1 } = body;

    if (!actionType || !['analyze_pr', 'scan_repo', 'api_call'].includes(actionType)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const rateLimiter = getRateLimiter(supabase);

    await rateLimiter.incrementUsage(userId, actionType, amount);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
