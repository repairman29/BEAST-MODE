import { NextRequest, NextResponse } from 'next/server';
import { validateAndSanitizeRequest, getSecurityEnhancerService } from '../../../../lib/api-middleware';

/**
 * Security Validation API
 * 
 * Validates and sanitizes input data
 * 
 * Phase 1, Week 3: Enterprise Unification & Security Enhancement
 */

export async function POST(request: NextRequest) {
  try {
    const { data, schema } = await request.json();

    if (!data) {
      return NextResponse.json(
        {
          error: 'Data is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const validation = await validateAndSanitizeRequest(data, schema || {});

    if (!validation.valid) {
      return NextResponse.json(
        {
          status: 'validation_failed',
          errors: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      valid: true,
      sanitized: validation.sanitized,
      timestamp: new Date().toISOString()
    });
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input') || '';

    const security = await getSecurityEnhancerService();
    
    if (!security) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Security enhancer not available',
        timestamp: new Date().toISOString()
      });
    }

    // Scan for vulnerabilities
    const vulnerabilities = security.scanVulnerabilities(input);

    // Sanitize
    const sanitized = security.sanitizeOutput(input, 'xss');

    return NextResponse.json({
      status: 'ok',
      input,
      sanitized,
      vulnerabilities,
      timestamp: new Date().toISOString()
    });
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



