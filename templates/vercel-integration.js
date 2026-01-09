/**
 * Vercel Integration Template
 * 
 * Add quality monitoring to your Vercel deployments
 * 
 * Usage:
 * 1. Add this to your Vercel project
 * 2. Set BEAST_MODE_API environment variable
 * 3. Quality checks run automatically on deploy
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repo, deploymentUrl, environment } = req.body;

  if (!repo) {
    return res.status(400).json({ error: 'Repository name required' });
  }

  try {
    // Get quality score
    const qualityResponse = await fetch(
      `${process.env.BEAST_MODE_API || 'https://beast-mode.com'}/api/repos/quality`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          platform: 'vercel',
          context: {
            deploymentUrl,
            environment
          }
        })
      }
    );

    if (!qualityResponse.ok) {
      throw new Error('Quality API failed');
    }

    const qualityData = await qualityResponse.json();

    // Send notification if quality is low
    if (qualityData.quality < 0.6) {
      // Optional: Send to Slack, Discord, etc.
      console.warn(`⚠️ Low quality score: ${(qualityData.quality * 100).toFixed(1)}%`);
    }

    return res.status(200).json({
      success: true,
      quality: qualityData.quality,
      qualityPercent: Math.round(qualityData.quality * 100),
      predictionId: qualityData.predictionId,
      recommendations: qualityData.recommendations?.slice(0, 3) || []
    });
  } catch (error) {
    console.error('Quality check failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
