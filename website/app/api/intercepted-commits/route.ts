import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/intercepted-commits
 * 
 * Retrieve intercepted commit data from Supabase
 * Allows bots/AI assistants to access data that was blocked from commits
 * 
 * Query params:
 * - repo_name: Filter by repository name
 * - limit: Number of records to return (default: 100)
 * - status: Filter by status (intercepted, reviewed, approved, rejected)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const repoName = searchParams.get('repo_name');
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('intercepted_commits')
      .select('*')
      .order('intercepted_at', { ascending: false })
      .limit(limit);

    if (repoName) {
      query = query.eq('repo_name', repoName);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching intercepted commits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch intercepted commits', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    console.error('Error in intercepted-commits API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intercepted-commits
 * 
 * Update status of intercepted commit
 * Allows marking as reviewed, approved, or rejected
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['intercepted', 'reviewed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('intercepted_commits')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error updating intercepted commit:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
