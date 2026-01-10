# Third-Party Integrations Guide

BEAST MODE integrates with popular communication and collaboration tools to keep your team informed about quality, missions, and system status.

## Supported Integrations

- ✅ **Slack** - Quality alerts, mission notifications, team updates
- ✅ **Discord** - Community notifications, plugin updates, system status
- ✅ **Email** - Weekly reports, critical alerts, plugin summaries

---

## Slack Integration

### Setup

1. **Create Slack Webhook**:
   - Go to your Slack workspace settings
   - Navigate to Apps → Incoming Webhooks
   - Create a new webhook
   - Copy the webhook URL

2. **Configure BEAST MODE**:
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export SLACK_CHANNEL="#beast-mode"
```

3. **Test Connection**:
```javascript
const SlackIntegration = require('@beast-mode/core/integrations/slack');
const slack = new SlackIntegration();
await slack.testConnection();
```

### Features

- **Quality Alerts**: Get notified when quality scores drop
- **Mission Notifications**: Track mission status and updates
- **Team Updates**: Receive team performance metrics

### Usage

```javascript
const SlackIntegration = require('@beast-mode/core/integrations/slack');
const slack = new SlackIntegration({
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  channel: '#beast-mode'
});

// Send quality alert
await slack.sendQualityAlert({
  score: 85,
  issues: [
    { type: 'security', message: 'Potential XSS vulnerability' }
  ],
  recommendations: ['Use input sanitization']
});

// Send mission notification
await slack.sendMissionNotification({
  id: 'mission-123',
  title: 'Improve code quality',
  status: 'active',
  priority: 'high',
  assignee: '@developer'
});
```

---

## Discord Integration

### Setup

1. **Create Discord Webhook**:
   - Go to your Discord server settings
   - Navigate to Integrations → Webhooks
   - Create a new webhook
   - Copy the webhook URL

2. **Configure BEAST MODE**:
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

3. **Test Connection**:
```javascript
const DiscordIntegration = require('@beast-mode/core/integrations/discord');
const discord = new DiscordIntegration();
await discord.testConnection();
```

### Features

- **Community Notifications**: Share updates with your community
- **Plugin Updates**: Notify when new plugin versions are available
- **System Status**: Monitor system health and status

### Usage

```javascript
const DiscordIntegration = require('@beast-mode/core/integrations/discord');
const discord = new DiscordIntegration({
  webhookUrl: process.env.DISCORD_WEBHOOK_URL
});

// Send community notification
await discord.sendCommunityNotification({
  title: 'New Feature Released',
  message: 'BEAST MODE v2.0 is now available!',
  type: 'success'
});

// Send plugin update
await discord.sendPluginUpdate({
  pluginName: 'ESLint Pro',
  version: '2.0.0',
  changelog: 'Added new rules and improved performance'
});
```

---

## Email Integration

### Setup

1. **Choose Email Provider**:
   - SMTP (Gmail, Outlook, etc.)
   - SendGrid
   - Resend

2. **Configure BEAST MODE**:

**SMTP**:
```bash
export EMAIL_PROVIDER="smtp"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
export EMAIL_FROM="noreply@beast-mode.dev"
```

**SendGrid**:
```bash
export EMAIL_PROVIDER="sendgrid"
export SENDGRID_API_KEY="your-sendgrid-api-key"
export EMAIL_FROM="noreply@beast-mode.dev"
```

**Resend**:
```bash
export EMAIL_PROVIDER="resend"
export RESEND_API_KEY="your-resend-api-key"
export EMAIL_FROM="noreply@beast-mode.dev"
```

### Features

- **Weekly Reports**: Get comprehensive quality reports every week
- **Critical Alerts**: Immediate notifications for critical issues
- **Plugin Summaries**: Stay updated on available plugin updates

### Usage

```javascript
const EmailIntegration = require('@beast-mode/core/integrations/email');
const email = new EmailIntegration({
  provider: 'sendgrid',
  from: 'noreply@beast-mode.dev'
});

// Send weekly report
await email.sendWeeklyReport('developer@example.com', {
  score: 85,
  trends: { up: 5, down: 2 },
  topIssues: [
    { type: 'security', message: 'Potential vulnerability' }
  ],
  recommendations: ['Review security practices']
});

// Send critical alert
await email.sendCriticalAlert('developer@example.com', {
  issue: {
    type: 'security',
    message: 'Critical vulnerability detected'
  },
  severity: 'critical',
  impact: 'High - Immediate action required'
});
```

---

## CLI Commands

### Setup Integration
```bash
beast-mode integrations setup slack
beast-mode integrations setup discord
beast-mode integrations setup email
```

### Test Integration
```bash
beast-mode integrations test slack
beast-mode integrations test discord
beast-mode integrations test email
```

### Send Test Notification
```bash
beast-mode integrations test slack --message "Test notification"
beast-mode integrations test discord --message "Test notification"
```

---

## Best Practices

1. **Use Appropriate Channels**:
   - Critical alerts → Direct messages or urgent channels
   - Weekly reports → Dedicated reports channel
   - Updates → General channels

2. **Configure Thresholds**:
   - Only send alerts for significant changes
   - Avoid notification fatigue
   - Use digest mode for frequent updates

3. **Secure Credentials**:
   - Never commit webhook URLs or API keys
   - Use environment variables
   - Rotate credentials regularly

4. **Monitor Usage**:
   - Track notification volume
   - Review delivery rates
   - Optimize message frequency

---

## Troubleshooting

### Slack

**Issue**: Notifications not appearing
- Verify webhook URL is correct
- Check channel permissions
- Ensure webhook is not disabled

**Issue**: Formatting issues
- Review Slack message format
- Check attachment structure
- Verify emoji usage

### Discord

**Issue**: Webhook not working
- Verify webhook URL is valid
- Check server permissions
- Ensure webhook is enabled

**Issue**: Embeds not displaying
- Review embed structure
- Check field limits (25 fields max)
- Verify color values (0-16777215)

### Email

**Issue**: Emails not sending
- Verify SMTP credentials
- Check API key validity
- Review provider limits

**Issue**: Emails going to spam
- Configure SPF/DKIM records
- Use verified sender domain
- Review email content

---

## Support

- 📚 [Documentation](https://beast-mode.dev/docs)
- 💬 [Discord](https://discord.gg/beastmode)
- 🐛 [GitHub Issues](https://github.com/repairman29/BEAST-MODE/issues)

---

*Powered by [BEAST MODE](https://beast-mode.dev) - AI-Powered Development Tools*

