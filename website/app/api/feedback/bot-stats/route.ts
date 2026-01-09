import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * GET /api/feedback/bot-stats
 * Get bot feedback statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({
        totalBotFeedback: 0,
        byBot: {},
        byOutcome: { success: 0, failure: 0 },
        byRepo: {},
        recentActivity: []
      });
    }

    // Get bot feedback from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: botFeedback, error } = await supabase
      .from('ml_feedback')
      .select('*')
      .in('service_name', ['code-roach', 'ai-gm', 'oracle', 'daisy-chain'])
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[Bot Feedback Stats] Error:', error);
      return NextResponse.json(
        { error: 'Failed to get bot feedback stats', details: error.message },
        { status: 500 }
      );
    }

    const totalBotFeedback = botFeedback?.length || 0;

    // Group by bot
    const byBot: Record<string, number> = {};
    const byOutcome = { success: 0, failure: 0 };
    const byRepo: Record<string, number> = {};

    botFeedback?.forEach(f => {
      const botName = f.metadata?.botName || f.service_name || 'unknown';
      byBot[botName] = (byBot[botName] || 0) + 1;

      const outcome = f.metadata?.outcome || f.metadata?.success;
      if (outcome === 'success' || outcome === true || f.feedback_score >= 0.7) {
        byOutcome.success++;
      } else {
        byOutcome.failure++;
      }

      const repo = f.metadata?.repo || 'unknown';
      byRepo[repo] = (byRepo[repo] || 0) + 1;
    });

    // Recent activity
    const recentActivity = botFeedback?.slice(0, 20).map(f => ({
      id: f.id,
      botName: f.metadata?.botName || f.service_name || 'unknown',
      outcome: f.metadata?.outcome || (f.feedback_score >= 0.7 ? 'success' : 'failure'),
      repo: f.metadata?.repo || 'unknown',
      timestamp: f.created_at
    })) || [];

    return NextResponse.json({
      totalBotFeedback,
      byBot,
      byOutcome,
      byRepo,
      recentActivity
    });
  } catch (error: any) {
    console.error('[Bot Feedback Stats] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
