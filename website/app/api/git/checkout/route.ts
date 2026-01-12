import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Checkout API
 * Switches to a branch
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, branch } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!branch) {
      return NextResponse.json({ error: 'Branch name required' }, { status: 400 });
    }

    await execAsync(`git checkout ${branch}`, { cwd });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to checkout branch' },
      { status: 500 }
    );
  }
}
