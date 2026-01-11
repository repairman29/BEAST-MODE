/**
 * Feedback Streak API
 * Track user feedback streaks and incentives
 * 
 * Phase 3: Feedback Incentives (Optional)
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Optional import - module may not exist
async function getFeedbackCollector() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '@/lib/mlops/feedbackCollector').catch(() => null);
    return module?.getFeedbackCollector || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get Supabase client
    const { getSupabaseClientOrNull } = await import('../../../../lib/supabase');
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      // Fallback to mock data if Supabase not available
      return NextResponse.json({
        success: true,
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          totalFeedback: 0,
          level: 1
        }
      });
    }

    // Get or create streak record
    let { data: streakData, error: fetchError } = await supabase
      .from('feedback_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // No streak record exists, create one
      const { data: newStreak, error: insertError } = await supabase
        .from('feedback_streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          total_feedback: 0,
          level: 1
        })
        .select()
        .single();

      if (insertError) {
        console.warn('[Feedback Streak] Failed to create streak:', insertError);
        return NextResponse.json({
          success: true,
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            totalFeedback: 0,
            level: 1
          }
        });
      }

      streakData = newStreak;
    } else if (fetchError) {
      console.warn('[Feedback Streak] Error fetching streak:', fetchError);
      return NextResponse.json({
        success: true,
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          totalFeedback: 0,
          level: 1
        }
      });
    }

    // Calculate level based on total feedback (every 10 feedback = 1 level)
    const level = Math.floor((streakData.total_feedback || 0) / 10) + 1;

    return NextResponse.json({
      success: true,
      streak: {
        currentStreak: streakData.current_streak || 0,
        longestStreak: streakData.longest_streak || 0,
        totalFeedback: streakData.total_feedback || 0,
        level: level,
        lastFeedbackAt: streakData.last_feedback_at || null
      }
    });
  } catch (error: any) {
    console.error('[Feedback Streak] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

