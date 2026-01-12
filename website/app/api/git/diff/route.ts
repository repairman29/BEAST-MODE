import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Diff API
 * Returns diff for a file
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, file } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!file) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const { stdout } = await execAsync(`git diff "${file}"`, { cwd });

    return NextResponse.json({ diff: stdout });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get diff' },
      { status: 500 }
    );
  }
}
