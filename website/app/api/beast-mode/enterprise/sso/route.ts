import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Enterprise SSO API
 * 
 * SAML, OAuth, LDAP integration and single sign-on
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const provider = searchParams.get('provider');

    const EnterpriseSSO = require('../../../../../../lib/enterprise/sso');
    const sso = new EnterpriseSSO();

    if (action === 'list') {
      // List configured providers
      return NextResponse.json({
        providers: ['saml', 'oauth', 'ldap', 'okta', 'azure'],
        configured: []
      });
    }

    if (action === 'test' && provider) {
      const result = await sso.testConnection(provider);
      return NextResponse.json(result);
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
    const body = await request.json();
    const { action, provider, config, callbackData } = body;

    const EnterpriseSSO = require('../../../../../../lib/enterprise/sso');
    const sso = new EnterpriseSSO();

    if (action === 'configure') {
      if (!provider || !config) {
        return NextResponse.json(
          { error: 'Provider and config are required' },
          { status: 400 }
        );
      }

      const result = await sso.configureProvider({ provider, config });
      return NextResponse.json(result);
    }

    if (action === 'login') {
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider is required' },
          { status: 400 }
        );
      }

      const redirectUrl = body.redirectUrl || `${request.headers.get('origin')}/auth/callback`;
      const result = await sso.initiateLogin(provider, redirectUrl);
      return NextResponse.json(result);
    }

    if (action === 'callback') {
      if (!provider || !callbackData) {
        return NextResponse.json(
          { error: 'Provider and callback data are required' },
          { status: 400 }
        );
      }

      const result = await sso.handleCallback(provider, callbackData);
      return NextResponse.json(result);
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

