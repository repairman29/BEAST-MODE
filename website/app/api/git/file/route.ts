import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git File API
 * Returns file content at a specific commit
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, file, commit } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!file) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const commitRef = commit || 'HEAD';
    const { stdout } = await execAsync(`git show ${commitRef}:"${file}"`, { cwd });

    return NextResponse.json({ content: stdout });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get file content' },
      { status: 500 }
    );
  }
}
