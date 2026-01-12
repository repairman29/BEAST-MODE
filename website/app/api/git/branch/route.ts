import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Branch API
 * Creates or lists branches
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, branch, create } = await request.json();
    const cwd = repoPath || process.cwd();

    if (create && branch) {
      await execAsync(`git branch ${branch}`, { cwd });
      return NextResponse.json({ success: true, branch });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create branch' },
      { status: 500 }
    );
  }
}
