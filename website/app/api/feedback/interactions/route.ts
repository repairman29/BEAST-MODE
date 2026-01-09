/**
 * Feedback Interactions API
 * Tracks user interactions with quality predictions
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interactions } = body;

    if (!interactions || !Array.isArray(interactions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: interactions array required' },
        { status: 400 }
      );
    }

    // Store interactions for analytics (optional - can be logged or stored)
    console.log(`[Feedback Interactions] Received ${interactions.length} interactions`);
    
    // For now, just acknowledge receipt
    // In the future, we could store these in a separate analytics table
    interactions.forEach((interaction: any) => {
      console.log(`[Feedback Interaction] ${interaction.interactionType} for ${interaction.repo} (${interaction.predictionId?.substring(0, 8)}...)`);
    });

    return NextResponse.json({
      success: true,
      received: interactions.length,
      message: 'Interactions tracked'
    });
  } catch (error: any) {
    console.error('[Feedback Interactions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
