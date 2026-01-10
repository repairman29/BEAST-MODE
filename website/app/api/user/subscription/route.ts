import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/user/subscription
 * Get user's subscription information
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session/auth
    // TODO: Implement proper auth (Supabase Auth, JWT, etc.)
    const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Get current month usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const monthStr = currentMonth.toISOString().split('T')[0];

    const { data: usage, error: usageError } = await supabase
      .rpc('get_or_create_user_usage', {
        p_user_id: userId,
        p_month: monthStr
      });

    if (usageError) {
      console.error('Error fetching usage:', usageError);
    }

    // If no subscription, create free tier
    if (!subscription) {
      const { data: newSub, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }

      return NextResponse.json({
        subscription: newSub,
        usage: usage || { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 }
      });
    }

    return NextResponse.json({
      subscription,
      usage: usage || { prs_analyzed: 0, repos_scanned: 0, api_calls: 0 }
    });
  } catch (error: any) {
    console.error('Error in subscription API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/subscription
 * Update user subscription (for admin/internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, stripe_customer_id, stripe_subscription_id, stripe_price_id, status } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: tier || 'free',
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status: status || 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ subscription: data });
  } catch (error: any) {
    console.error('Error in subscription update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
