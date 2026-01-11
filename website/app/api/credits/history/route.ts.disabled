import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/credits/history
 * Get user's credit purchase and usage history
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   request.nextUrl.searchParams.get('userId');
    
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const type = request.nextUrl.searchParams.get('type'); // 'purchases', 'usage', or null for all
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results: any = {
      purchases: [],
      usage: [],
      transactions: []
    };

    // Get purchases
    if (!type || type === 'purchases') {
      const { data: purchases, error: purchasesError } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false })
        .limit(limit);

      if (!purchasesError && purchases) {
        results.purchases = purchases;
      }
    }

    // Get usage
    if (!type || type === 'usage') {
      const { data: usage, error: usageError } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!usageError && usage) {
        results.usage = usage;
      }
    }

    // Get transactions (combined view)
    if (!type || type === 'transactions') {
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!transactionsError && transactions) {
        results.transactions = transactions;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error fetching credit history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
