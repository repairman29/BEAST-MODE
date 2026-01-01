import { NextRequest, NextResponse } from 'next/server';

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
    const { enabled } = body;

    // TODO: Replace with actual backend call to enable/disable feature
    // For now, just return success
    console.log(`Setting ${feature} to ${enabled ? 'enabled' : 'disabled'}`);

    return NextResponse.json({
      success: true,
      feature,
      enabled,
      message: `${feature} ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    console.error(`Failed to toggle ${params.feature}:`, error);
    return NextResponse.json(
      { error: `Failed to toggle ${params.feature}`, details: error.message },
      { status: 500 }
    );
  }
}

