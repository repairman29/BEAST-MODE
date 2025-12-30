# Vercel Integration Guide

BEAST MODE integrates with Vercel to provide automated quality checks before and after deployments.

## Quick Start

### 1. Configure Vercel Webhook

In your Vercel project settings:
1. Go to **Settings** → **Git** → **Deploy Hooks**
2. Add a new webhook pointing to: `https://beastmode.dev/api/ci/vercel/webhook`
3. Select events: `deployment.created`, `deployment.ready`

### 2. Set Environment Variables

In Vercel project settings → **Environment Variables**:

```
BEAST_MODE_API_KEY=your_api_key
BEAST_MODE_QUALITY_THRESHOLD=80
```

### 3. Enable Quality Gates

Add to `vercel.json`:

```json
{
  "buildCommand": "npm run build && beast-mode quality-check",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Features

### Pre-Deployment Checks
- Quality analysis before deployment
- Automatic blocking of low-quality deployments
- Detailed quality reports

### Post-Deployment Monitoring
- Quality tracking after deployment
- Performance monitoring
- Issue detection

### Quality Gates
- Configurable quality thresholds
- Automatic deployment approval/rejection
- Quality trend tracking

## Configuration

### Quality Threshold

Set minimum quality score:

```bash
# In Vercel environment variables
BEAST_MODE_QUALITY_THRESHOLD=80
```

### Webhook Events

Configure which events trigger quality checks:

- `deployment.created` - Check before deployment
- `deployment.ready` - Verify after deployment
- `deployment.error` - Analyze failed deployments

## API Integration

### Webhook Endpoint

Vercel sends deployment events to:

```
POST https://beastmode.dev/api/ci/vercel/webhook
```

### Quality Check Endpoint

Manually trigger quality check:

```bash
curl -X POST https://beastmode.dev/api/ci/vercel \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentId": "dep_xxx",
    "projectId": "proj_xxx",
    "url": "https://your-app.vercel.app"
  }'
```

## Deployment Workflow

1. **Code Push** → Vercel starts deployment
2. **Quality Check** → BEAST MODE analyzes code
3. **Quality Gate** → Deployment approved/rejected
4. **Deployment** → If approved, deployment continues
5. **Post-Deploy** → Quality monitoring begins

## Best Practices

1. **Set Reasonable Thresholds**: Start at 70, increase over time
2. **Monitor Trends**: Track quality over deployments
3. **Fix Issues**: Address quality issues before next deployment
4. **Use Auto-Fix**: Enable automatic fixes when available
5. **Review Reports**: Learn from quality reports

## Troubleshooting

### Quality Check Not Running

- Verify webhook URL is correct
- Check webhook events are enabled
- Review Vercel deployment logs

### Deployment Blocked

- Check quality score threshold
- Review quality report for issues
- Fix issues and redeploy

### Webhook Errors

- Verify API key is set correctly
- Check webhook signature validation
- Review error logs

## Support

For issues or questions:
- GitHub Issues: [BEAST MODE Issues](https://github.com/repairman29/BEAST-MODE/issues)
- Documentation: [docs.beastmode.dev](https://docs.beastmode.dev)
- Discord: [BEAST MODE Community](https://discord.gg/beastmode)

