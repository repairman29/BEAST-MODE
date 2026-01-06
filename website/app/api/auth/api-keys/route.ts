import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * BEAST MODE API Key Management
 * Generate and manage API keys for BEAST MODE subscriptions
 * 
 * GET /api/auth/api-keys - List user's API keys
 * POST /api/auth/api-keys - Generate new API key
 * DELETE /api/auth/api-keys/[id] - Revoke API key
 */

/**
 * Generate a secure API key
 */
function generateAPIKey(): string {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);
  // Convert to base64url (URL-safe base64)
  const base64 = randomBytes.toString('base64url');
  // Add prefix for identification
  return `bm_live_${base64}`;
}

/**
 * Hash API key for storage
 */
function hashAPIKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Get API key prefix (first 8 chars + ...)
 */
function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12) + '...';
}

/**
 * GET /api/auth/api-keys
 * List user's BEAST MODE API keys
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine tier (default to free)
    let tier = 'free';
    if (subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) {
      tier = subscription.tier;
    }

    // Get user's API keys
    const { data: apiKeys, error } = await supabase
      .from('beast_mode_api_keys')
      .select('id, key_prefix, name, tier, is_active, last_used_at, created_at, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keys: apiKeys || [],
      tier: tier,
      subscription: subscription || null
    });

  } catch (error: any) {
    console.error('API key fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/api-keys
 * Generate new BEAST MODE API key
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('beast_mode_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine tier (default to free)
    let tier = 'free';
    if (subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) {
      tier = subscription.tier;
    }

    // Generate API key
    const apiKey = generateAPIKey();
    const keyHash = hashAPIKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Store in database
    const { data: newKey, error: insertError } = await supabase
      .from('beast_mode_api_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: name || 'My API Key',
        tier: tier,
        is_active: true
      })
      .select('id, key_prefix, name, tier, created_at')
      .single();

    if (insertError) {
      console.error('Error creating API key:', insertError);
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    // Return the full API key (only shown once!)
    return NextResponse.json({
      success: true,
      apiKey: apiKey, // Full key - only returned once!
      key: {
        id: newKey.id,
        prefix: newKey.key_prefix,
        name: newKey.name,
        tier: newKey.tier,
        created_at: newKey.created_at
      },
      warning: 'Save this API key now - it will not be shown again!'
    });

  } catch (error: any) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate API key' },
      { status: 500 }
    );
  }
}

