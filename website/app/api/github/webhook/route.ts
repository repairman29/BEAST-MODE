import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GitHub App Webhook Handler
 * 
 * Receives webhook events from GitHub App and processes them
 * Events: pull_request, push, check_run, etc.
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Process webhook event
 */
async function processWebhookEvent(event: string, payload: any) {
  console.log(`[GitHub Webhook] Processing event: ${event}`);

  switch (event) {
    case 'pull_request':
      return await handlePullRequestEvent(payload);
    case 'push':
      return await handlePushEvent(payload);
    case 'installation':
      return await handleInstallationEvent(payload);
    case 'installation_repositories':
      return await handleInstallationRepositoriesEvent(payload);
    default:
      console.log(`[GitHub Webhook] Unhandled event: ${event}`);
      return { processed: false, event };
  }
}

/**
 * Handle pull request events
 */
async function handlePullRequestEvent(payload: any) {
  const action = payload.action;
  const pr = payload.pull_request;
  const repo = payload.repository;
  const installationId = payload.installation?.id;
  
  console.log(`[GitHub Webhook] PR ${action}: ${repo.full_name}#${pr.number}`);

  if (action === 'opened' || action === 'synchronize') {
    // Get user ID from installation
    const userId = installationId ? await getUserIdFromInstallation(installationId) : null;
    
    // Trigger quality analysis (with rate limiting)
    try {
      // Analyze PR quality (includes rate limit check)
      const analysisResult = await analyzePRQuality(repo.full_name, pr.number, pr.head.sha, installationId);
      
      // If rate limited, post rate limit comment and return
      if (analysisResult.rateLimited) {
        // Post rate limit comment using PR comment service
        await postPRComment(repo.full_name, pr.number, {
          quality: 0,
          issues: 0,
          recommendations: [],
          issuesList: [],
          rateLimited: true,
          rateLimitMessage: analysisResult.rateLimitMessage || 'Rate limit exceeded'
        });
        return { processed: true, event: 'pull_request', action, rateLimited: true };
      }
      
      // Post PR comment
      await postPRComment(repo.full_name, pr.number, analysisResult);
      
      // Create status check
      await createStatusCheck(repo.full_name, pr.head.sha, analysisResult);
      
      return { processed: true, event: 'pull_request', action, analysisResult };
    } catch (error: any) {
      console.error('[GitHub Webhook] Error processing PR:', error);
      return { processed: false, error: error.message };
    }
  }

  return { processed: true, event: 'pull_request', action };
}

/**
 * Handle push events
 */
async function handlePushEvent(payload: any) {
  const repo = payload.repository;
  const ref = payload.ref;
  
  console.log(`[GitHub Webhook] Push to ${repo.full_name}:${ref}`);

  // Only process pushes to main/master
  if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
    // Update quality badge if enabled
    // This is async and non-blocking
    return { processed: true, event: 'push', ref };
  }

  return { processed: true, event: 'push', ref, skipped: true };
}

/**
 * Handle installation events
 */
async function handleInstallationEvent(payload: any) {
  const action = payload.action;
  const installation = payload.installation;
  const account = payload.installation?.account;
  
  console.log(`[GitHub Webhook] Installation ${action}: ${installation.id}`);

  // Store installation info in database
  // This allows us to track which repos have the app installed
  if (action === 'created') {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Try to find user by GitHub account ID or login
        // Note: This requires user to have linked their GitHub account via OAuth
        let userId = null;
        
        if (account) {
          // Try to find user by GitHub account ID
          const { data: githubUser } = await supabase
            .from('github_installations')
            .select('user_id')
            .eq('account_id', account.id)
            .limit(1)
            .single();
          
          if (githubUser) {
            userId = githubUser.user_id;
          }
        }
        
        // Store installation (even if no user linked yet - can link later)
        await supabase
          .from('github_installations')
          .upsert({
            installation_id: installation.id,
            account_id: account?.id,
            account_type: account?.type,
            account_login: account?.login,
            repository_selection: installation.repository_selection,
            user_id: userId, // Will be null if not linked yet
            installed_at: new Date(installation.created_at || Date.now()).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'installation_id'
          });
        
        console.log(`[GitHub Webhook] Installation stored: ${installation.id}${userId ? ` (linked to user ${userId})` : ' (not linked to user yet)'}`);
      }
    } catch (error: any) {
      console.error('[GitHub Webhook] Error storing installation:', error);
      // Don't throw - installation tracking failure shouldn't break webhook
    }
  }
  
  return { processed: true, event: 'installation', action, installationId: installation.id };
}

/**
 * Handle installation repositories events
 */
async function handleInstallationRepositoriesEvent(payload: any) {
  const action = payload.action;
  const repositories = payload.repositories_added || payload.repositories_removed || [];
  
  console.log(`[GitHub Webhook] Installation repositories ${action}: ${repositories.length} repos`);

  return { processed: true, event: 'installation_repositories', action, count: repositories.length };
}

/**
 * Get user ID from GitHub installation
 */
async function getUserIdFromInstallation(installationId: number): Promise<string | null> {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('github_installations')
      .select('user_id')
      .eq('installation_id', installationId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.user_id;
  } catch (error) {
    console.error('[GitHub Webhook] Error getting user ID:', error);
    return null;
  }
}

/**
 * Check rate limit before analyzing PR
 */
