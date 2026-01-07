/**
 * BEAST MODE Error Handling
 * 
 * Uses unified errors with Next.js adapter (with fallback)
 */

import { NextRequest, NextResponse } from 'next/server';

// Use local fallback implementation (shared-utils may not be available in Vercel build)
// Fallback implementations for error handling
const sendError = (code: string, message: string, details: any = null, statusCode: number = 500) => {
    return NextResponse.json(
      {
        error: {
          code: code || 'INTERNAL_ERROR',
          message: message || 'An error occurred',
          ...(details && { details }),
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  };
  
const handleApiError = (error: any, context: any = {}) => {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  };
  
const asyncHandler = (handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) => {
    return async (req: NextRequest, ...args: any[]) => {
      try {
        return await handler(req, ...args);
      } catch (error: any) {
        return handleApiError(error, {
          method: req.method,
          path: req.nextUrl.pathname,
          service: 'beast-mode'
        });
      }
    };
  };
  
const validateRequired = (body: any, fields: string[]) => {
    const missing = fields.filter(
      (field) => !body[field] && body[field] !== 0 && body[field] !== false
    );
    if (missing.length > 0) {
      return {
        valid: false,
        error: {
          code: 'MISSING_FIELD',
          message: `Missing required fields: ${missing.join(', ')}`,
          details: { missing }
        }
      };
    }
    return { valid: true };
  };

export { sendError, handleApiError, asyncHandler, validateRequired };

/**
 * Helper to wrap API route handlers with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      return handleApiError(error, {
        service: 'beast-mode',
        handler: handler.name || 'unknown'
      });
    }
  }) as T;
}

