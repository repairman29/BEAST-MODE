import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise Repositories API
 * 
 * Manage repositories for enterprise organizations
 */

// In-memory storage (replace with database in production)
let repos: any[] = [
  { id: '1', name: 'frontend-app', url: 'https://github.com/company/frontend-app', team: 'Engineering', lastScan: '2024-01-15', createdAt: new Date().toISOString() },
  { id: '2', name: 'backend-api', url: 'https://github.com/company/backend-api', team: 'Engineering', lastScan: '2024-01-14', createdAt: new Date().toISOString() },
  { id: '3', name: 'design-system', url: 'https://github.com/company/design-system', team: 'Design', lastScan: '2024-01-13', createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      repos,
      count: repos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch repositories', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, team } = await request.json();

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Extract repo name from URL
    const urlParts = url.trim().split('/');
    const repoName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'unknown';

    // Check if repo already exists
    if (repos.find(r => r.url === url.trim())) {
      return NextResponse.json(
        { error: 'Repository already exists' },
        { status: 409 }
      );
    }

    const newRepo = {
      id: String(repos.length + 1),
      name: repoName,
      url: url.trim(),
      team: team || '',
      lastScan: 'Never',
      createdAt: new Date().toISOString()
    };

    repos.push(newRepo);

    return NextResponse.json({
      repo: newRepo,
      message: 'Repository added successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add repository', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, url, team, name } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    const repoIndex = repos.findIndex(r => r.id === id);
    if (repoIndex === -1) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    if (url) {
      repos[repoIndex].url = url.trim();
      const urlParts = url.trim().split('/');
      repos[repoIndex].name = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || repos[repoIndex].name;
    }
    if (name) repos[repoIndex].name = name;
    if (team !== undefined) repos[repoIndex].team = team;

    return NextResponse.json({
      repo: repos[repoIndex],
      message: 'Repository updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update repository', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    const repoIndex = repos.findIndex(r => r.id === id);
    if (repoIndex === -1) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    repos.splice(repoIndex, 1);

    return NextResponse.json({
      message: 'Repository removed successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to remove repository', details: error.message },
      { status: 500 }
    );
  }
}

