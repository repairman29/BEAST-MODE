import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Branches API
 * Returns list of branches
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    const { stdout } = await execAsync('git branch -a', { cwd });
    const branches = stdout
      .split('\n')
      .map(line => line.trim().replace(/^\*\s*/, '').replace(/^remotes\/[^/]+\//, ''))
      .filter(line => line && !line.includes('HEAD'))
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    return NextResponse.json({ branches });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get branches' },
      { status: 500 }
    );
  }
}
