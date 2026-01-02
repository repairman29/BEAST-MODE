import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Registry API
 * 
 * Provides model registry and versioning functionality
 * 
 * Phase 3: Model Management Integration
 */

async function handler(req: NextRequest) {
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

  // Middleware not available
}

export async function GET(req: NextRequest) {
  return handler(req);
    }
  }
}

export async function POST(req: NextRequest) {
  return handler(req);
    }
  }
}

