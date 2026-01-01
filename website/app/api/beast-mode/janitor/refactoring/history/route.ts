import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/beast-mode/janitor/refactoring/history
 * Get refactoring history
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const runs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        issuesFixed: 23,
        prsCreated: 5,
        status: 'completed',
        changes: [
          { file: 'src/utils/api.js', type: 'security', description: 'Removed hardcoded API key' },
          { file: 'src/components/Login.jsx', type: 'duplicate', description: 'Removed duplicate login function' },
          { file: 'src/hooks/useAuth.js', type: 'quality', description: 'Improved error handling' }
        ]
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
        issuesFixed: 15,
        prsCreated: 3,
        status: 'completed',
        changes: [
          { file: 'src/api/database.js', type: 'architecture', description: 'Moved DB logic to API route' },
          { file: 'src/components/Profile.jsx', type: 'quality', description: 'Fixed unused variable' }
        ]
      }
    ];

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('Failed to get refactoring history:', error);
    return NextResponse.json(
      { error: 'Failed to get refactoring history', details: error.message },
      { status: 500 }
    );
  }
}

