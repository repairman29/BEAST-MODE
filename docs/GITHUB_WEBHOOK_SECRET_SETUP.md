# GitHub Webhook Secret Setup Guide

**Date:** 2026-01-10  
**Status:** Configuration Guide

---

## 🔍 Current Status

**Found in `.env.local`:**
- ✅ `GITHUB_APP_WEBHOOK_SECRET=30bb02c253af11af81a53467043d5944bd5967c5`
- ❌ `GITHUB_WEBHOOK_SECRET` - Missing

**Code Usage:**
- The webhook handler uses: `GITHUB_APP_WEBHOOK_SECRET`
- Location: `website/app/api/github/webhook/route.ts`

**Conclusion:** The secret is already set! The code uses `GITHUB_APP_WEBHOOK_SECRET`, not `GITHUB_WEBHOOK_SECRET`.

---

## 📋 Steps to Get/Set GitHub Webhook Secret

### Option 1: Get from Existing GitHub App (Recommended)

1. **Go to GitHub App Settings**
   - Visit: https://github.com/settings/apps
   - Click on your BEAST MODE GitHub App

2. **Find Webhook Secret**
   - Scroll to "Webhook" section
   - Look for "Webhook secret" field
   - Click "Reveal" or "Generate new secret" if needed

3. **Copy the Secret**
   - The secret is a long hexadecimal string (e.g., `30bb02c253af11af81a53467043d5944bd5967c5`)
   - **DO NOT** share this secret publicly

4. **Add to `.env.local`**
   ```bash
   GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret_here
   ```

5. **Verify in Code**
   - Check: `website/app/api/github/webhook/route.ts`
   - Should use: `process.env.GITHUB_APP_WEBHOOK_SECRET`

---

### Option 2: Generate New Webhook Secret

If you need to generate a new secret:

1. **Generate Random Secret**
   ```bash
   # Using OpenSSL
   openssl rand -hex 20
   
   # Or using Node.js
   node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
   ```

2. **Update GitHub App**
   - Go to: https://github.com/settings/apps
   - Click on your app
   - Scroll to "Webhook" section
   - Click "Generate new secret"
   - Paste the new secret

3. **Update `.env.local`**
   ```bash
   GITHUB_APP_WEBHOOK_SECRET=new_secret_here
   ```

4. **Update Vercel Environment Variables**
   ```bash
   vercel env add GITHUB_APP_WEBHOOK_SECRET production
   # Paste the secret when prompted
   ```

---

## 🔧 Configuration Steps

### 1. Local Development

**File:** `website/.env.local`

```bash
# GitHub App Webhook Secret
GITHUB_APP_WEBHOOK_SECRET=30bb02c253af11af81a53467043d5944bd5967c5
```

**Verify:**
```bash
grep GITHUB_APP_WEBHOOK_SECRET website/.env.local
```

---

### 2. Production (Vercel)

**Add Environment Variable:**
```bash
cd BEAST-MODE-PRODUCT
vercel env add GITHUB_APP_WEBHOOK_SECRET production
# Paste the secret when prompted
```

**Or via Vercel Dashboard:**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add: `GITHUB_APP_WEBHOOK_SECRET`
3. Value: Your webhook secret
4. Environment: Production (and Preview if needed)

**Verify:**
```bash
vercel env ls
```

---

### 3. GitHub App Webhook Configuration

**Webhook URL:**
```
https://beast-mode.dev/api/github/webhook
```

**Events to Subscribe:**
- `pull_request` (opened, synchronize, closed)
- `pull_request_review`
- `push`
- `repository` (if needed)

**Content Type:**
- `application/json`

**Secret:**
- Use the same secret as `GITHUB_APP_WEBHOOK_SECRET`

---

## ✅ Verification Steps

### 1. Check Environment Variable
```bash
cd BEAST-MODE-PRODUCT
node scripts/check-all-env-vars.js | grep GITHUB
```

**Expected Output:**
```
   ✅ GITHUB_APP_ID
   ✅ GITHUB_APP_PRIVATE_KEY
   ✅ GITHUB_APP_WEBHOOK_SECRET
```

---

### 2. Test Webhook Endpoint

**Send Test Event:**
```bash
curl -X POST https://beast-mode.dev/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-GitHub-Delivery: test-delivery-id" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{"action": "ping"}'
```

**Or use GitHub CLI:**
```bash
gh api repos/:owner/:repo/hooks --method POST \
  -f name=web \
  -f active=true \
  -f events[]=pull_request \
  -f config[url]=https://beast-mode.dev/api/github/webhook \
  -f config[secret]=your_webhook_secret
```

---

### 3. Verify in Code

**Check webhook handler:**
```typescript
// website/app/api/github/webhook/route.ts
const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('[GitHub Webhook] GITHUB_APP_WEBHOOK_SECRET not configured');
  return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
}
```

---

## 🔐 Security Best Practices

1. **Never Commit Secrets**
   - ✅ Add to `.env.local` (already in `.gitignore`)
   - ❌ Never commit to git
   - ❌ Never share in public channels

2. **Use Different Secrets**
   - Development: One secret
   - Production: Different secret
   - Staging: Another secret

3. **Rotate Regularly**
   - Rotate webhook secrets every 90 days
   - Update both GitHub App and environment variables

4. **Verify Signatures**
   - Always verify webhook signatures
   - Code already does this in `route.ts`

---

## 🐛 Troubleshooting

### Issue: "Invalid signature" Error

**Cause:** Webhook secret mismatch

**Fix:**
1. Verify secret in GitHub App matches `.env.local`
2. Check secret in Vercel matches GitHub App
3. Ensure no extra spaces or newlines in secret

---

### Issue: "Webhook secret not configured"

**Cause:** Environment variable not set

**Fix:**
1. Add `GITHUB_APP_WEBHOOK_SECRET` to `.env.local`
2. Restart dev server
3. Add to Vercel environment variables

---

### Issue: Webhook Not Receiving Events

**Check:**
1. Webhook URL is correct: `https://beast-mode.dev/api/github/webhook`
2. Events are subscribed in GitHub App settings
3. Webhook is active (not disabled)
4. Check webhook delivery logs in GitHub App settings

---

## 📋 Quick Reference

**Environment Variable:**
```bash
GITHUB_APP_WEBHOOK_SECRET=your_secret_here
```

**GitHub App Settings:**
- URL: https://github.com/settings/apps
- Webhook URL: `https://beast-mode.dev/api/github/webhook`
- Events: `pull_request`, `pull_request_review`, `push`

**Code Location:**
- `website/app/api/github/webhook/route.ts`
- Uses: `process.env.GITHUB_APP_WEBHOOK_SECRET`

---

**Status:** ✅ Already configured! The secret exists as `GITHUB_APP_WEBHOOK_SECRET`.
