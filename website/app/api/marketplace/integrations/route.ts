import { NextRequest, NextResponse } from 'next/server';

/**
 * Integration Marketplace API
 * 
 * Provides integration marketplace functionality
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const marketplacePath = path.join(process.cwd(), '../../../lib/marketplace/integration-marketplace');
    const { getIntegrationMarketplace } = require(marketplacePath);
    const marketplace = getIntegrationMarketplace();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const integrations = marketplace.listIntegrations();
        return NextResponse.json({
          status: 'ok',
          data: { integrations },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'search') {
        const query = searchParams.get('query') || '';
        const results = marketplace.searchIntegrations(query);
        return NextResponse.json({
          status: 'ok',
          data: { results },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Integration marketplace API ready',
        operations: ['list', 'search'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'install') {
        const { integrationId, tenantId } = body;
        const installed = await marketplace.installIntegration(integrationId, tenantId);
        return NextResponse.json({
          status: 'ok',
          data: { installed },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'uninstall') {
        const { integrationId, tenantId } = body;
        const uninstalled = await marketplace.uninstallIntegration(integrationId, tenantId);
        return NextResponse.json({
          status: 'ok',
          data: { uninstalled },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

let withProductionIntegration: any = null;
try {
  /* webpackIgnore: true */
  const middleware = require(`../../../../lib/api-middleware`);
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Middleware not available
}

export async function GET(req: NextRequest) {
    try {
    } catch (error) {
      // Fall through to direct handler
    }
  }
}

export async function POST(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}

