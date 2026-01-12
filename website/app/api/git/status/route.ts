import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Status API
 * Returns current Git repository status
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    // Get Git status
    const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd });
    const { stdout: branchOutput } = await execAsync('git branch --show-current', { cwd });
    const { stdout: aheadBehind } = await execAsync('git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0 0"', { cwd });

    const branch = branchOutput.trim();
    const [ahead, behind] = aheadBehind.trim().split(/\s+/).map(Number);

    const modified: string[] = [];
    const staged: string[] = [];
    const untracked: string[] = [];
    const conflicts: string[] = [];

    // Parse status output
    statusOutput.split('\n').forEach((line) => {
      if (!line.trim()) return;
      
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status.includes('U') || status.includes('A') && status.includes('A')) {
        conflicts.push(file);
      } else if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      } else if (status[1] !== ' ') {
        modified.push(file);
      } else if (status[0] === '?' || status[1] === '?') {
        untracked.push(file);
      }
    });

    return NextResponse.json({
      branch,
      ahead: ahead || 0,
      behind: behind || 0,
      modified,
      staged,
      untracked,
      conflicts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get Git status' },
      { status: 500 }
    );
  }
}
