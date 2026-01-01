import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

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

export async function GET(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}

export async function POST(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}

