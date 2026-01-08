import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Documentation Generation API
 */

let documentationGenerator: any;

try {
  const docGenModule = loadModule('../../../../../lib/ai/documentationGenerator') ||
                      require('../../../../../lib/ai/documentationGenerator');
  documentationGenerator = docGenModule?.getDocumentationGenerator
    ? docGenModule.getDocumentationGenerator()
    : docGenModule;
} catch (error) {
  console.warn('[Documentation API] Module not available:', error);
}

/**
 * POST /api/ai/documentation
 * Generate documentation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, filePath, codebase, options = {} } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!documentationGenerator) {
      return NextResponse.json(
        { error: 'Documentation generator not available' },
        { status: 503 }
      );
    }

    if (codebase && options.type === 'readme') {
      // Generate README
      const result = documentationGenerator.generateREADME(codebase, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else if (code && filePath) {
      // Generate file documentation
      const result = documentationGenerator.generateDocumentation(code, filePath, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else {
      return NextResponse.json(
        { error: 'code and filePath, or codebase with type=readme required' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Documentation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate documentation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/documentation
 * Get generated documentation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');
    const filePath = searchParams.get('filePath');

    if (!documentationGenerator) {
      return NextResponse.json(
        { error: 'Documentation generator not available' },
        { status: 503 }
      );
    }

    if (docId) {
      const doc = documentationGenerator.documentation.get(docId);
      if (!doc) {
        return NextResponse.json(
          { error: 'Documentation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        documentation: doc
      });
    }

    if (filePath) {
      const docs = Array.from(documentationGenerator.documentation.values())
        .filter((d: any) => d.file === filePath)
        .sort((a: any, b: any) => 
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        );
      
      return NextResponse.json({
        success: true,
        documentation: docs[0] || null
      });
    }

    // Return all documentation
    const docs = Array.from(documentationGenerator.documentation.values());
    return NextResponse.json({
      success: true,
      documentation: docs,
      count: docs.length
    });

  } catch (error: any) {
    console.error('[Documentation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get documentation', details: error.message },
      { status: 500 }
    );
  }
}
