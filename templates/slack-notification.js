/**
 * Slack Notification Template
 * 
 * Send quality updates to Slack
 * 
 * Usage:
 * 1. Set SLACK_WEBHOOK_URL environment variable
 * 2. Call this function after quality checks
 */

export async function sendQualityToSlack({
  repo,
  quality,
  qualityPercent,
  recommendations = [],
  predictionId,
  webhookUrl = process.env.SLACK_WEBHOOK_URL
}) {
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping Slack notification');
    return;
  }

  const color = qualityPercent >= 80 ? 'good' : qualityPercent >= 60 ? 'warning' : 'danger';
  
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Quality Check: ${repo}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Quality Score:*\n${qualityPercent}%`
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${qualityPercent >= 80 ? '✅ Excellent' : qualityPercent >= 60 ? '⚠️ Good' : '❌ Needs Improvement'}`
        }
      ]
    }
  ];

  if (recommendations.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Top Recommendations:*\n${recommendations.slice(0, 3).map((rec, idx) => `${idx + 1}. ${rec.action}`).join('\n')}`
      }
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Full Report'
        },
        url: `https://beast-mode.com/quality?repo=${encodeURIComponent(repo)}`
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Provide Feedback'
        },
        url: `https://beast-mode.com/feedback?predictionId=${predictionId}`
      }
    ]
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks,
        attachments: [{
          color
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return { success: false, error: error.message };
  }
}

// Example usage
export async function checkQualityAndNotify(repo) {
  const qualityResponse = await fetch(
    `${process.env.BEAST_MODE_API || 'https://beast-mode.com'}/api/repos/quality`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, platform: 'slack-notification' })
    }
  );

  const qualityData = await qualityResponse.json();

  await sendQualityToSlack({
    repo,
    quality: qualityData.quality,
    qualityPercent: Math.round(qualityData.quality * 100),
    recommendations: qualityData.recommendations || [],
    predictionId: qualityData.predictionId
  });

  return qualityData;
}
