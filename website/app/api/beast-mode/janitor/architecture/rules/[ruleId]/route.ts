import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../../lib/supabase';

/**
 * POST /api/beast-mode/janitor/architecture/rules/[ruleId]
 * Enable/disable a specific rule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params;
    const body = await request.json();
    const { enabled } = body;

    const supabase = getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        ruleId,
        enabled,
        message: `Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'} successfully (database not available)`
      });
    }

    const { data, error } = await supabase
      .from('architecture_rules')
      .update({
        enabled: enabled !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update rule:', error);
      return NextResponse.json(
        { error: `Failed to toggle rule ${ruleId}`, details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ruleId,
      enabled: data.enabled,
      message: `Rule ${ruleId} ${data.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    console.error(`Failed to toggle rule ${params.ruleId}:`, error);
    return NextResponse.json(
      { error: `Failed to toggle rule ${params.ruleId}`, details: error.message },
      { status: 500 }
    );
  }
}
