# GitHub App Implementation Plan

**Date:** 2026-01-09  
**Priority:** 🔴 CRITICAL - Phase 1  
**Timeline:** 4 weeks

---

## 🎯 OBJECTIVE

Build a GitHub App that integrates BEAST MODE directly into GitHub PRs, eliminating the need for developers to leave GitHub to check code quality.

**Success Criteria:**
- ✅ GitHub App installable on any repo
- ✅ Automatic PR quality comments
- ✅ Status checks with quality gates
- ✅ Quality badges in README
- ✅ 50% of users install within 30 days

---

## 📊 CURRENT STATE

### What We Have:
- ✅ GitHub OAuth (user authentication)
- ✅ GitHub API access (can scan repos)
- ✅ Quality scoring engine (works)
- ✅ PR comment template (exists in GitHub Actions template)

### What We Need:
- ❌ GitHub App registration
- ❌ Webhook handler
- ❌ PR diff analysis
- ❌ Automatic PR comments
- ❌ Status check creation
- ❌ Quality badge generation

---

## 🏗️ ARCHITECTURE

### Component Overview:

```
GitHub → Webhook → BEAST MODE API → Quality Analysis → GitHub (PR Comment + Status Check)
```

### Data Flow:

1. **PR Created** → GitHub sends webhook
2. **Webhook Handler** → Receives event, extracts PR info
3. **PR Analyzer** → Analyzes PR diff, calculates quality
4. **Comment Service** → Formats and posts PR comment
5. **Status Check** → Creates/updates check run
6. **Badge Service** → Updates quality badge (if enabled)

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)

#### Day 1: GitHub App Registration
- [ ] Register GitHub App on GitHub
- [ ] Configure app permissions:
  - Repository: Read/Write
  - Pull requests: Read/Write
  - Checks: Read/Write
  - Contents: Read
  - Metadata: Read
- [ ] Generate private key
- [ ] Store credentials securely (Supabase/Env vars)
- [ ] Document app setup process

#### Day 2: Webhook Infrastructure
- [ ] Install `@octokit/app` and `@octokit/webhooks`
- [ ] Create webhook endpoint: `/api/github/webhook`
- [ ] Set up webhook signature verification
- [ ] Create webhook event handler
- [ ] Test webhook delivery (use ngrok for local)

#### Day 3: Webhook Processing
- [ ] Handle `pull_request.opened` event
- [ ] Handle `pull_request.synchronize` event
- [ ] Handle `pull_request.closed` event
- [ ] Extract PR information (repo, PR number, diff)
- [ ] Log webhook events for debugging

#### Day 4-5: PR Diff Analysis
- [ ] Create PR diff analyzer
- [ ] Fetch PR diff from GitHub API
- [ ] Analyze changed files
- [ ] Calculate quality score for PR
- [ ] Identify issues in changed code

---

### Phase 2: PR Integration (Week 2)

#### Day 6-7: PR Comment Service
- [ ] Create PR comment formatter
- [ ] Generate quality score comment
- [ ] Include issues and recommendations
- [ ] Add "Fix Issues" button/link
- [ ] Post comment to PR via GitHub API

#### Day 8-9: Comment Updates
- [ ] Detect existing comments
- [ ] Update existing comment (not create new)
- [ ] Handle comment updates on new commits
- [ ] Add "Updated" timestamp
- [ ] Handle comment failures gracefully

#### Day 10: Comment Formatting
- [ ] Design comment template
- [ ] Add quality score visualization
- [ ] Add issue breakdown
- [ ] Add recommendations list
- [ ] Add action buttons/links

---

### Phase 3: Status Checks (Week 3)

#### Day 11-12: Check Run Creation
- [ ] Create check run when PR opened
- [ ] Set check status: `queued` → `in_progress`
- [ ] Run quality analysis
- [ ] Update check status: `completed`
- [ ] Set check conclusion: `success` or `failure`

#### Day 13-14: Quality Gates
- [ ] Implement quality threshold logic
- [ ] Block PR if quality < threshold (configurable)
- [ ] Show quality score in check details
- [ ] Add annotations for issues
- [ ] Link to full report

