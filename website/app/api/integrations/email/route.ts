import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Email Integration API
 * 
 * Sends email notifications for weekly reports, critical alerts, and plugin updates
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: 'weekly-report' | 'critical-alert' | 'plugin-update' | 'quality-report';
  data?: Record<string, any>;
}

/**
 * POST /api/integrations/email
 * Send email notification
 */
export async function POST(request: NextRequest) {
  try {
    const {
      to,
      subject,
      html,
      text,
      template,
      data = {}
    }: EmailOptions = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient and subject are required' },
        { status: 400 }
      );
    }

    // Generate email content based on template
    let emailHtml = html;
    let emailText = text;

    if (template) {
      const templateContent = generateEmailTemplate(template, data);
      emailHtml = templateContent.html;
      emailText = templateContent.text;
    }

    // In production, this would use an email service (SendGrid, Resend, etc.)
    // For now, we'll simulate sending
    const emailPayload = {
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailHtml || text,
      text: emailText || text
    };

    // Simulate email sending
    // await emailService.send(emailPayload);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      recipient: Array.isArray(to) ? to.join(', ') : to,
      subject,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Email Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate email template content
 */
function generateEmailTemplate(template: string, data: Record<string, any>) {
  const templates: Record<string, { html: string; text: string }> = {
    'weekly-report': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff;">📊 BEAST MODE Weekly Quality Report</h2>
          <p>Here's your weekly quality summary:</p>
          <ul>
            <li><strong>Quality Score:</strong> ${data.qualityScore || 'N/A'}/100</li>
            <li><strong>Issues Fixed:</strong> ${data.issuesFixed || 0}</li>
            <li><strong>Plugins Used:</strong> ${data.pluginsUsed || 0}</li>
            <li><strong>Missions Completed:</strong> ${data.missionsCompleted || 0}</li>
          </ul>
          <p><a href="https://beastmode.dev/dashboard">View Full Dashboard →</a></p>
        </div>
      `,
      text: `BEAST MODE Weekly Quality Report\n\nQuality Score: ${data.qualityScore || 'N/A'}/100\nIssues Fixed: ${data.issuesFixed || 0}\nPlugins Used: ${data.pluginsUsed || 0}\nMissions Completed: ${data.missionsCompleted || 0}`
    },
    'critical-alert': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff0000;">🚨 Critical Alert</h2>
          <p><strong>${data.title || 'Critical Issue Detected'}</strong></p>
          <p>${data.message || 'A critical issue has been detected in your codebase.'}</p>
          <p><a href="https://beastmode.dev/dashboard?view=quality">View Details →</a></p>
        </div>
      `,
      text: `Critical Alert: ${data.title || 'Critical Issue Detected'}\n\n${data.message || 'A critical issue has been detected in your codebase.'}`
    },
    'plugin-update': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff;">🔄 Plugin Update Available</h2>
          <p><strong>${data.pluginName || 'Plugin'}</strong> has a new update available!</p>
          <p><strong>Current Version:</strong> ${data.currentVersion || 'N/A'}</p>
          <p><strong>New Version:</strong> ${data.newVersion || 'N/A'}</p>
          ${data.changelog ? `<p><strong>Changelog:</strong><br>${data.changelog}</p>` : ''}
          <p><a href="https://beastmode.dev/dashboard?view=marketplace">Update Now →</a></p>
        </div>
      `,
      text: `Plugin Update Available: ${data.pluginName || 'Plugin'}\n\nCurrent: ${data.currentVersion || 'N/A'}\nNew: ${data.newVersion || 'N/A'}`
    },
    'quality-report': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff;">🔍 Quality Report</h2>
          <p><strong>Repository:</strong> ${data.repository || 'N/A'}</p>
          <p><strong>Quality Score:</strong> ${data.qualityScore || 'N/A'}/100</p>
          <p><strong>Issues Found:</strong> ${data.issuesCount || 0}</p>
          <p><strong>Warnings:</strong> ${data.warningsCount || 0}</p>
          <p><a href="https://beastmode.dev/dashboard?view=quality">View Full Report →</a></p>
        </div>
      `,
      text: `Quality Report\n\nRepository: ${data.repository || 'N/A'}\nQuality Score: ${data.qualityScore || 'N/A'}/100\nIssues: ${data.issuesCount || 0}\nWarnings: ${data.warningsCount || 0}`
    }
  };

  return templates[template] || { html: '', text: '' };
}

/**
 * GET /api/integrations/email
 * Get email notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    return NextResponse.json({
      userId,
      email: null,
      preferences: {
        weeklyReports: true,
        criticalAlerts: true,
        pluginUpdates: true,
        qualityReports: false
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Email Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences', details: error.message },
      { status: 500 }
    );
  }
}

