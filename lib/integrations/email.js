/**
 * BEAST MODE Email Integration
 * 
 * Provides utilities for sending email notifications
 */

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

class EmailIntegration {
  constructor(options = {}) {
    this.provider = options.provider || getConfigValue('EMAIL_PROVIDER', 'smtp');
    this.from = options.from || getConfigValue('EMAIL_FROM', 'noreply@beastmode.dev');
    this.config = {
      smtp: {
        host: options.smtpHost || getConfigValue('SMTP_HOST'),
        port: options.smtpPort || getConfigValue('SMTP_PORT', 587),
        secure: options.smtpSecure !== false,
        auth: {
          user: options.smtpUser || getConfigValue('SMTP_USER'),
          pass: options.smtpPass || getConfigValue('SMTP_PASS')
        }
      },
      sendgrid: {
        apiKey: options.sendgridKey || getConfigValue('SENDGRID_API_KEY')
      },
      resend: {
        apiKey: options.resendKey || getConfigValue('RESEND_API_KEY')
      }
    };
  }

  /**
   * Send weekly quality report
   */
  async sendWeeklyReport(recipient, reportData) {
    const { score, trends, topIssues, recommendations } = reportData;
    
    const subject = `📊 BEAST MODE Weekly Quality Report - Score: ${score}/100`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .score { font-size: 48px; font-weight: bold; color: ${score >= 80 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'}; }
          .section { margin: 20px 0; }
          .issue { background: white; padding: 10px; margin: 5px 0; border-left: 3px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 BEAST MODE Weekly Quality Report</h1>
            <p>Your code quality intelligence for the week</p>
          </div>
          <div class="content">
            <div class="section">
              <h2>Quality Score</h2>
              <div class="score">${score}/100</div>
              <p>${score >= 80 ? 'Excellent work! Your code quality is high.' : score >= 70 ? 'Good quality, but there\'s room for improvement.' : 'Quality needs attention. Review the issues below.'}</p>
            </div>
            
            ${topIssues && topIssues.length > 0 ? `
            <div class="section">
              <h2>Top Issues</h2>
              ${topIssues.slice(0, 5).map(issue => `
                <div class="issue">
                  <strong>${issue.type}</strong>: ${issue.message}
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            ${recommendations && recommendations.length > 0 ? `
            <div class="section">
              <h2>Recommendations</h2>
              <ul>
                ${recommendations.slice(0, 5).map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Powered by <a href="https://beastmode.dev">BEAST MODE</a> - AI-Powered Development Tools</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipient,
      subject: subject,
      html: html
    });
  }

  /**
   * Send critical issue alert
   */
  async sendCriticalAlert(recipient, alert) {
    const { issue, severity, impact } = alert;
    
    const subject = `🚨 BEAST MODE Critical Alert: ${issue.type}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; }
          .alert-title { color: #dc2626; font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <div class="alert-title">🚨 Critical Issue Detected</div>
            <p><strong>Type:</strong> ${issue.type}</p>
            <p><strong>Message:</strong> ${issue.message}</p>
            <p><strong>Severity:</strong> ${severity}</p>
            <p><strong>Impact:</strong> ${impact}</p>
            <p>Please review and address this issue as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipient,
      subject: subject,
      html: html
    });
  }

  /**
   * Send plugin update summary
   */
  async sendPluginUpdateSummary(recipient, updates) {
    const subject = `🔄 BEAST MODE Plugin Updates Available (${updates.length})`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .update { background: white; padding: 15px; margin: 10px 0; border-left: 3px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔄 Plugin Updates Available</h1>
          <p>You have ${updates.length} plugin update${updates.length !== 1 ? 's' : ''} available:</p>
          ${updates.map(update => `
            <div class="update">
              <h3>${update.pluginName}</h3>
              <p><strong>Current:</strong> ${update.currentVersion} → <strong>Latest:</strong> ${update.latestVersion}</p>
              ${update.changelog ? `<p>${update.changelog.substring(0, 200)}...</p>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipient,
      subject: subject,
      html: html
    });
  }

  /**
   * Send email
   */
  async sendEmail(options) {
    const { to, subject, html, text } = options;

    try {
      if (this.provider === 'sendgrid') {
        return this.sendViaSendGrid({ to, subject, html, text });
      } else if (this.provider === 'resend') {
        return this.sendViaResend({ to, subject, html, text });
      } else {
        return this.sendViaSMTP({ to, subject, html, text });
      }
    } catch (error) {
      console.error('Email integration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via SMTP
   */
  async sendViaSMTP(options) {
    // This would use nodemailer or similar
    // For now, return a placeholder
    console.log('SMTP email would be sent:', options);
    return { success: true, method: 'smtp' };
  }

  /**
   * Send via SendGrid
   */
  async sendViaSendGrid(options) {
    if (!this.config.sendgrid.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    // This would use SendGrid SDK
    console.log('SendGrid email would be sent:', options);
    return { success: true, method: 'sendgrid' };
  }

  /**
   * Send via Resend
   */
  async sendViaResend(options) {
    if (!this.config.resend.apiKey) {
      throw new Error('Resend API key not configured');
    }

    // This would use Resend SDK
    console.log('Resend email would be sent:', options);
    return { success: true, method: 'resend' };
  }
}

module.exports = EmailIntegration;

