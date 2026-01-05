/**
 * Feedback Prompts API
 * Get high-value predictions that need feedback
 */

import { NextRequest, NextResponse } from 'next/server';

// Optional import - module may not exist
async function getFeedbackCollector() {
  try {
    // Use require with absolute path (works in Vercel where website/ is the build root)
    const path = require('path');
    const libPath = path.join(process.cwd(), '../lib/mlops/feedbackCollector');
    const module = require(libPath);
    if (!module?.getFeedbackCollector) {
      console.warn('[Feedback Prompts] Module imported but getFeedbackCollector not found');
      return null;
    }
    
    const collector = await module.getFeedbackCollector();
    if (!collector) {
      console.warn('[Feedback Prompts] getFeedbackCollector returned null');
      return null;
    }
    
    if (!collector.initialized) {
      await collector.initialize();
    }
    
    // Check if Supabase is configured
    if (!collector.supabase) {
      console.warn('[Feedback Prompts] Feedback collector initialized but Supabase not configured');
      return null;
    }
    
    return collector;
  } catch (error: any) {
    console.error('[Feedback Prompts] Error getting feedback collector:', error.message);
      // Fallback: try dynamic import
    try {
      // @ts-expect-error - Dynamic import path, module may not exist at build time
      const module = await import(/* webpackIgnore: true */ '../../../../../../lib/mlops/feedbackCollector').catch(() => null);
      if (module?.getFeedbackCollector) {
        const collector = await module.getFeedbackCollector();
        if (collector && !collector.initialized) {
          await collector.initialize();
        }
        return collector;
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const serviceName = searchParams.get('service') || null;

    const collector = await getFeedbackCollector();
    if (!collector) {
      // Return empty prompts instead of 503 - UI should handle gracefully
      return NextResponse.json({
        success: true,
        prompts: [],
        total: 0,
        service: serviceName,
        message: 'Feedback collector not available - returning empty prompts'
      });
    }
    
    // Get predictions needing feedback - be very inclusive to catch all predictions
    const predictions = await collector.getPredictionsNeedingFeedback({
      serviceName,
      limit: limit * 10, // Get many more predictions to filter from
      daysOld: 30 // Increase to 30 days to catch older predictions too
    });

    // Filter for high-value predictions - be VERY inclusive to maximize feedback collection
    const highValue = predictions.filter((pred: any) => {
      // Accept ALL predictions with any confidence
      if (pred.confidence && pred.confidence > 0.3) return true; // Lowered from 0.6
      
      // Recent predictions (last 7 days - was 48 hours)
      const age = Date.now() - new Date(pred.created_at).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) return true;
      
      // Important services (include ALL services)
      const importantServices = ['code-roach', 'ai-gm', 'oracle', 'daisy-chain', 'first-mate', 'game-app'];
      if (importantServices.includes(pred.service_name)) return true;
      
      // Any prediction from last 30 days (very inclusive)
      if (age < 30 * 24 * 60 * 60 * 1000) return true;
      
      // If we have very few predictions, accept all
      if (predictions.length < 10) return true;
      
      return false;
    });

    // Generate prompts
    const prompts = highValue.slice(0, limit).map(pred => {
      const service = pred.service_name || 'unknown';
      const context = pred.context || {};
      
      let prompt = '';
      let actionType = 'rate';
      
      if (service === 'code-roach') {
        prompt = `Did the fix for ${context.filePath || 'the code issue'} work correctly?`;
        actionType = 'fix-feedback';
      } else if (service === 'ai-gm') {
        prompt = `Was the AI GM's narrative quality good?`;
        actionType = 'quality-feedback';
      } else if (service === 'oracle') {
        prompt = `Was the Oracle's answer helpful?`;
        actionType = 'relevance-feedback';
      } else if (service === 'first-mate') {
        prompt = `Did the dice roll outcome match your expectations?`;
        actionType = 'dice-feedback';
      } else {
        prompt = `How accurate was this ${service} prediction?`;
        actionType = 'general-feedback';
      }

      return {
        predictionId: pred.id,
        service: service,
        prompt: prompt,
        actionType: actionType,
        context: {
          predictionType: pred.prediction_type,
          confidence: pred.confidence,
          predictedValue: pred.predicted_value,
          ...context
        },
        createdAt: pred.created_at,
        age: Date.now() - new Date(pred.created_at).getTime()
      };
    });

    return NextResponse.json({
      success: true,
      prompts: prompts,
      total: prompts.length,
      service: serviceName
    });
  } catch (error: any) {
    console.error('[Feedback Prompts] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

