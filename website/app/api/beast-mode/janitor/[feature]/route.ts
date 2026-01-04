import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * POST /api/beast-mode/janitor/[feature]
 * Enable/disable a specific janitor feature
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { feature: string } }
) {
  try {
    const { feature } = params;
    const body = await request.json();
    const { enabled, config } = body;

    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        feature,
        enabled,
        message: `${feature} ${enabled ? 'enabled' : 'disabled'} successfully (database not available)`
      });
    }

    const { data, error } = await supabase
      .from('janitor_features')
      .upsert({
        user_id: userId || null,
        feature_name: feature,
        enabled: enabled !== false,
        config: config || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,feature_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to update feature:', error);
      return NextResponse.json(
        { error: `Failed to toggle ${feature}`, details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feature,
      enabled: data.enabled,
      message: `${feature} ${data.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    console.error(`Failed to toggle ${params.feature}:`, error);
    return NextResponse.json(
      { error: `Failed to toggle ${params.feature}`, details: error.message },
      { status: 500 }
    );
  }
}
