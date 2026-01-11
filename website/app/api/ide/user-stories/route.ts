import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const storiesPath = path.join(process.cwd(), '../../beast-mode-ide/docs/user-stories/ALL_STORIES.json');
    const storiesData = fs.readFileSync(storiesPath, 'utf8');
    const stories = JSON.parse(storiesData);

    return NextResponse.json({
      success: true,
      stories,
      total: stories.length,
      p0: stories.filter((s: any) => s.priority === 'P0').length,
    });
  } catch (error) {
    console.error('Error loading user stories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load user stories' },
      { status: 500 }
    );
  }
}
