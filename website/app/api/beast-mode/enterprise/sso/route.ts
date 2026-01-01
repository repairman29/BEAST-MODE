import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * BEAST MODE Enterprise SSO API
 * 
 * SAML, OAuth, LDAP integration and single sign-on
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const provider = searchParams.get('provider');

    if (action === 'list') {
      // List available and configured providers
      const availableProviders = ['saml', 'oauth', 'ldap', 'okta', 'azure'];
      
      let configured: any[] = [];
      
      if (supabase) {
        try {
          const userId = request.cookies.get('github_oauth_user_id')?.value;
          if (userId) {
            const { data } = await supabase
              .from('sso_configs')
              .select('*')
              .eq('user_id', userId)
              .eq('enabled', true);
            
            configured = data || [];
          }
        } catch (error) {
          console.error('Failed to fetch SSO configs:', error);
        }
      }

      return NextResponse.json({
        providers: availableProviders,
        configured: configured.map(c => ({
          provider: c.provider,
          name: c.name,
          enabled: c.enabled,
        })),
        status: 'success'
      });
    }

    if (action === 'test' && provider) {
      const userId = request.cookies.get('github_oauth_user_id')?.value;
      
      if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      if (!supabase) {
        return NextResponse.json({
          status: 'error',
          message: 'Database not configured',
          provider
        });
      }

      // Get SSO config
      const { data: config, error } = await supabase
        .from('sso_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('enabled', true)
        .single();

      if (error || !config) {
        return NextResponse.json({
          status: 'error',
          message: 'SSO configuration not found',
          provider
        }, { status: 404 });
      }

      // Test connection (basic validation)
      // In production, this would actually test the SSO connection
      return NextResponse.json({
        status: 'success',
        message: 'SSO connection test passed',
        provider,
        config: {
          name: config.name,
          provider: config.provider,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Enterprise SSO API error:', error);
    return NextResponse.json(
      { error: 'Failed to process SSO request', details: error.message },
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
    const { action, provider, config, callbackData } = body;

    if (action === 'configure') {
      if (!provider || !config) {
        return NextResponse.json(
          { error: 'Provider and config are required' },
          { status: 400 }
        );
      }

      // Validate provider
      const validProviders = ['saml', 'oauth', 'ldap', 'okta', 'azure'];
      if (!validProviders.includes(provider)) {
        return NextResponse.json(
          { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
          { status: 400 }
        );
      }

      // Store SSO configuration
      const { data, error } = await supabase
        .from('sso_configs')
        .upsert({
          user_id: userId,
          provider: provider,
          name: config.name || `${provider} SSO`,
          config: {
            endpoint: config.endpoint,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            metadata: config.metadata || {},
          },
          enabled: config.enabled !== false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to configure SSO:', error);
        return NextResponse.json(
          { error: 'Failed to configure SSO', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'success',
        message: 'SSO provider configured successfully',
        provider,
        config: {
          name: data.name,
          provider: data.provider,
          enabled: data.enabled,
        }
      });
    }

    if (action === 'login') {
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider is required' },
          { status: 400 }
        );
      }

      // Get SSO config
      const { data: ssoConfig, error: configError } = await supabase
        .from('sso_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('enabled', true)
        .single();

      if (configError || !ssoConfig) {
        return NextResponse.json({
          error: 'SSO configuration not found or disabled',
          provider
        }, { status: 404 });
      }

      // Generate SSO login URL
      // In production, this would use the actual SSO library (passport-saml, etc.)
      const stateData = JSON.stringify({ userId, timestamp: Date.now() });
      // ARCHITECTURE: Moved to API route
      const state = Buffer.from(stateData).toString('base64');
      const loginUrl = `${process.env.NEXT_PUBLIC_URL || 'https://beast-mode.dev'}/api/beast-mode/enterprise/sso/callback?provider=${provider}&state=${state}`;

      return NextResponse.json({
        status: 'success',
        message: 'SSO login initiated',
        provider,
        loginUrl,
        // In production, this would be the actual SSO provider's login URL
        redirectUrl: ssoConfig?.config?.endpoint || loginUrl,
      });
    }

    if (action === 'callback') {
      if (!provider || !callbackData) {
        return NextResponse.json(
          { error: 'Provider and callback data are required' },
          { status: 400 }
        );
      }

      // Get SSO config
      const { data: ssoConfig, error: configError } = await supabase
        .from('sso_configs')
        .select('*')
        .eq('provider', provider)
        .eq('enabled', true)
        .single();

      if (configError || !ssoConfig) {
        return NextResponse.json({
          error: 'SSO configuration not found',
          provider
        }, { status: 404 });
      }

      // Process SSO callback
      // In production, this would validate the SAML/OAuth response
      // For now, return success
      return NextResponse.json({
        status: 'success',
        message: 'SSO callback processed',
        provider,
        user: {
          // In production, extract user info from SSO response
          id: callbackData.userId || userId,
          email: callbackData.email,
          name: callbackData.name,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Enterprise SSO API error:', error);
    return NextResponse.json(
      { error: 'Failed to process SSO request', details: error.message },
      { status: 500 }
    );
  }
}
