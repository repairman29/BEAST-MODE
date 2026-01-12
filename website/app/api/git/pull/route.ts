import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Pull API
 * Pulls from remote
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    await execAsync('git pull', { cwd });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to pull' },
      { status: 500 }
    );
  }
}
