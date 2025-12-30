import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Slack Integration API
 * 
 * Sends notifications to Slack channels for quality alerts, missions, and team updates
 */

/**
 * POST /api/integrations/slack
 * Send notification to Slack
 */
export async function POST(request: NextRequest) {
  try {
    const {
      webhookUrl,
      channel,
      message,
      type = 'info',
      attachments = []
    } = await request.json();

    if (!webhookUrl && !channel) {
      return NextResponse.json(
        { error: 'Webhook URL or channel is required' },
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
    const colorMap: Record<string, string> = {
      'success': '#36a64f',
      'error': '#ff0000',
      'warning': '#ffa500',
      'info': '#36a64f'
    };

    const emojiMap: Record<string, string> = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'quality': '🔍',
      'mission': '🎯',
      'plugin': '📦'
    };

    const slackPayload = {
      channel: channel || '#beast-mode',
      text: `${emojiMap[type] || '📢'} ${message}`,
      attachments: attachments.length > 0 ? attachments : [{
        color: colorMap[type] || colorMap.info,
        text: message,
        footer: 'BEAST MODE',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    // If webhook URL provided, send to webhook
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to send Slack message');
      }
    }

    // In production, would also store in database for tracking
    return NextResponse.json({
      success: true,
      message: 'Slack notification sent',
      channel: channel || 'webhook',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Slack Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to send Slack notification', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/slack
 * Get Slack integration status
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
    // const integration = await getSlackIntegration(userId);

    return NextResponse.json({
      userId,
      connected: false,
      channels: [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Slack Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Slack integration', details: error.message },
      { status: 500 }
    );
  }
}

