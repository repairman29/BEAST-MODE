import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Discord Integration API
 * 
 * Sends notifications to Discord channels for community updates, plugin updates, and system status
 */

/**
 * POST /api/integrations/discord
 * Send notification to Discord
 */
export async function POST(request: NextRequest) {
  try {
    const {
      webhookUrl,
      message,
      type = 'info',
      embed = null
    } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Format message based on type
    const colorMap: Record<string, number> = {
      'success': 0x36a64f,
      'error': 0xff0000,
      'warning': 0xffa500,
      'info': 0x36a64f,
      'plugin': 0x00d4ff,
      'update': 0xffa500
    };

    const emojiMap: Record<string, string> = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'plugin': '📦',
      'update': '🔄',
      'community': '👥'
    };

    const discordPayload = {
      content: `${emojiMap[type] || '📢'} ${message}`,
      embeds: embed ? [embed] : [{
        title: 'BEAST MODE Notification',
        description: message,
        color: colorMap[type] || colorMap.info,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'BEAST MODE'
        }
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      throw new Error('Failed to send Discord message');
    }

    return NextResponse.json({
      success: true,
      message: 'Discord notification sent',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Discord Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to send Discord notification', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/discord
 * Get Discord integration status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    return NextResponse.json({
      userId,
      connected: false,
      channels: [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Discord Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord integration', details: error.message },
      { status: 500 }
    );
  }
}

