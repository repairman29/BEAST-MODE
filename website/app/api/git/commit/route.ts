import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Commit API
 * Creates a commit
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, message, files } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!message) {
      return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
    }

    // Stage files if provided
    if (files && Array.isArray(files) && files.length > 0) {
      const filesStr = files.map((f: string) => `"${f}"`).join(' ');
      await execAsync(`git add ${filesStr}`, { cwd });
    }

    // Commit
    const escapedMessage = message.replace(/"/g, '\\"');
    await execAsync(`git commit -m "${escapedMessage}"`, { cwd });

    // Get commit hash
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd });
    const hash = stdout.trim();

    return NextResponse.json({ success: true, hash });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to commit' },
      { status: 500 }
    );
  }
}
