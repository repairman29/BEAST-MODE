import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Intelligent Test Generation API
 */

let testGenerator: any;

try {
  const testGeneratorModule = loadModule('../../../../../lib/ai/intelligentTestGenerator') ||
                              require('../../../../../lib/ai/intelligentTestGenerator');
  testGenerator = testGeneratorModule?.getIntelligentTestGenerator
    ? testGeneratorModule.getIntelligentTestGenerator()
    : testGeneratorModule;
} catch (error) {
  console.warn('[Test Generation API] Module not available:', error);
}

/**
 * POST /api/ai/test-generation
 * Generate tests for code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { functionInfo, code, components, options = {} } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!testGenerator) {
      return NextResponse.json(
        { error: 'Test generation not available' },
        { status: 503 }
      );
    }

    if (components && Array.isArray(components)) {
      // Generate integration tests
      const result = testGenerator.generateIntegrationTests(components, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else if (functionInfo && code) {
      // Generate function tests
      const result = testGenerator.generateFunctionTests(functionInfo, code, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else {
      return NextResponse.json(
        { error: 'functionInfo and code, or components array required' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Test Generation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tests', details: error.message },
      { status: 500 }
    );
  }
}
