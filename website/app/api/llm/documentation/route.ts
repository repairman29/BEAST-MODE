/**
 * Documentation Generation API
 * Generates Markdown documentation for code
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Documentation Generation API
 */

// Use dynamic import to avoid build-time errors
async function loadDocumentationGenerator() {
  try {
    const docGenModule = await import('../../../../../lib/mlops/documentationGenerator');
    const getDocGen = docGenModule.getDocumentationGenerator || docGenModule.default?.getDocumentationGenerator;
    if (getDocGen) {
      return getDocGen();
    } else if (docGenModule.DocumentationGenerator) {
      return new docGenModule.DocumentationGenerator();
    }
    return null;
  } catch (error) {
    console.warn('[Documentation API] Module not available:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type = 'api', options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const documentationGenerator = await loadDocumentationGenerator();
    
    if (!documentationGenerator) {
      return NextResponse.json(
        { error: 'Documentation generator not available' },
        { status: 503 }
      );
    }

    const documentation = await documentationGenerator.generateDocumentation(
      code,
      options.filePath || '',
      options.language || 'javascript',
      { ...options, type }
    );

    return NextResponse.json({ documentation });
  } catch (error: any) {
    console.error('Documentation generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}
