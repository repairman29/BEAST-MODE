/**
 * BEAST MODE Predictive Analytics
 * 
 * Forecast future issues, risk prediction models, and trend analysis
 */

class PredictiveAnalytics {
  constructor(options = {}) {
    this.options = {
      predictionHorizon: options.predictionHorizon || 30, // days
      useML: options.useML !== false,
      ...options
    };
    this.historicalData = [];
  }

  /**
   * Predict future quality issues
   */
  async predictQualityIssues(historicalData, currentState) {
    const trends = this.analyzeTrends(historicalData);
    const risks = this.identifyRisks(currentState, trends);
    const predictions = this.generatePredictions(trends, risks);

    return {
      predictions: predictions,
      confidence: this.calculateConfidence(trends, historicalData.length),
      riskFactors: risks,
      trends: trends,
      horizon: this.options.predictionHorizon,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze quality trends
   */
  analyzeTrends(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        volatility: 0
      };
    }

    const scores = historicalData.map(d => d.score || d.qualityScore || 0);
    const recent = scores.slice(-7); // Last 7 data points
    const older = scores.slice(0, -7);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((a, b) => a + b, 0) / older.length 
      : recentAvg;

    const direction = recentAvg > olderAvg ? 'improving' : 
                     recentAvg < olderAvg ? 'declining' : 'stable';
    
    const rate = recentAvg - olderAvg;
    
    // Calculate volatility (standard deviation)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    return {
      direction,
      rate: Math.abs(rate),
      volatility,
      currentScore: recentAvg,
      projectedScore: this.projectScore(recentAvg, rate, this.options.predictionHorizon)
    };
  }

  /**
   * Project future score
   */
  projectScore(currentScore, rate, days) {
    // Simple linear projection
    const dailyRate = rate / 7; // Rate per day
    const projected = currentScore + (dailyRate * days);
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, projected));
  }

  /**
   * Identify risk factors
   */
  identifyRisks(currentState, trends) {
    const risks = [];

    // Quality score risk
    if (currentState.score < 70) {
      risks.push({
        type: 'low_quality',
        severity: 'high',
        description: 'Current quality score is below recommended threshold',
        impact: 'Increased likelihood of bugs and technical debt'
      });
    }

    // Declining trend risk
    if (trends.direction === 'declining' && trends.rate > 2) {
      risks.push({
        type: 'declining_trend',
        severity: 'medium',
        description: 'Quality is declining at a significant rate',
        impact: 'May reach critical levels if not addressed'
      });
    }

    // High volatility risk
    if (trends.volatility > 10) {
      risks.push({
        type: 'high_volatility',
        severity: 'medium',
        description: 'Quality scores are highly variable',
        impact: 'Unpredictable quality may indicate process issues'
      });
    }

    // Issue accumulation risk
    if (currentState.issues && currentState.issues.length > 20) {
      risks.push({
        type: 'issue_accumulation',
        severity: 'high',
        description: 'Large number of open issues',
        impact: 'Technical debt is accumulating rapidly'
      });
    }

    // No testing risk
    if (currentState.testCoverage !== undefined && currentState.testCoverage < 50) {
      risks.push({
        type: 'low_test_coverage',
        severity: 'medium',
        description: 'Test coverage is below recommended threshold',
        impact: 'Higher risk of regressions and bugs'
      });
    }

    return risks;
  }

  /**
   * Generate predictions
   */
  generatePredictions(trends, risks) {
    const predictions = [];

    // Quality score prediction
    predictions.push({
      type: 'quality_score',
      current: trends.currentScore,
      predicted: trends.projectedScore,
      confidence: this.calculatePredictionConfidence(trends),
      timeframe: `${this.options.predictionHorizon} days`,
      factors: ['historical_trend', 'current_state']
    });

    // Issue prediction
    if (trends.direction === 'declining') {
      predictions.push({
        type: 'issue_count',
        predicted: 'increase',
        confidence: 0.7,
        timeframe: `${this.options.predictionHorizon} days`,
        factors: ['declining_quality', 'trend_analysis']
      });
    }

    // Risk predictions
    risks.forEach(risk => {
      if (risk.severity === 'high') {
        predictions.push({
          type: 'risk_event',
          predicted: risk.type,
          confidence: 0.8,
          timeframe: 'near_term',
          description: risk.description,
          impact: risk.impact
        });
      }
    });

    return predictions;
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(trends) {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (this.historicalData.length > 30) {
      confidence += 0.2;
    } else if (this.historicalData.length > 14) {
      confidence += 0.1;
    }

    // Lower volatility = higher confidence
    if (trends.volatility < 5) {
      confidence += 0.2;
    } else if (trends.volatility < 10) {
      confidence += 0.1;
    }

    // Clear trend = higher confidence
    if (Math.abs(trends.rate) > 1) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Analyze risk patterns
   */
  analyzeRiskPatterns(historicalData) {
    const patterns = {
      recurringIssues: [],
      seasonalTrends: {},
      correlationFactors: {}
    };

    // Detect recurring issues
    const issueTypes = {};
    historicalData.forEach(data => {
      if (data.issues) {
        data.issues.forEach(issue => {
          issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
        });
      }
    });

    patterns.recurringIssues = Object.entries(issueTypes)
      .filter(([_, count]) => count > 3)
      .map(([type, count]) => ({ type, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);

    return patterns;
  }

  /**
   * Generate risk assessment report
   */
  async generateRiskAssessment(currentState, historicalData) {
    const trends = this.analyzeTrends(historicalData);
    const risks = this.identifyRisks(currentState, trends);
    const patterns = this.analyzeRiskPatterns(historicalData);
    const predictions = await this.predictQualityIssues(historicalData, currentState);

    return {
      overallRisk: this.calculateOverallRisk(risks),
      risks: risks,
      trends: trends,
      patterns: patterns,
      predictions: predictions.predictions,
      recommendations: this.generateRiskRecommendations(risks, trends),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRisk(risks) {
    if (risks.length === 0) return 'low';

    const highRisks = risks.filter(r => r.severity === 'high').length;
    const mediumRisks = risks.filter(r => r.severity === 'medium').length;

    if (highRisks > 2) return 'critical';
    if (highRisks > 0) return 'high';
    if (mediumRisks > 3) return 'medium';
    return 'low';
  }

  /**
   * Generate risk mitigation recommendations
   */
  generateRiskRecommendations(risks, trends) {
    const recommendations = [];

    if (trends.direction === 'declining') {
      recommendations.push({
        priority: 'high',
        action: 'Address quality decline immediately',
        steps: [
          'Review recent code changes',
          'Identify root causes of decline',
          'Implement quality gates',
          'Increase code review rigor'
        ]
      });
    }

    risks.forEach(risk => {
      if (risk.severity === 'high') {
        recommendations.push({
          priority: 'high',
          action: `Mitigate ${risk.type} risk`,
          description: risk.description,
          steps: this.getMitigationSteps(risk.type)
        });
      }
    });

    return recommendations;
  }

  /**
   * Get mitigation steps for risk type
   */
  getMitigationSteps(riskType) {
    const steps = {
      low_quality: [
        'Run comprehensive quality analysis',
        'Identify top issues',
        'Create improvement plan',
        'Set quality goals'
      ],
      declining_trend: [
        'Review recent changes',
        'Identify contributing factors',
        'Implement preventive measures',
        'Monitor closely'
      ],
      issue_accumulation: [
        'Prioritize issue backlog',
        'Allocate time for fixes',
        'Prevent new issues',
        'Track resolution progress'
      ],
      low_test_coverage: [
        'Identify critical paths',
        'Write tests for high-risk areas',
        'Set coverage goals',
        'Integrate coverage checks'
      ]
    };

    return steps[riskType] || ['Review and address the identified risk'];
  }
}

module.exports = PredictiveAnalytics;

