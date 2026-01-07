import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/auth/api-keys/[id]
 * Revoke a BEAST MODE API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    const keyId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Verify the key belongs to the user
    const { data: key, error: fetchError } = await supabase
      .from('beast_mode_api_keys')
      .select('id, user_id')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !key) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    // Revoke the key (set is_active to false)
    const { error: updateError } = await supabase
      .from('beast_mode_api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error revoking API key:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error: any) {
    console.error('API key revocation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}

