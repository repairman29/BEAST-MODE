/**
 * Vibe API 🎸
 * REST API for code quality insights
 * Built for vibe coders who want quality via API
 */

const express = require('express');
const cors = require('cors');
const { BeastMode } = require('@beast-mode/core');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize BEAST MODE
let beastMode;
(async () => {
  beastMode = new BeastMode();
  await beastMode.initialize();
  console.log('🎸 Vibe API ready!');
})();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vibe API', version: '1.0.0' });
});

// Analyze code quality
app.post('/api/analyze', async (req, res) => {
  try {
    const { repo, code } = req.body;

    if (!beastMode) {
      return res.status(503).json({ error: 'BEAST MODE not initialized' });
    }

    const quality = await beastMode.getQualityScore({ detailed: true });

    res.json({
      success: true,
      score: quality.overall,
      grade: quality.overall >= 90 ? 'A+' : quality.overall >= 80 ? 'A' : quality.overall >= 70 ? 'B' : 'C',
      recommendations: quality.recommendations || [],
      breakdown: quality.breakdown || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quality score
app.get('/api/score/:repo?', async (req, res) => {
  try {
    if (!beastMode) {
      return res.status(503).json({ error: 'BEAST MODE not initialized' });
    }

    const quality = await beastMode.getQualityScore();
    const score = quality.overall || 0;

    res.json({
      success: true,
      score,
      grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F',
      vibe: score >= 80 ? '🔥 FIRE' : score >= 60 ? '✨ SOLID' : '🚀 GROWING'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations
app.get('/api/recommendations/:repo?', async (req, res) => {
  try {
    if (!beastMode) {
      return res.status(503).json({ error: 'BEAST MODE not initialized' });
    }

    const quality = await beastMode.getQualityScore({ detailed: true });

    res.json({
      success: true,
      recommendations: quality.recommendations || [],
      count: (quality.recommendations || []).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    res.json({
      success: true,
      analytics: {
        totalRequests: 0, // TODO: Implement tracking
        averageScore: 0,
        topRecommendations: []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎸 Vibe API running on http://localhost:${PORT}`);
  console.log(`📚 Docs: http://localhost:${PORT}/health`);
});

