import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Unstage API
 * Unstages files
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, files } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array required' }, { status: 400 });
    }

    const filesStr = files.map((f: string) => `"${f}"`).join(' ');
    await execAsync(`git reset HEAD ${filesStr}`, { cwd });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to unstage files' },
      { status: 500 }
    );
  }
}
