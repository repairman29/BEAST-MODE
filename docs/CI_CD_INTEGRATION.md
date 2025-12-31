# CI/CD Integration Guide

BEAST MODE integrates seamlessly with popular CI/CD platforms to provide automated quality checks, PR gates, and deployment monitoring.

## Supported Platforms

- ✅ **GitHub Actions** - Automated quality checks and PR comments
- ✅ **Vercel** - Pre-deployment validation and post-deployment monitoring
- ✅ **Railway** - Health checks and scaling recommendations

---

## GitHub Actions Integration

### Quick Start

1. **Add workflow file** to `.github/workflows/beast-mode-quality-check.yml`:

```yaml
name: BEAST MODE Quality Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx @beast-mode/core quality --min-score 80
```

2. **Install BEAST MODE CLI**:
```bash
npm install -g @beast-mode/core
```

3. **Configure quality threshold**:
```bash
npx @beast-mode/core config --min-score 80
```

### Features

- **Automated Quality Checks**: Runs on every PR and push
- **PR Comments**: Automatically posts quality reports to PRs
- **Quality Gates**: Blocks merges if quality score is too low
- **Detailed Reports**: Shows issues, recommendations, and score breakdown

### Advanced Configuration

```yaml
- name: Run BEAST MODE Analysis
  run: |
    npx @beast-mode/core analyze \
      --pr \
      --format json \
      --min-score 80 \
      --fail-on-low-score
```

---

## Vercel Integration

### Setup

1. **Add to `vercel.json`**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "ignoreCommand": "npx @beast-mode/core quality --check"
}
```

2. **Add pre-deployment check** to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "npm run build && npx @beast-mode/core quality --check"
  }
}
```

3. **Configure in Vercel Dashboard**:
   - Go to Project Settings → Build & Development Settings
   - Set Build Command: `npm run vercel-build`
   - Enable "Run Quality Checks Before Deploy"

### Features

- **Pre-Deployment Validation**: Checks code quality before deployment
- **Post-Deployment Monitoring**: Monitors deployment health
- **Environment-Specific Checks**: Different thresholds for preview/production

### Environment Variables

```bash
BEAST_MODE_MIN_SCORE=80
BEAST_MODE_FAIL_ON_LOW_SCORE=false  # Don't block deployment, just warn
BEAST_MODE_ENVIRONMENT=production
```

---

## Railway Integration

### Setup

1. **Add to `railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

2. **Add health check endpoint**:
```javascript
// app/api/health/route.js
export async function GET() {
  const { QualityEngine } = require('@beast-mode/core');
  const engine = new QualityEngine();
  
  const health = await engine.healthCheck();
  
  return Response.json({
    status: health.healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    ...health
  });
}
```

3. **Configure Railway**:
   - Go to Service Settings → Health Checks
   - Set Health Check Path: `/health`
   - Set Timeout: `100ms`

### Features

- **Health Monitoring**: Continuous health checks
- **Scaling Recommendations**: AI-powered scaling suggestions
- **Deployment Orchestration**: Automated deployment workflows

---

## CLI Commands

### Quality Check
```bash
npx @beast-mode/core quality --min-score 80
```

### PR Analysis
```bash
npx @beast-mode/core analyze --pr --format json
```

### Health Check
```bash
npx @beast-mode/core health
```

### Generate Workflow
```bash
npx @beast-mode/core generate:workflow --platform github-actions
npx @beast-mode/core generate:workflow --platform vercel
npx @beast-mode/core generate:workflow --platform railway
```

---

## Best Practices

1. **Set Appropriate Thresholds**:
   - Development: 70+
   - Staging: 80+
   - Production: 85+

2. **Use Quality Gates**:
   - Block merges on low scores
   - Require manual approval for critical issues

3. **Monitor Trends**:
   - Track quality scores over time
   - Set up alerts for score drops

4. **Integrate Early**:
   - Add checks to PR workflow
   - Catch issues before merge

---

## Troubleshooting

### GitHub Actions

**Issue**: Workflow not running
- Check workflow file is in `.github/workflows/`
- Verify file has `.yml` or `.yaml` extension
- Check branch triggers match your branch names

**Issue**: Quality check failing
- Lower `--min-score` threshold temporarily
- Review issues in PR comment
- Use `--continue-on-error` for warnings

### Vercel

**Issue**: Build failing on quality check
- Set `BEAST_MODE_FAIL_ON_LOW_SCORE=false`
- Check build logs for specific errors
- Verify `@beast-mode/core` is installed

### Railway

**Issue**: Health check failing
- Verify health endpoint is accessible
- Check timeout settings
- Review service logs

---

## Support

- 📚 [Documentation](https://beastmode.dev/docs)
- 💬 [Discord](https://discord.gg/beastmode)
- 🐛 [GitHub Issues](https://github.com/repairman29/BEAST-MODE/issues)

---

*Powered by [BEAST MODE](https://beastmode.dev) - AI-Powered Development Tools*

