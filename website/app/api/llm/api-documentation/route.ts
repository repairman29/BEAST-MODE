/**
 * API Documentation Generation API
 * Generates OpenAPI/Swagger documentation
 */

import { NextRequest, NextResponse } from 'next/server';
// Use @/ alias for website/lib/mlops (copied from root lib/mlops)
import apiDocumentationGenerator from '@/lib/mlops/apiDocumentationGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, format = 'openapi', options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const documentation = await apiDocumentationGenerator.generateAPIDocumentation(
      code,
      format,
      options
    );

    return NextResponse.json({ documentation });
  } catch (error: any) {
    console.error('API documentation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
