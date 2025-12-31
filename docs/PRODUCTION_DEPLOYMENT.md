# Production Deployment Guide
## ML Model Deployment & Monitoring

### 🚀 Quick Start

#### Deploy Model to Production

```bash
# Deploy with 100% traffic
npm run deploy:model .beast-mode/models/quality-predictor-v3-advanced.json --version v3.0

# Deploy with A/B testing (10% traffic to new model)
npm run deploy:model .beast-mode/models/quality-predictor-v3-advanced.json \
  --version v3.0 \
  --traffic 10 \
  --ab-test retrain-v3

# Check deployment status
npm run deploy:model --status

# Rollback to previous version
npm run deploy:model --rollback

# Promote A/B test winner
npm run deploy:model --promote retrain-v3
```

### 📊 Monitoring

#### Check Model Health

```bash
# View monitoring dashboard
npm run ml:dashboard

# Check monitoring status
npm run monitor:status
```

#### Metrics Tracked

- **Accuracy**: Percentage of predictions within ±5 points
- **MAE**: Mean Absolute Error
- **Latency**: Prediction time in milliseconds
- **Error Rate**: Percentage of failed predictions
- **Model Drift**: Detection of performance degradation

### 🔄 Automated Retraining

#### Setup Automated Retraining

```bash
# Check if retraining is needed
npm run retrain:auto --check

# Run retraining (if conditions met)
npm run retrain:auto

# Force retraining
npm run retrain:auto --force

# Force retraining with auto-deploy
npm run retrain:auto --force --deploy
```

#### Retraining Triggers

1. **Time-based**: Every 7 days
2. **Data-based**: 100+ new samples accumulated
3. **Performance-based**: Model health is critical

### 🧪 A/B Testing

#### Create A/B Test

```bash
# Deploy with A/B testing
npm run deploy:model <model-path> \
  --version v3.1 \
  --traffic 20 \
  --ab-test v3-vs-v3.1
```

#### Monitor A/B Test

```bash
# Check A/B test results
npm run deploy:model --status
```

#### Promote Winner

```bash
# Promote A/B test winner to 100% traffic
npm run deploy:model --promote v3-vs-v3.1
```

### 📈 Model Versioning

#### Version Naming Convention

- `v1.0` - Baseline model
- `v1-enhanced` - Enhanced features model
- `v3-advanced` - Advanced XGBoost model
- `v3.1` - Incremental improvements
- `ab-winner-<experiment>` - A/B test winner

#### Deployment History

All deployments are tracked in `.beast-mode/deployments/history.json`

### 🚨 Alerts & Monitoring

#### Alert Thresholds

- **Accuracy**: < 75% (alert), < 80% (min)
- **Latency**: > 200ms (alert), > 100ms (max)
- **Error Rate**: > 5% (alert), > 1% (max)
- **Model Drift**: > 10% magnitude

#### Alert Types

- **Critical**: Accuracy below threshold, high error rate
- **Warning**: Latency above threshold, model drift detected

### 🔧 Configuration

#### Model Monitoring Config

Edit `lib/mlops/modelMonitoring.js` to adjust thresholds:

```javascript
this.thresholds = {
    accuracy: { min: 0.80, alert: 0.75 },
    latency: { max: 100, alert: 200 },
    errorRate: { max: 0.01, alert: 0.05 },
    drift: { threshold: 0.1 }
};
```

#### Auto-Retrain Config

Edit `scripts/auto-retrain.js` to adjust retraining settings:

```javascript
this.config = {
    minNewSamples: 100,
    retrainInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
    minAccuracyImprovement: 0.01,
    autoDeploy: false
};
```

### 📋 Deployment Checklist

Before deploying to production:

- [ ] Model trained and validated
- [ ] Tested on validation set
- [ ] Performance metrics acceptable
- [ ] A/B test configured (if needed)
- [ ] Monitoring enabled
- [ ] Rollback plan ready
- [ ] Documentation updated

### 🔄 Rollback Procedure

#### Automatic Rollback

If model health becomes critical, manually rollback:

```bash
npm run deploy:model --rollback
```

#### Rollback to Specific Version

```bash
npm run deploy:model --rollback v3.0
```

### 📊 Production Metrics

#### Key Metrics to Monitor

1. **Prediction Accuracy**: Should be > 85%
2. **Mean Absolute Error**: Should be < 3.0
3. **Prediction Latency**: Should be < 100ms
4. **Error Rate**: Should be < 1%
5. **Model Drift**: Should be < 10%

#### Dashboard Access

```bash
# Local dashboard
npm run ml:dashboard

# MLflow UI (if server running)
npm run mlflow:start
# Then visit http://localhost:5000
```

### 🛠️ Troubleshooting

#### Model Not Loading

```bash
# Check model file exists
ls -la .beast-mode/models/

# Check model integration
npm run ml:status
```

#### Poor Performance

1. Check monitoring status: `npm run monitor:status`
2. Review recent predictions
3. Check for model drift
4. Consider retraining: `npm run retrain:auto --force`

#### A/B Test Not Working

1. Verify experiment exists: `npm run deploy:model --status`
2. Check traffic allocation
3. Verify model paths are correct

### 📚 Related Documentation

- `WEEK3_PROGRESS.md` - Advanced model training
- `WEEK3_SUMMARY.md` - Model performance summary
- `ML_INTEGRATION_GUIDE.md` - Integration details
- `QUICK_START_ML.md` - Quick start guide

---

**Last Updated**: Week 4 - Production Deployment

