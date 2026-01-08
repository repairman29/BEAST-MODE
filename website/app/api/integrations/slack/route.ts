import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Slack Integration API
 */

let slackIntegration: any;

try {
  const slackModule = loadModule('../../../../../lib/integrations/slack') ||
                      require('../../../../../lib/integrations/slack');
  slackIntegration = slackModule?.getSlackIntegration
    ? slackModule.getSlackIntegration()
    : slackModule;
} catch (error) {
  console.warn('[Slack API] Module not available:', error);
}

/**
 * POST /api/integrations/slack
 * Send notification or register webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelId, webhookUrl, message, options, qualityData } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!slackIntegration) {
      return NextResponse.json(
        { error: 'Slack integration not available' },
        { status: 503 }
      );
    }

    if (action === 'register') {
      if (!channelId || !webhookUrl) {
        return NextResponse.json(
          { error: 'channelId and webhookUrl are required' },
          { status: 400 }
        );
      }

      const result = slackIntegration.registerWebhook(channelId, webhookUrl);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'notify') {
      if (!channelId || !message) {
        return NextResponse.json(
          { error: 'channelId and message are required' },
          { status: 400 }
        );
      }

      const result = await slackIntegration.sendNotification(channelId, message, options);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'quality_report') {
      if (!channelId || !qualityData) {
        return NextResponse.json(
          { error: 'channelId and qualityData are required' },
          { status: 400 }
        );
      }

      const result = await slackIntegration.sendQualityReport(channelId, qualityData);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Slack API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Slack request', details: error.message },
      { status: 500 }
    );
  }
}
