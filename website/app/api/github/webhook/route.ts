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
  
  console.log(`[GitHub Webhook] PR ${action}: ${repo.full_name}#${pr.number}`);

  if (action === 'opened' || action === 'synchronize') {
    // Trigger quality analysis
    try {
      // Queue quality analysis (async processing)
      const analysisResult = await analyzePRQuality(repo.full_name, pr.number, pr.head.sha);
      
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
  
  console.log(`[GitHub Webhook] Installation ${action}: ${installation.id}`);

  // Store installation info in database
  // This allows us to track which repos have the app installed
  
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
 * Analyze PR quality
 */
async function analyzePRQuality(repo: string, prNumber: number, sha: string) {
  // Call existing quality API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
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
    // eslint-disable-next-line no-eval
    const { getPRCommentService } = // SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval('require')(prCommentServicePath);
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
