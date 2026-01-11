/**
 * Security Analysis API
 * Analyzes code for security vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Analysis API
 */

// Use dynamic require to avoid build-time errors
let securityAnalyzer: any = null;

try {
  const analyzerModule = require('@/lib/mlops/securityAnalyzer');
  if (analyzerModule.SecurityAnalyzer) {
    securityAnalyzer = new analyzerModule.SecurityAnalyzer();
  } else {
    securityAnalyzer = analyzerModule;
  }
} catch (error) {
  console.warn('[Security Analysis API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (!securityAnalyzer) {
      return NextResponse.json(
        { error: 'Security analyzer not available' },
        { status: 503 }
      );
    }

    const analysis = await securityAnalyzer.analyzeSecurity(
      code,
      options.filePath || '',
      { ...options, language }
    );

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Security analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze security' },
      { status: 500 }
    );
  }
}
