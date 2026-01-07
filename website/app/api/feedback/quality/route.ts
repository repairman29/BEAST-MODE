import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/feedback/quality
 * Collect user feedback on quality predictions
 * 
 * User Stories:
 * - "As a user, I want to provide feedback on quality scores"
 * - "As a developer, I want to improve the model based on feedback"
 */
interface QualityFeedback {
  repo: string;
  predictedQuality: number;
  actualQuality?: number; // User's assessment (0-1)
  helpful?: boolean; // Was the prediction helpful?
  comments?: string; // Optional feedback text
  userId?: string; // Optional user ID
}

export async function POST(request: NextRequest) {
  try {
    const body: QualityFeedback = await request.json();
    const { repo, predictedQuality, actualQuality, helpful, comments, userId } = body;

    if (!repo || predictedQuality === undefined) {
      return NextResponse.json(
        { error: 'Repository and predicted quality are required' },
        { status: 400 }
      );
    }

    // Store feedback in database
    const { data, error } = await supabase
      .from('quality_feedback')
      .insert({
        repo,
        predicted_quality: predictedQuality,
        actual_quality: actualQuality || null,
        helpful: helpful ?? null,
        comments: comments || null,
        user_id: userId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Quality Feedback] Error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: data.id,
      message: 'Thank you for your feedback!'
    });
  } catch (error: any) {
    console.error('[Quality Feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback/quality
 * Get quality feedback statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    let query = supabase
      .from('quality_feedback')
      .select('*', { count: 'exact' });

    if (repo) {
      query = query.eq('repo', repo);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Quality Feedback] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback', details: error.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: count || 0,
      helpful: data?.filter(f => f.helpful === true).length || 0,
      notHelpful: data?.filter(f => f.helpful === false).length || 0,
      withActualQuality: data?.filter(f => f.actual_quality !== null).length || 0,
      averageError: data && data.length > 0
        ? data
            .filter(f => f.actual_quality !== null && f.predicted_quality !== null)
            .reduce((sum, f) => sum + Math.abs(f.predicted_quality - (f.actual_quality || 0)), 0) /
          data.filter(f => f.actual_quality !== null).length
        : null
    };

    return NextResponse.json({
      feedback: data,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Quality Feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error.message },
      { status: 500 }
    );
  }
}

