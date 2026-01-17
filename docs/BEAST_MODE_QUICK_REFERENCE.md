# BEAST MODE Quick Reference

**For:** BEAST MODE Product Experts  
**Purpose:** Fast lookup for common tasks and information

---

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 7777)
npm run work           # Start all services + dev server
npm run build:website   # Build website

# Testing
npm run test            # Run all tests
npm run test:e2e        # E2E tests (Playwright)
npm run test:api        # API tests

# Deployment
cd website && npm run build && cd .. && vercel --prod --yes

# MLOps
npm run ml:health-check # Check ML database
npm run ml:status       # ML system status
npm run train:quality   # Train quality model

# Secrets
node scripts/check-secrets-in-docs.js    # Check for secrets
node scripts/scan-docs-for-secrets.js    # Scan and store secrets
```

---

## 📁 Key File Locations

| Component | Path |
|-----------|------|
| Main Entry | `lib/index.js` |
| Website Entry | `website/app/layout.tsx` |
| API Routes | `website/app/api/` |
| MLOps | `lib/mlops/` |
| Database Migrations | `supabase/migrations/` |
| Components | `website/components/` |
| Utilities | `website/lib/` |

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/beast-mode/generate-code` | POST | Direct code generation |
| `/api/v1/code/generate` | POST | BEAST MODE Backend API v1 |
| `/api/beast-mode/conversation` | POST | Conversational code generation |
| `/api/v1/health` | GET | Health check |

### Authentication Headers

```
X-BEAST-MODE-API-KEY: bm_live_...
Authorization: Bearer bm_live_...
X-User-Id: {userId}
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `custom_models` | Custom model configurations |
| `user_api_keys` | User API keys (encrypted) |
| `secrets` | System secrets |
| `ml_predictions` | ML prediction results |
| `quality_feedback` | User feedback |
| `user_subscriptions` | Subscription tiers |
| `github_app_credentials` | GitHub OAuth credentials |
| `chat_sessions` | Codebase chat sessions |
| `credits` | Credit system |

---

## 🔐 Security Rules

1. **Never store secrets in documentation**
   - Use `[STORED_IN_DB]` placeholder
   - Store in Supabase `secrets` table

2. **Pre-commit checks**
   ```bash
   node scripts/check-secrets-in-docs.js
   ```

3. **Import rules (CRITICAL)**
   - ✅ `import { x } from '@/lib/x'`
   - ❌ `import { x } from '../../lib/x'`
   - ❌ `import { x } from '@/lib/x.tsx'`

---

## 💳 Subscription Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | $0 | Basic features |
| Developer | $79/mo | Day 2 Operations, Advanced analytics |
| Team | $299/mo | Team collaboration |
| Enterprise | $799/mo | SENTINEL, Custom integrations |

---

## 🤖 Model System

### Custom Models

- Stored in: `custom_models` table
- Format: `custom:{model-id}`
- Provider: `beast-mode`
- Auto-discovery: `smartModelSelector.js`

### Model Selection

1. Check user's custom models
2. Check public custom models
3. Fall back to provider models

---

## 🏗️ Architecture Flow

```
User Request
    ↓
BEAST MODE API Key Auth
    ↓
Backend API (/api/v1/code/generate)
    ↓
Model Router → Custom Models
    ↓
Generated Code → Database Writer
    ↓
Supabase (predictions + storage)
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Import errors | Use `@/` aliases, not relative paths |
| Model not found | Run `node scripts/setup-beast-mode-model.js` |
| Build fails | Check import paths, verify `@/` aliases |
| Secrets exposed | Follow `SECURITY_INCIDENT_ROTATION_GUIDE.md` |

---

## 📊 MLOps Services

| Service | File | Purpose |
|---------|------|---------|
| Model Router | `modelRouter.js` | Routes to best model |
| Smart Selector | `smartModelSelector.js` | Auto-selects models |
| Database Writer | `databaseWriter.js` | Writes predictions |
| Storage Client | `storageClient.js` | Manages storage |
| Feedback Collector | `feedbackCollector.js` | Collects feedback |

---

## 🔑 Environment Variables

| Variable | Purpose |
|----------|---------|
| `BEAST_MODE_API_KEY` | BEAST MODE API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |

---

## 📚 Key Documentation

| Document | Path | Purpose |
|----------|------|---------|
| Expert Onboarding | `docs/BEAST_MODE_EXPERT_ONBOARDING.md` | Complete guide |
| Architecture | `website/docs/BEAST_MODE_ARCHITECTURE.md` | Architecture overview |
| Secret Management | `docs/SECRET_MANAGEMENT_RULES.md` | Security rules |
| Security Guide | `docs/SECURITY_INCIDENT_ROTATION_GUIDE.md` | Incident response |
| MLOps Guide | `lib/mlops/README.md` | MLOps infrastructure |

---

## ✅ Pre-Deployment Checklist

1. ✅ `cd website && npm run build` (must succeed)
2. ✅ `grep -r '../../lib' website/components website/app` (should find nothing)
3. ✅ Verify all imports use `@/` aliases
4. ✅ `git add -A && git commit && git push`
5. ✅ `cd BEAST-MODE-PRODUCT && vercel --prod --yes`

---

## 🎯 Core Principles

1. **BEAST MODE-only** - No external providers
2. **Self-contained** - Own infrastructure
3. **Quality-first** - Everything through quality engine
4. **Security-first** - Secrets in database
5. **User-centric** - Zero configuration
6. **Enterprise-ready** - SENTINEL governance

---

**Last Updated:** 2026-01-22
