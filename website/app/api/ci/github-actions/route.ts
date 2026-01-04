import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../lib/supabase';

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

    // Store quality check result in Supabase
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

    const supabase = await getSupabaseClientOrNull();
    if (supabase) {
      try {
        const { error: dbError } = await supabase
          .from('quality_checks')
          .insert({
            repository,
            branch,
            commit,
            pull_request: pullRequest,
            quality_score: qualityScore,
            issues: issues || [],
            warnings: warnings || [],
            status: checkResult.status,
            created_at: checkResult.timestamp,
          });

        if (dbError) {
          console.error('Failed to store quality check:', dbError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

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

    // Fetch from Supabase
    const supabase = await getSupabaseClientOrNull();
    let checks: any[] = [];

    if (supabase) {
      try {
        let query = supabase
          .from('quality_checks')
          .select('*')
          .eq('repository', repository)
          .order('created_at', { ascending: false })
          .limit(100);

        if (branch) {
          query = query.eq('branch', branch);
        }

        const { data, error: dbError } = await query;

        if (!dbError && data) {
          checks = data.map((check: any) => ({
            commit: check.commit,
            branch: check.branch,
            pullRequest: check.pull_request,
            qualityScore: check.quality_score,
            issues: check.issues || [],
            warnings: check.warnings || [],
            status: check.status,
            timestamp: check.created_at,
          }));
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Return empty array on error
      }
    }

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