async function checkRateLimit(userId: string | null, actionType: 'analyze_pr' | 'scan_repo' | 'api_call') {
  if (!userId) {
    // If no user ID, allow but don't track (for backwards compatibility)
    return { allowed: true, reason: 'No user ID - allowing for backwards compatibility' };
  }

  try {
    const path = require('path');
    const rateLimiterPath = path.join(process.cwd(), '../../lib/integrations/rateLimiter');
    const { getRateLimiter } = await import(rateLimiterPath);
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { allowed: true, reason: 'Supabase not configured - allowing' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const rateLimiter = getRateLimiter(supabase);
    
    return await rateLimiter.canPerformAction(userId, actionType);
  } catch (error: any) {
    console.error('[GitHub Webhook] Rate limit check error:', error);
    // On error, allow but log
    return { allowed: true, reason: 'Rate limit check failed - allowing' };
  }
}

/**
 * Increment usage after action
 */
async function incrementUsage(userId: string | null, actionType: 'analyze_pr' | 'scan_repo' | 'api_call') {
  if (!userId) {
    return; // Don't track if no user ID
  }

  try {
    const path = require('path');
    const rateLimiterPath = path.join(process.cwd(), '../../lib/integrations/rateLimiter');
    const { getRateLimiter } = await import(rateLimiterPath);
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const rateLimiter = getRateLimiter(supabase);
    
    await rateLimiter.incrementUsage(userId, actionType, 1);
  } catch (error: any) {
    console.error('[GitHub Webhook] Usage increment error:', error);
    // Don't throw - usage tracking failure shouldn't break webhook
  }
}

/**
 * Analyze PR quality
 */
async function analyzePRQuality(repo: string, prNumber: number, sha: string, installationId?: number) {
  // Get user ID from installation
  const userId = installationId ? await getUserIdFromInstallation(installationId) : null;
  
  // Check rate limit
  const rateLimitCheck = await checkRateLimit(userId, 'analyze_pr');
  if (!rateLimitCheck.allowed) {
    console.log(`[GitHub Webhook] Rate limit exceeded for user ${userId}: ${rateLimitCheck.reason}`);
    return {
      quality: 0,
      issues: 0,
      recommendations: [],
      issuesList: [],
      rateLimited: true,
      rateLimitMessage: rateLimitCheck.reason
    };
  }

  // Call existing quality API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
  
  try {
    const response = await fetch(`${baseUrl}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, platform: 'github-app', pr: prNumber, sha })
    });

    if (!response.ok) {
      throw new Error(`Quality API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Increment usage after successful analysis
    await incrementUsage(userId, 'analyze_pr');
    
    return {
      quality: Math.round((data.quality || data.score || 0) * 100),
      issues: data.issues || data.detectedIssues?.length || 0,
      recommendations: data.recommendations || [],
      issuesList: data.detectedIssues || []
    };
  } catch (error: any) {
    console.error('[GitHub Webhook] Quality analysis error:', error);
    // Return default values on error
    return {
      quality: 75,
      issues: 0,
      recommendations: [],
      issuesList: [],
      error: error.message
    };
  }
}

/**
 * Post PR comment
 */
async function postPRComment(repo: string, prNumber: number, analysis: any) {
  try {
    // Use PR Comment Service
    const path = require('path');
    const prCommentServicePath = path.join(process.cwd(), '../../lib/integrations/prCommentService');
    
    // Dynamic require for server-side only
    const { getPRCommentService } = require(prCommentServicePath);
    const prCommentService = getPRCommentService();
    
    const result = await prCommentService.postPRComment(repo, prNumber, analysis);
    console.log(`[GitHub Webhook] PR comment ${result.created ? 'created' : 'updated'}: ${result.commentId}`);
    return result;
  } catch (error: any) {
    console.error(`[GitHub Webhook] Failed to post PR comment: ${error.message}`);
    // Don't throw - webhook should still return 200
    return { posted: false, error: error.message };
  }
}

/**
 * Create status check
 */
async function createStatusCheck(repo: string, sha: string, analysis: any) {
  try {
    // Import Status Check Service using dynamic import (Next.js compatible)
    const path = require('path');
    const statusCheckServicePath = path.join(process.cwd(), '../../lib/integrations/statusCheckService');
    
    // Use dynamic import for server-side modules
    const statusCheckModule = await import(statusCheckServicePath);
    const { getStatusCheckService } = statusCheckModule;
    const statusCheckService = getStatusCheckService();
    
    const result = await statusCheckService.createOrUpdateCheck(repo, sha, analysis);
    console.log(`[GitHub Webhook] Status check ${result.created ? 'created' : 'updated'}: ${result.checkRunId}`);
    return result;
  } catch (error: any) {
    console.error(`[GitHub Webhook] Failed to create status check: ${error.message}`);
    // Don't throw - webhook should still return 200
    return { created: false, error: error.message };
  }
}

/**
 * POST handler for webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[GitHub Webhook] GITHUB_APP_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = request.headers.get('x-hub-signature-256') || 
                      request.headers.get('x-hub-signature');
    const event = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    if (!signature || !event || !deliveryId) {
      console.error('[GitHub Webhook] Missing required headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify signature
    const isValid = verifySignature(body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('[GitHub Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);

    console.log(`[GitHub Webhook] Received ${event} event (delivery: ${deliveryId})`);

    // Process event asynchronously (don't block response)
    processWebhookEvent(event, payload).catch(error => {
      console.error('[GitHub Webhook] Error processing event:', error);
    });

    // Return 200 immediately (GitHub expects quick response)
    return NextResponse.json({ 
      received: true, 
      event,
      deliveryId 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[GitHub Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification (GitHub sends GET to verify endpoint)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'GitHub App webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
