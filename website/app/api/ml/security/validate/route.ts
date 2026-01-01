import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Validation API
 * 
 * Validates and sanitizes input data
 * 
 * Phase 1, Week 3: Enterprise Unification & Security Enhancement
 */

// Basic validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

function validateSQL(input: string): boolean {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/))/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
}

function validateXSS(input: string): boolean {
  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*=.*javascript:/gi,
  ];
  
  return !xssPatterns.some(pattern => pattern.test(input));
}

export async function POST(request: NextRequest) {
  try {
    const { data, schema, validationType } = await request.json();

    if (!data) {
      return NextResponse.json(
        {
          error: 'Data is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {
      valid: true,
      errors: [],
      sanitized: {},
      timestamp: new Date().toISOString()
    };

    // Perform validation based on type
    if (validationType === 'email' && typeof data === 'string') {
      results.valid = validateEmail(data);
      if (!results.valid) {
        results.errors.push('Invalid email format');
      } else {
        results.sanitized = sanitizeString(data);
      }
    } else if (validationType === 'url' && typeof data === 'string') {
      results.valid = validateURL(data);
      if (!results.valid) {
        results.errors.push('Invalid URL format');
      } else {
        results.sanitized = sanitizeString(data);
      }
    } else if (validationType === 'sql' && typeof data === 'string') {
      results.valid = validateSQL(data);
      if (!results.valid) {
        results.errors.push('Potential SQL injection detected');
      } else {
        results.sanitized = sanitizeString(data);
      }
    } else if (validationType === 'xss' && typeof data === 'string') {
      results.valid = validateXSS(data);
      if (!results.valid) {
        results.errors.push('Potential XSS attack detected');
      } else {
        results.sanitized = sanitizeString(data);
      }
    } else if (typeof data === 'string') {
      // General string validation
      results.valid = validateSQL(data) && validateXSS(data);
      if (!results.valid) {
        if (!validateSQL(data)) results.errors.push('Potential SQL injection');
        if (!validateXSS(data)) results.errors.push('Potential XSS attack');
      }
      results.sanitized = sanitizeString(data);
    } else if (typeof data === 'object' && data !== null) {
      // Validate object properties
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const keyValid = validateSQL(value) && validateXSS(value);
          if (!keyValid) {
            results.valid = false;
            results.errors.push(`Invalid data in field: ${key}`);
          }
          results.sanitized[key] = sanitizeString(value);
        } else {
          results.sanitized[key] = value;
        }
      }
    } else {
      results.sanitized = data;
    }

    return NextResponse.json({
      status: results.valid ? 'valid' : 'invalid',
      valid: results.valid,
      errors: results.errors,
      sanitized: results.sanitized,
      timestamp: results.timestamp
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

    if (!input) {
      return NextResponse.json({
        status: 'error',
        message: 'Input parameter is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform security validation
    const sqlValid = validateSQL(input);
    const xssValid = validateXSS(input);
    const valid = sqlValid && xssValid;

    const errors: string[] = [];
    if (!sqlValid) errors.push('Potential SQL injection detected');
    if (!xssValid) errors.push('Potential XSS attack detected');

    return NextResponse.json({
      status: valid ? 'safe' : 'unsafe',
      valid,
      errors,
      sanitized: sanitizeString(input),
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
