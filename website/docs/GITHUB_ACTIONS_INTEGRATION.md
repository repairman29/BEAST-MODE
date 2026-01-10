# GitHub Actions Integration Guide

BEAST MODE integrates seamlessly with GitHub Actions to provide automated quality checks in your CI/CD pipeline.

## Quick Start

### 1. Add Workflow File

Create `.github/workflows/beast-mode-quality.yml` in your repository:

```yaml
name: BEAST MODE Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
      - run: npm install -g @beast-mode/core
      - run: beast-mode quality-check
```

### 2. Configure Quality Threshold

Set a quality score threshold in your workflow:

```yaml
- name: Quality Gate
  if: steps.quality-check.outputs.score < 80
  run: exit 1
```

### 3. PR Comments

BEAST MODE automatically comments on pull requests with quality reports.

## Features

### Automated Quality Checks
- Runs on every PR and push
- Analyzes code quality, security, and best practices
- Provides detailed reports

### Quality Gates
- Block merges if quality score is too low
- Configurable thresholds
- Per-branch configuration

### PR Integration
- Automatic comments with quality reports
- Issue summaries
- Recommendations

## Configuration

### Environment Variables

```yaml
env:
  BEAST_MODE_API_KEY: ${{ secrets.BEAST_MODE_API_KEY }}
  BEAST_MODE_THRESHOLD: 80
```

### Custom Rules

Create `beast-mode.config.js`:

```javascript
module.exports = {
  quality: {
    threshold: 80,
    rules: {
      'no-console': 'error',
      'complexity': 'warn'
    }
  }
};
```

## Advanced Usage

### Multiple Quality Checks

```yaml
jobs:
  quality:
    strategy:
      matrix:
        check: [security, performance, maintainability]
    steps:
      - run: beast-mode check ${{ matrix.check }}
```

### Quality Trends

Track quality over time:

```yaml
- name: Store Quality Metrics
  run: |
    beast-mode quality-check --output json > quality-report.json
    # Upload to your metrics system
```

## API Integration

### Webhook Endpoint

BEAST MODE can receive quality check results via webhook:

```yaml
- name: Send Results to BEAST MODE
  run: |
    curl -X POST https://beast-mode.dev/api/ci/github-actions \
      -H "Content-Type: application/json" \
      -d @quality-report.json
```

## Best Practices

1. **Run on PRs**: Catch issues before merge
2. **Set Reasonable Thresholds**: Start at 70, increase over time
3. **Review Reports**: Don't just block, learn from reports
4. **Track Trends**: Monitor quality over time
5. **Fix Issues**: Use auto-fix when available

## Troubleshooting

### Quality Check Fails

- Check quality score threshold
- Review detailed error messages
- Use `--verbose` flag for more info

### No PR Comments

- Ensure GitHub token has comment permissions
- Check workflow logs for errors
- Verify webhook configuration

## Support

For issues or questions:
- GitHub Issues: [BEAST MODE Issues](https://github.com/repairman29/BEAST-MODE/issues)
- Documentation: [docs.beast-mode.dev](https://docs.beast-mode.dev)
- Discord: [BEAST MODE Community](https://discord.gg/beastmode)

