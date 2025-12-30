import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE GitHub Actions Integration API
 * 
 * Provides endpoints for GitHub Actions workflows to interact with BEAST MODE
 */

/**
 * POST /api/ci/github-actions
 * Receive quality check results from GitHub Actions
 */
export async function POST(request: NextRequest) {
  try {
    const {
      repository,
      branch,
      commit,
      pullRequest,
      qualityScore,
      issues,
      warnings,
      timestamp
    } = await request.json();

    // Validate required fields
    if (!repository || !branch || !commit) {
      return NextResponse.json(
        { error: 'Repository, branch, and commit are required' },
        { status: 400 }
      );
    }

    // Store quality check result
    // In production, this would be stored in a database
    const checkResult = {
      repository,
      branch,
      commit,
      pullRequest: pullRequest || null,
      qualityScore: qualityScore || 0,
      issues: issues || [],
      warnings: warnings || [],
      timestamp: timestamp || new Date().toISOString(),
      status: qualityScore >= 80 ? 'passed' : 'failed'
    };

    // In production, save to database
    // await saveQualityCheck(checkResult);

    return NextResponse.json({
      success: true,
      message: 'Quality check result received',
      result: checkResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('GitHub Actions API error:', error);
    return NextResponse.json(
      { error: 'Failed to process quality check', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ci/github-actions
 * Get quality check history for a repository
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const branch = searchParams.get('branch');

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // const checks = await getQualityChecks({ repository, branch });

    // Mock data for now
    const checks = [
      {
        commit: 'abc123',
        branch: branch || 'main',
        qualityScore: 85,
        status: 'passed',
        timestamp: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      repository,
      branch,
      checks,
      total: checks.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('GitHub Actions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality checks', details: error.message },
      { status: 500 }
    );
  }
}

