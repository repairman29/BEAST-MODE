import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git Log API
 * Returns commit history
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath, limit = 20 } = await request.json();
    const cwd = repoPath || process.cwd();

    const { stdout } = await execAsync(
      `git log -n ${limit} --pretty=format:"%H|%s|%an|%ad" --date=iso`,
      { cwd }
    );

    const commits = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, message, author, date] = line.split('|');
        return {
          hash,
          message,
          author,
          date,
          files: [], // Would need separate call to get files
        };
      });

    return NextResponse.json({ commits });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get commit history' },
      { status: 500 }
    );
  }
}
