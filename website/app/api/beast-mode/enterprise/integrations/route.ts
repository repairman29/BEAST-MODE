import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * BEAST MODE Custom Integrations API
 * 
 * API for custom integrations, webhook system, and extensibility
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json({
        integrations: [],
        webhooks: [],
        status: 'error',
        message: 'Database not configured'
      });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const integrationId = searchParams.get('integrationId');
    const webhookId = searchParams.get('webhookId');

    if (action === 'list') {
      // Get user ID from session
      const userId = request.cookies.get('github_oauth_user_id')?.value;
      
      if (!userId) {
        return NextResponse.json({
          integrations: [],
          webhooks: [],
          status: 'error',
          message: 'Not authenticated'
        }, { status: 401 });
      }

      // Query integrations and webhooks from database
      const [integrationsResult, webhooksResult] = await Promise.all([
        supabase
          .from('integrations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('webhooks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      return NextResponse.json({
        integrations: integrationsResult.data || [],
        webhooks: webhooksResult.data || [],
        status: 'success'
      });
    }

    if (action === 'events') {
      // Return available webhook events
      return NextResponse.json({
        events: [
          { id: 'scan.completed', name: 'Scan Completed', description: 'Triggered when a repository scan finishes' },
          { id: 'quality.score.updated', name: 'Quality Score Updated', description: 'Triggered when quality score changes' },
          { id: 'plugin.installed', name: 'Plugin Installed', description: 'Triggered when a plugin is installed' },
          { id: 'mission.completed', name: 'Mission Completed', description: 'Triggered when a mission is completed' },
          { id: 'fix.applied', name: 'Fix Applied', description: 'Triggered when an auto-fix is applied' },
          { id: 'repository.connected', name: 'Repository Connected', description: 'Triggered when a repository is connected' },
        ],
        status: 'success'
      });
    }

    if (action === 'webhook' && webhookId) {
      const userId = request.cookies.get('github_oauth_user_id')?.value;
      
      if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }

      return NextResponse.json({ webhook: data, status: 'success' });
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
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 500 });
    }

    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { action, integrationData, webhookConfig, apiConfig, webhookId, event, payload } = body;

    if (action === 'create-integration') {
      if (!integrationData || !integrationData.name || !integrationData.type) {
        return NextResponse.json(
          { error: 'Integration name and type are required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: userId,
          name: integrationData.name,
          type: integrationData.type,
          description: integrationData.description || '',
          config: integrationData.config || {},
          enabled: integrationData.enabled !== false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create integration:', error);
        return NextResponse.json(
          { error: 'Failed to create integration', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        integration: data,
        status: 'success',
        message: 'Integration created successfully'
      });
    }

    if (action === 'create-webhook') {
      if (!webhookConfig || !webhookConfig.url || !webhookConfig.events || webhookConfig.events.length === 0) {
        return NextResponse.json(
          { error: 'Webhook URL and at least one event are required' },
          { status: 400 }
        );
      }

      // Generate webhook secret
      const crypto = await import('crypto');
      const secret = crypto.randomBytes(32).toString('hex');

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: userId,
          url: webhookConfig.url,
          events: webhookConfig.events,
          secret: secret,
          enabled: webhookConfig.enabled !== false,
          description: webhookConfig.description || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create webhook:', error);
        return NextResponse.json(
          { error: 'Failed to create webhook', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        webhook: data,
        status: 'success',
        message: 'Webhook created successfully'
      });
    }

    if (action === 'create-api') {
      if (!apiConfig || !apiConfig.name || !apiConfig.endpoint) {
        return NextResponse.json(
          { error: 'API name and endpoint are required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: userId,
          name: apiConfig.name,
          type: 'api',
          description: apiConfig.description || '',
          config: {
            endpoint: apiConfig.endpoint,
            method: apiConfig.method || 'POST',
            headers: apiConfig.headers || {},
            auth: apiConfig.auth || {},
          },
          enabled: apiConfig.enabled !== false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create API integration:', error);
        return NextResponse.json(
          { error: 'Failed to create API integration', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        integration: data,
        status: 'success',
        message: 'API integration created successfully'
      });
    }

    if (action === 'trigger-webhook') {
      if (!webhookId || !event || !payload) {
        return NextResponse.json(
          { error: 'Webhook ID, event, and payload are required' },
          { status: 400 }
        );
      }

      // Get webhook config
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('user_id', userId)
        .eq('enabled', true)
        .single();

      if (webhookError || !webhook) {
        return NextResponse.json({ error: 'Webhook not found or disabled' }, { status: 404 });
      }

      // Check if webhook subscribes to this event
      if (!webhook.events.includes(event)) {
        return NextResponse.json({ error: 'Webhook does not subscribe to this event' }, { status: 400 });
      }

      // Trigger webhook
      try {
        const crypto = await import('crypto');
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BEAST-MODE-Event': event,
            'X-BEAST-MODE-Signature': signature,
            'X-BEAST-MODE-Timestamp': new Date().toISOString(),
          },
          body: JSON.stringify(payload),
        });

        // Log webhook delivery
        await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhookId,
            event: event,
            status: response.ok ? 'success' : 'failed',
            status_code: response.status,
            response_body: await response.text().catch(() => null),
            delivered_at: new Date().toISOString(),
          });

        return NextResponse.json({
          status: 'success',
          message: 'Webhook triggered',
          delivery: {
            status: response.ok ? 'success' : 'failed',
            statusCode: response.status,
          }
        });
      } catch (triggerError: any) {
        console.error('Failed to trigger webhook:', triggerError);
        
        // Log failed delivery
        await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhookId,
            event: event,
            status: 'failed',
            status_code: 0,
            error: triggerError.message,
            delivered_at: new Date().toISOString(),
          });

        return NextResponse.json(
          { error: 'Failed to trigger webhook', details: triggerError.message },
          { status: 500 }
        );
      }
    }

    if (action === 'update-webhook') {
      if (!webhookId) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }

      const updateData: any = {};
      if (webhookConfig?.url) updateData.url = webhookConfig.url;
      if (webhookConfig?.events) updateData.events = webhookConfig.events;
      if (webhookConfig?.enabled !== undefined) updateData.enabled = webhookConfig.enabled;
      if (webhookConfig?.description !== undefined) updateData.description = webhookConfig.description;

      const { data, error } = await supabase
        .from('webhooks')
        .update(updateData)
        .eq('id', webhookId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update webhook', details: error.message }, { status: 500 });
      }

      return NextResponse.json({ webhook: data, status: 'success' });
    }

    if (action === 'delete-webhook') {
      if (!webhookId) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete webhook', details: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: 'success', message: 'Webhook deleted' });
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
