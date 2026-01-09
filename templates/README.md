# BEAST MODE Integration Templates

**Fast integration templates using BEAST MODE APIs**

## 📦 Available Templates

### 1. GitHub Actions Quality Check
**File:** `github-actions-quality-check.yml`

**Usage:**
1. Copy to `.github/workflows/quality-check.yml`
2. Set `BEAST_MODE_API` secret (optional, defaults to https://beast-mode.com)
3. Quality checks run on push, PR, and weekly

**Features:**
- ✅ Automatic quality checks
- ✅ PR comments with results
- ✅ Fails if quality below threshold
- ✅ Weekly scheduled checks

### 2. Vercel Integration
**File:** `vercel-integration.js`

**Usage:**
1. Add to your Vercel project as API route
2. Set `BEAST_MODE_API` environment variable
3. Call on deployment webhook

**Features:**
- ✅ Quality check on deploy
- ✅ Low quality warnings
- ✅ Recommendations included

### 3. Slack Notifications
**File:** `slack-notification.js`

**Usage:**
1. Set `SLACK_WEBHOOK_URL` environment variable
2. Import and call `sendQualityToSlack()`
3. Or use `checkQualityAndNotify()` helper

**Features:**
- ✅ Rich Slack messages
- ✅ Color-coded by quality
- ✅ Action buttons
- ✅ Recommendations included

## 🚀 Quick Start

### GitHub Actions
```bash
cp templates/github-actions-quality-check.yml .github/workflows/quality-check.yml
```

### Vercel
```bash
cp templates/vercel-integration.js api/quality-check.js
```

### Slack
```bash
cp templates/slack-notification.js lib/slack-quality.js
```

## 💡 Using Pre-Built Components

### React/Next.js
```tsx
import { QualityWidget } from '@/components/plg/QualityWidget';
import { RecommendationCards } from '@/components/plg/RecommendationCards';
import { FeedbackButton } from '@/components/plg/FeedbackButton';

<QualityWidget repo="owner/repo" />
<RecommendationCards repo="owner/repo" />
<FeedbackButton predictionId="..." predictedValue={0.8} />
```

### HTML/Anywhere
```html
<img src="https://beast-mode.com/api/badge?repo=owner/repo" />
```

## 📊 API Endpoints

### Quality API
```bash
POST /api/repos/quality
{
  "repo": "owner/repo",
  "platform": "your-platform"
}
```

### Feedback API
```bash
POST /api/feedback/submit
{
  "predictionId": "...",
  "actualValue": 0.8
}
```

### Trends API
```bash
GET /api/repos/quality/trends?repo=owner/repo&days=90
```

## 🎯 PLG Principles

- **Time to Value:** < 5 minutes
- **Self-Service:** No setup needed
- **Viral:** Components spread organically
- **Usage-Based:** More usage = better model

---

**Status:** ✅ Ready to use  
**Next:** Copy template, customize, deploy!
