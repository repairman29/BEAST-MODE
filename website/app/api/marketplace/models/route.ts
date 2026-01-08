import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Model Marketplace API
 */

let marketplace: any;

try {
  const marketplaceModule = loadModule('../../../../../lib/marketplace/modelMarketplace') ||
                           require('../../../../../lib/marketplace/modelMarketplace');
  marketplace = marketplaceModule?.getModelMarketplace
    ? marketplaceModule.getModelMarketplace()
    : marketplaceModule;
} catch (error) {
  console.warn('[Marketplace API] Module not available:', error);
}

/**
 * GET /api/marketplace/models
 * Search or list marketplace models
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const limit = parseInt(searchParams.get('limit') || '20');
    const popular = searchParams.get('popular') === 'true';
    const modelId = searchParams.get('modelId');

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    if (modelId) {
      // Get specific model
      const model = marketplace.publicModels.get(modelId);
      if (!model) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      const ratings = marketplace.getRatings(modelId);
      return NextResponse.json({
        success: true,
        model: {
          ...model,
          ratings
        }
      });
    }

    if (popular) {
      // Get popular models
      const models = marketplace.getPopularModels(limit);
      return NextResponse.json({
        success: true,
        models
      });
    }

    // Search
    const filters: any = { limit, sortBy };
    if (category) filters.category = category;
    if (minRating > 0) filters.minRating = minRating;

    const models = marketplace.search(query || '', filters);
    return NextResponse.json({
      success: true,
      models,
      count: models.length
    });

  } catch (error: any) {
    console.error('[Marketplace API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get marketplace models', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/models
 * Publish model or rate model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, modelId, rating, comment, metadata } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    if (action === 'publish') {
      if (!modelId) {
        return NextResponse.json(
          { error: 'modelId is required' },
          { status: 400 }
        );
      }

      const result = marketplace.publishModel(modelId, userId, metadata);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'rate') {
      if (!modelId || !rating) {
        return NextResponse.json(
          { error: 'modelId and rating are required' },
          { status: 400 }
        );
      }

      const result = marketplace.rateModel(modelId, userId, rating, comment);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'download') {
      if (!modelId) {
        return NextResponse.json(
          { error: 'modelId is required' },
          { status: 400 }
        );
      }

      const result = marketplace.recordDownload(modelId);
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
    console.error('[Marketplace API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process marketplace request', details: error.message },
      { status: 500 }
    );
  }
}