#### Day 15: Check Run Updates
- [ ] Update check on new commits
- [ ] Show progress during analysis
- [ ] Handle check run failures
- [ ] Add retry logic

---

### Phase 4: Polish & Launch (Week 4)

#### Day 16-17: Quality Badges
- [ ] Enhance existing badge endpoint
- [ ] Generate SVG badges
- [ ] Update badges on quality changes
- [ ] Support different badge styles
- [ ] Add badge to README template

#### Day 18-19: Error Handling & Monitoring
- [ ] Add comprehensive error handling
- [ ] Log all webhook events
- [ ] Monitor webhook delivery
- [ ] Add alerting for failures
- [ ] Create admin dashboard for monitoring

#### Day 20-21: Documentation & Testing
- [ ] Write installation guide
- [ ] Create video tutorial
- [ ] Write API documentation
- [ ] Test with beta users
- [ ] Fix bugs and polish

---

## 🔧 TECHNICAL DETAILS

### GitHub App Setup

**Required Permissions:**
```json
{
  "repository": {
    "contents": "read",
    "metadata": "read",
    "pull_requests": "write",
    "checks": "write"
  }
}
```

**Webhook Events:**
- `pull_request` (opened, synchronize, closed)
- `push` (optional, for main branch scanning)

**Installation:**
- User installs app on repo/org
- App receives installation ID
- Use installation token for API calls

---

### Webhook Handler Structure

```typescript
// website/app/api/github/webhook/route.ts
export async function POST(request: NextRequest) {
  // 1. Verify webhook signature
  // 2. Parse webhook payload
  // 3. Route to appropriate handler
  // 4. Process event asynchronously
  // 5. Return 200 immediately
}
```

---

### PR Comment Format

```markdown
## 📊 BEAST MODE Quality Check

**Quality Score:** 72/100 ⭐⭐⭐

### 📈 Quality Trend
- Previous: 68/100
- Current: 72/100
- Change: +4 points ✅

### 🔍 Issues Found: 12
- 🔴 **High Priority:** 3
  - Missing error handling in `src/api/users.js:42`
  - Security vulnerability in `src/auth/token.js:15`
  - Performance issue in `src/utils/process.js:89`
- 🟡 **Medium Priority:** 5
- 🟢 **Low Priority:** 4

### 💡 Top Recommendations:
1. Add error handling to `src/api/users.js`
2. Remove console.logs (5 found)
3. Add JSDoc comments (12 missing)

### 🚀 Quick Actions:
- [View Full Report](https://beastmode.dev/quality?repo=owner/repo&pr=123)
- [Fix Issues Automatically](https://beastmode.dev/dashboard?action=fix&repo=owner/repo&pr=123)
- [Ask Questions](https://beastmode.dev/dashboard?view=intelligence&repo=owner/repo)

---
*Updated: 2026-01-09 14:23 UTC | BEAST MODE v1.0.0*
```

---

### Status Check Format

```javascript
{
  name: 'BEAST MODE Quality Check',
  head_sha: 'abc123def456',
  status: 'completed',
  conclusion: 'success', // or 'failure' if quality < threshold
  output: {
    title: 'Quality Score: 72/100',
    summary: '✅ Quality check passed. 12 issues found, 3 high priority.',
    text: `
## Quality Analysis

**Score:** 72/100
**Status:** ✅ Passed (threshold: 60)

### Issues Found
- High Priority: 3
- Medium Priority: 5
- Low Priority: 4

### Recommendations
1. Add error handling
2. Remove console.logs
3. Add documentation

