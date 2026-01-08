import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '@/lib/github-token';

// Dynamic require for Node.js modules
let codebaseIndexer: any;
let githubFileFetcher: any;
try {
  // Path: website/app/api/codebase/index -> BEAST-MODE-PRODUCT/lib/mlops
  codebaseIndexer = require('../../../../../lib/mlops/codebaseIndexer');
  githubFileFetcher = require('../../../../../lib/github/fileFetcher');
} catch (error) {
  console.error('[Codebase Index API] Failed to load modules:', error);
}

/**
 * Codebase Indexing API
 * 
 * Indexes a repository for fast search and context.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo } = body;

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }

    if (!codebaseIndexer) {
      return NextResponse.json(
        { error: 'Codebase indexer not available' },
        { status: 500 }
      );
    }

    // Get user's GitHub token
    let userToken = null;
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (userId) {
      try {
        userToken = await getDecryptedToken(userId);
        if (userToken) {
          githubFileFetcher.initializeUserToken(userToken);
        }
        } catch (error) {
          console.warn('[Codebase Index API] Could not get user token: process.env.TOKEN || ''/');
      if (!owner || !repoName) {
        return NextResponse.json(
          { error: 'Invalid repository format. Use: owner/repo' },
          { status: 400 }
        );
      }

    // For VS Code extension, we need to handle local workspace indexing
    // If repo is in format "user/workspace-name", treat as local workspace
    // Otherwise, fetch from GitHub
    
    let results;
    if (repo.startsWith('user/')) {
      // Local workspace - extension will provide workspace path
      // For now, return a simple response indicating indexing would happen
      // In production, this could accept a file list or workspace path
      return NextResponse.json({
        success: true,
        repo,
        indexing: {
          filesIndexed: 0,
          symbolsIndexed: 0,
          dependenciesFound: 0,
          errors: 0,
        },
        stats: {
          totalFiles: 0,
          totalSymbols: 0,
          languages: {},
          lastIndexed: null,
        },
        message: 'Local workspace indexing - use GitHub repo format (owner/repo) for remote indexing',
      });
    }

    // Fetch repository files from GitHub
    if (!githubFileFetcher) {
      return NextResponse.json(
        { error: 'GitHub file fetcher not available' },
        { status: 500 }
      );
    }

    const files = await githubFileFetcher.fetchRepositoryFiles(owner, repoName, {
      maxFiles: 500,
      maxFileSize: 100000,
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No code files found in repository' },
        { status: 404 }
      );
    }

    // Use the singleton CodebaseIndexer instance
    // codebaseIndexer is already an instance (module.exports = new CodebaseIndexer())
    const indexer = codebaseIndexer;
    
    // For GitHub repos, we need to create a temp directory and write files
    // Then index that directory
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), `beast-mode-index-${Date.now()}`);
    
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Write files to temp directory
      for (const file of files) {
        if (file.path && file.content) {
          const filePath = path.join(tempDir, file.path);
          const dir = path.dirname(filePath);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, file.content);
        }
      }
      
      // Index the temporary directory
      results = await indexer.indexCodebase(tempDir, {
        maxFiles: 500,
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        includeExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.go'],
      });
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (indexError: any) {
      // Clean up on error
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw indexError;
    }

    // Get statistics
    const stats = codebaseIndexer.getStats();

    return NextResponse.json({
      success: true,
      repo,
      indexing: {
        filesIndexed: results.filesIndexed,
        symbolsIndexed: results.symbolsIndexed,
        dependenciesFound: results.dependenciesFound,
        errors: results.errors.length,
      },
      stats: {
        totalFiles: stats.filesIndexed,
        totalSymbols: stats.symbolsIndexed,
        languages: stats.languages,
        lastIndexed: stats.lastIndexed,
      },
    });

  } catch (error: any) {
    console.error('[Codebase Index API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to index codebase', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Search codebase
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'semantic';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!codebaseIndexer) {
      return NextResponse.json(
        { error: 'Codebase indexer not available' },
        { status: 500 }
      );
    }

    // Search codebase
    const results = await codebaseIndexer.search(query, {
      type,
      limit,
    });

    return NextResponse.json({
      success: true,
      query,
      results: results.map(r => ({
        type: r.type,
        path: r.path || r.name,
        score: r.score,
        metadata: r.metadata || r.locations,
      })),
      count: results.length,
    });

  } catch (error: any) {
    console.error('[Codebase Search API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search codebase', details: error.message },
      { status: 500 }
    );
  }
}

