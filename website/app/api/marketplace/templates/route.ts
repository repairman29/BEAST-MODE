import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Model Templates API
 */

let modelTemplates: any;

try {
  const templatesModule = loadModule('../../../../../lib/marketplace/modelTemplates') ||
                          require('../../../../../lib/marketplace/modelTemplates');
  modelTemplates = templatesModule?.getModelTemplates
    ? templatesModule.getModelTemplates()
    : templatesModule;
} catch (error) {
  console.warn('[Model Templates API] Module not available:', error);
}

/**
 * GET /api/marketplace/templates
 * List or get templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const useCase = searchParams.get('useCase');
    const query = searchParams.get('q');

    if (!modelTemplates) {
      return NextResponse.json(
        { error: 'Model templates not available' },
        { status: 503 }
      );
    }

    if (templateId) {
      const template = modelTemplates.getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        template
      });
    }

    if (query) {
      const templates = modelTemplates.searchTemplates(query);
      return NextResponse.json({
        success: true,
        templates
      });
    }

    // List templates with filters
    const filters: any = {};
    if (category) filters.category = category;
    if (language) filters.language = language;
    if (useCase) filters.useCase = useCase;

    const templates = modelTemplates.listTemplates(filters);
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error: any) {
    console.error('[Model Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get templates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/templates
 * Create template or apply template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, templateData, templateId, baseConfig } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!modelTemplates) {
      return NextResponse.json(
        { error: 'Model templates not available' },
        { status: 503 }
      );
    }

    if (action === 'create') {
      if (!templateData || !templateData.name) {
        return NextResponse.json(
          { error: 'templateData with name is required' },
          { status: 400 }
        );
      }

      const result = modelTemplates.createTemplate(templateData);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'apply') {
      if (!templateId) {
        return NextResponse.json(
          { error: 'templateId is required' },
          { status: 400 }
        );
      }

      const result = modelTemplates.applyTemplate(templateId, baseConfig);
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
    console.error('[Model Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process template request', details: error.message },
      { status: 500 }
    );
  }
}
