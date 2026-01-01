import { NextRequest, NextResponse } from 'next/server';

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

    // TODO: Replace with actual database update
    console.log(`Setting rule ${ruleId} to ${enabled ? 'enabled' : 'disabled'}`);

    return NextResponse.json({
      success: true,
      ruleId,
      enabled,
      message: `Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    console.error(`Failed to toggle rule ${params.ruleId}:`, error);
    return NextResponse.json(
      { error: `Failed to toggle rule ${params.ruleId}`, details: error.message },
      { status: 500 }
    );
  }
}

