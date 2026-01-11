import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/credits/balance
 * Get user's credit balance
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get credit balance from user_subscriptions
    // Try to get credits columns, but handle gracefully if they don't exist yet
    let subscription;
    let error;
    
    try {
      const result = await supabase
        .from('user_subscriptions')
        .select('credits_balance, credits_total_purchased, credits_total_used')
        .eq('user_id', userId)
        .single();
      
      subscription = result.data;
      error = result.error;
    } catch (err: any) {
      // If columns don't exist, return zero balance (migration not applied yet)
      if (err.message?.includes('column') || err.message?.includes('does not exist')) {
        console.warn('Credit columns not found - migration may not be applied');
        return NextResponse.json({
          balance: 0,
          total_purchased: 0,
          total_used: 0,
          note: 'Credit system migration not applied yet'
        });
      }
      throw err;
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      // Check if it's a column error
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.warn('Credit columns not found - migration may not be applied');
        return NextResponse.json({
          balance: 0,
          total_purchased: 0,
          total_used: 0,
          note: 'Credit system migration not applied yet'
        });
      }
      console.error('Error fetching credit balance:', error);
      return NextResponse.json({ error: 'Failed to fetch credit balance' }, { status: 500 });
    }

    // If no subscription, return zero balance
    if (!subscription) {
      return NextResponse.json({
        balance: 0,
        total_purchased: 0,
        total_used: 0
      });
    }

    return NextResponse.json({
      balance: subscription.credits_balance || 0,
      total_purchased: subscription.credits_total_purchased || 0,
      total_used: subscription.credits_total_used || 0
    });
  } catch (error: any) {
    console.error('Error in credits balance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