[View Full Report](https://beastmode.dev/quality?repo=owner/repo&pr=123)
    `
  },
  annotations: [
    {
      path: 'src/api/users.js',
      start_line: 42,
      end_line: 45,
      annotation_level: 'warning',
      message: 'Missing error handling for API call',
      title: 'Code Quality Issue'
    }
  ]
}
```

---

## 📦 DEPENDENCIES

### Required Packages:
```json
{
  "@octokit/app": "^13.0.0",
  "@octokit/rest": "^20.0.0",
  "@octokit/webhooks": "^12.0.0"
}
```

### Environment Variables:
```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_APP_WEBHOOK_SECRET=whsec_...
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
```

---

## 🧪 TESTING STRATEGY

### Local Development:
1. Use `ngrok` to expose local webhook endpoint
2. Configure GitHub App webhook to ngrok URL
3. Create test PR in test repo
4. Verify webhook delivery in logs
5. Verify PR comment appears
6. Verify status check appears

### Integration Testing:
1. Install GitHub App on test repo
2. Create PR with known issues
3. Verify:
   - PR comment format
   - Status check format
   - Quality score accuracy
   - Quality gates work
   - Badge updates

### Production Testing:
1. Install on real repo (yours)
2. Create test PR
3. Monitor for errors
4. Verify all features work
5. Collect user feedback

---

## 🚨 RISKS & MITIGATION

### Risk 1: GitHub Rate Limits
**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Implement rate limit handling
- Use installation tokens (higher limits)
- Cache results
- Queue system for high volume

### Risk 2: Webhook Delivery Failures
**Impact:** High  
**Probability:** Low  
**Mitigation:**
- Retry logic
- Webhook delivery monitoring
- Fallback to polling (if needed)
- Alerting for failures

### Risk 3: PR Diff Analysis Complexity
**Impact:** Medium  
**Probability:** High  
**Mitigation:**
- Start simple (file-level)
- Iterate to line-level
- Use existing quality engine
- Handle large PRs gracefully

### Risk 4: Performance (Large PRs)
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Async processing
- Progress indicators
- Timeout handling
- Optimize analysis

---

## 📊 SUCCESS METRICS

### Technical Metrics:
- Webhook delivery rate: >99%
- PR comment success rate: >95%
- Status check success rate: >95%
- Average response time: <5 seconds

### Business Metrics:
- GitHub App installations: 50% of users within 30 days
- PR comment engagement: 60% of PRs get comments
- Status check usage: 70% of PRs get checks
- Quality improvement: +10 points average per PR

---

## 🚀 QUICK START

### Step 1: Register GitHub App
1. Go to https://github.com/settings/apps
2. Click "New GitHub App"
3. Fill in app details
4. Set webhook URL: `https://beastmode.dev/api/github/webhook`
5. Set permissions (see above)
6. Generate private key
7. Save credentials

### Step 2: Install Dependencies
```bash
cd BEAST-MODE-PRODUCT
npm install @octokit/app @octokit/rest @octokit/webhooks
```

### Step 3: Set Environment Variables
```bash
# Add to .env.local
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_APP_WEBHOOK_SECRET=whsec_...
```

### Step 4: Build Webhook Handler
```bash
# Create webhook endpoint
touch website/app/api/github/webhook/route.ts
```

### Step 5: Test Locally
```bash
# Start ngrok
ngrok http 3000

# Update GitHub App webhook URL to ngrok URL
# Create test PR
# Verify webhook delivery
```

---

## 📚 RESOURCES

### Documentation:
- [GitHub Apps](https://docs.github.com/en/apps)
- [Creating GitHub Apps](https://docs.github.com/en/apps/creating-github-apps)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Checks API](https://docs.github.com/en/rest/checks)
- [Pull Requests API](https://docs.github.com/en/rest/pulls)

### Libraries:
- [@octokit/app](https://github.com/octokit/app.js)
- [@octokit/rest](https://github.com/octokit/rest.js)
- [@octokit/webhooks](https://github.com/octokit/webhooks.js)

### Tools:
- [ngrok](https://ngrok.com/) - Local webhook testing
- [GitHub App Manifest](https://docs.github.com/en/apps/sharing-github-apps/generating-a-github-app-manifest-code) - Quick setup

---

## ✅ NEXT ACTIONS

1. **Register GitHub App** (30 minutes)
2. **Install dependencies** (5 minutes)
3. **Create webhook endpoint** (1 hour)
4. **Test webhook delivery** (30 minutes)
5. **Build PR comment service** (4 hours)

---

**Ready to build! Let's start with GitHub App registration. 🚀**
