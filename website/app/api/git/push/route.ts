import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Push API
 * Pushes to remote
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, branch } = await request.json();
    const cwd = repoPath || process.cwd();

    const branchName = branch === 'current' ? '' : branch || '';
    await execAsync(`git push ${branchName ? `origin ${branchName}` : ''}`, { cwd });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to push' },
      { status: 500 }
    );
  }
}
