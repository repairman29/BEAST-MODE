import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GitHub OAuth Configuration API
 * 
 * Stores and retrieves GitHub OAuth credentials from Supabase
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/github/config - Store GitHub OAuth config in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { clientId, clientSecret, redirectUri, encryptionKey } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'clientId and clientSecret are required' },
        { status: 400 }
      );
    }

    // Store in Supabase (encrypted or in a secure table)
    // For now, we'll use a simple config table
    const { data, error } = await supabase
      .from('app_config')
      .upsert({
        key: 'github_oauth',
        value: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri || 'http://localhost:7777/api/github/oauth/callback',
          encryption_key: encryptionKey,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it or use a different approach
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to store config',
          details: error.message,
          note: 'You may need to create the app_config table in Supabase'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub OAuth config stored in Supabase',
    });
  } catch (error: any) {
    console.error('Error storing GitHub config:', error);
    return NextResponse.json(
      { error: 'Failed to store GitHub config' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/github/config - Retrieve GitHub OAuth config from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'github_oauth')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Config not found', connected: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: true,
      config: data.value,
    });
  } catch (error: any) {
    console.error('Error retrieving GitHub config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GitHub config' },
      { status: 500 }
    );
  }
}

