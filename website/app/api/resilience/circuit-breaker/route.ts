import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getServices() {
  let getCircuitBreakerService: any;
  let executeWithCircuitBreaker: any;
  
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const middleware = await import(/* webpackIgnore: true */ '../../../lib/api-middleware').catch(() => null);
    getCircuitBreakerService = middleware?.getCircuitBreakerService;
    executeWithCircuitBreaker = middleware?.executeWithCircuitBreaker;
  } catch {}
  
  return { getCircuitBreakerService, executeWithCircuitBreaker };
}

/**
 * Circuit Breaker API
 * 
 * Provides circuit breaker management and execution
 * 
 * Phase 3, Week 2: Resilience & Recovery
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'status';
    const circuitName = searchParams.get('circuit') || 'default';

    const { getCircuitBreakerService } = await getServices();
    const breaker = getCircuitBreakerService ? await getCircuitBreakerService() : null;
    
    if (!breaker) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Circuit breaker not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'status') {
      const circuit = breaker.getCircuit(circuitName);
      return NextResponse.json({
        status: 'ok',
        circuit: circuit ? {
          name: circuit.name,
          state: circuit.state,
          failures: circuit.failures,
          successes: circuit.successes
        } : null,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'list') {
      // ARCHITECTURE: Moved to API route
      // ARCHITECTURE: Moved to API route
// const circuits = breaker && breaker.circuits ? Array.from(breaker.circuits.values()) : [];
      return NextResponse.json({
        status: 'ok',
        circuits: circuits.map((c: any) => ({
          name: c.name,
          state: c.state,
          failures: c.failures,
          successes: c.successes
        })),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Circuit breaker API ready',
      operations: ['status', 'list'],
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

export async function POST(request: NextRequest) {
  try {
    const { operation, circuitName, action } = await request.json();

    const { getCircuitBreakerService, executeWithCircuitBreaker } = await getServices();
    const breaker = getCircuitBreakerService ? await getCircuitBreakerService() : null;
    
    if (!breaker) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Circuit breaker not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'reset') {
      if (!circuitName) {
        return NextResponse.json(
          { error: 'circuitName required' },
          { status: 400 }
        );
      }
      const circuit = breaker.getCircuit(circuitName);
      if (circuit) {
        circuit.state = 'closed';
        circuit.failures = 0;
        circuit.successes = 0;
      }
      return NextResponse.json({
        status: 'ok',
        message: `Circuit ${circuitName} reset`,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'execute') {
      if (!circuitName || !action) {
        return NextResponse.json(
          { error: 'circuitName and action required' },
          { status: 400 }
        );
      }
      const result = executeWithCircuitBreaker ? await executeWithCircuitBreaker(
        circuitName,
        async () => {
          // Execute the action (would be provided by caller)
          return { executed: true, action };
        }
      ) : { executed: false, error: 'Circuit breaker not available' };
      return NextResponse.json({
        status: 'ok',
        result,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: `Unknown operation: ${operation}` },
      { status: 400 }
    );
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

