import { NextRequest, NextResponse } from 'next/server';
import { getDisasterRecoveryService } from '../../../../lib/api-middleware';

/**
 * Disaster Recovery API
 * 
 * Provides backup and recovery operations
 * 
 * Phase 3, Week 2: Resilience & Recovery
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'status';
    const backupType = searchParams.get('type') || 'model';

    const recovery = await getDisasterRecoveryService();
    
    if (!recovery) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Disaster recovery not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'status') {
      // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// const strategies = recovery.backupStrategies ? Array.from(recovery.backupStrategies.entries()) : [];
      const history = recovery.backupHistory ? recovery.backupHistory.slice(-10) : [];
      return NextResponse.json({
        status: 'ok',
        strategies: strategies.map(([type, strategy]) => ({ type, ...strategy })),
        recentBackups: history,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'procedures') {
      // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// const procedures = recovery.recoveryProcedures ? Array.from(recovery.recoveryProcedures.entries()) : [];
      return NextResponse.json({
        status: 'ok',
        procedures: procedures.map(([type, procedure]) => ({ type, ...procedure })),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Disaster recovery API ready',
      operations: ['status', 'procedures'],
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
    const { operation, backupType, recoveryType } = await request.json();

    const recovery = await getDisasterRecoveryService();
    
    if (!recovery) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Disaster recovery not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'backup') {
      if (!backupType) {
        return NextResponse.json(
          { error: 'backupType required' },
          { status: 400 }
        );
      }
      const backup = await recovery.createBackup(backupType, {});
      return NextResponse.json({
        status: 'ok',
        backup,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'recover') {
      if (!recoveryType) {
        return NextResponse.json(
          { error: 'recoveryType required' },
          { status: 400 }
        );
      }
      // Use restoreFromBackup if available, otherwise return procedure info
      if (recovery.restoreFromBackup) {
        const backupId = recoveryType; // Use recoveryType as backupId
        const recoveryResult = await recovery.restoreFromBackup(backupId, {});
        return NextResponse.json({
          status: 'ok',
          recovery: recoveryResult,
          timestamp: new Date().toISOString()
        });
      } else {
        // Return recovery procedure info
        const procedure = recovery.recoveryProcedures?.get(recoveryType);
        return NextResponse.json({
          status: 'ok',
          procedure,
          message: 'Recovery procedure available',
          timestamp: new Date().toISOString()
        });
      }
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

