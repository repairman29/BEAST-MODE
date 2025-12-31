import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Custom Integrations API
 * 
 * API for custom integrations, webhook system, and extensibility
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const integrationId = searchParams.get('integrationId');
    const webhookId = searchParams.get('webhookId');

    const CustomIntegrations = require('../../../../../../lib/enterprise/custom-integrations');
    const integrations = new CustomIntegrations();

    if (action === 'list') {
      // List integrations
      return NextResponse.json({
        integrations: [],
        webhooks: []
      });
    }

    if (action === 'events') {
      const events = integrations.getAvailableEvents();
      return NextResponse.json({ events });
    }

    if (action === 'webhook' && webhookId) {
      const webhook = await integrations.getWebhook(webhookId);
      return NextResponse.json(webhook);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Custom Integrations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, integrationData, webhookConfig, apiConfig, webhookId, event, payload } = body;

    const CustomIntegrations = require('../../../../../../lib/enterprise/custom-integrations');
    const integrations = new CustomIntegrations();

    if (action === 'create-integration') {
      if (!integrationData) {
        return NextResponse.json(
          { error: 'Integration data is required' },
          { status: 400 }
        );
      }

      const result = await integrations.createIntegration(integrationData);
      return NextResponse.json(result);
    }

    if (action === 'create-webhook') {
      if (!webhookConfig) {
        return NextResponse.json(
          { error: 'Webhook config is required' },
          { status: 400 }
        );
      }

      const result = await integrations.configureWebhook(webhookConfig);
      return NextResponse.json(result);
    }

    if (action === 'create-api') {
      if (!apiConfig) {
        return NextResponse.json(
          { error: 'API config is required' },
          { status: 400 }
        );
      }

      const result = await integrations.createAPIIntegration(apiConfig);
      return NextResponse.json(result);
    }

    if (action === 'trigger-webhook') {
      if (!webhookId || !event || !payload) {
        return NextResponse.json(
          { error: 'Webhook ID, event, and payload are required' },
          { status: 400 }
        );
      }

      const result = await integrations.triggerWebhook(webhookId, event, payload);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Custom Integrations API error:', error);
    return NextResponse.json(
      { error: 'Failed to process integration request', details: error.message },
      { status: 500 }
    );
  }
}

