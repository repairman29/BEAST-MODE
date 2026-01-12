import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Codebase File API
 * 
 * Returns content of a specific file
 */
export async function POST(request: NextRequest) {
  try {
    const { file, repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!file) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const fullPath = join(cwd, file);
    const content = readFileSync(fullPath, 'utf8');

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to read file' },
      { status: 500 }
    );
  }
}
