import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * PLG Component Usage Tracking API
 * 
 * Tracks which components are used most
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { componentName, componentType, repo, userId, sessionId, metadata } = body;

    if (!componentName || !componentType) {
      return NextResponse.json(
        { error: 'componentName and componentType are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('plg_component_usage')
      .insert({
        component_name: componentName,
        component_type: componentType,
        repo: repo || null,
        user_id: userId || null,
        session_id: sessionId || null,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking component usage:', error);
      return NextResponse.json(
        { error: 'Failed to track usage', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Exception tracking component usage:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30', 10);

    const supabase = createServiceRoleClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from('plg_component_usage')
      .select('*')
      .gte('created_at', cutoffDate.toISOString());

    if (componentType) {
      query = query.eq('component_type', componentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Aggregate by component
    const stats: Record<string, any> = {};
    data?.forEach(usage => {
      const key = usage.component_name;
      if (!stats[key]) {
        stats[key] = {
          componentName: usage.component_name,
          componentType: usage.component_type,
          count: 0,
          uniqueRepos: new Set(),
          uniqueUsers: new Set()
        };
      }
      stats[key].count++;
      if (usage.repo) stats[key].uniqueRepos.add(usage.repo);
      if (usage.user_id) stats[key].uniqueUsers.add(usage.user_id);
    });

    // Convert sets to counts
    Object.values(stats).forEach((stat: any) => {
      stat.uniqueRepos = stat.uniqueRepos.size;
      stat.uniqueUsers = stat.uniqueUsers.size;
    });

    return NextResponse.json({
      total: data?.length || 0,
      days,
      components: Object.values(stats).sort((a: any, b: any) => b.count - a.count)
    });
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
