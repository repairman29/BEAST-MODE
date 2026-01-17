# BEAST MODE Product Expert Onboarding

**Date:** 2026-01-22  
**Purpose:** Complete expert-level understanding of BEAST MODE codebase

---

## 🎯 Core Philosophy

**BEAST MODE is the galaxy's best vibe-coder's oasis.**

- **Self-contained:** No external provider dependencies
- **BEAST MODE-only:** Uses BEAST MODE custom models and infrastructure
- **Quality Intelligence:** AI-powered development tools for vibe coders who ship with style
- **Enterprise-ready:** SENTINEL governance layer for enterprise customers

---

## 📁 Project Structure

### Root Directory: `BEAST-MODE-PRODUCT/`

```
BEAST-MODE-PRODUCT/
├── lib/                    # Core library (ESM)
│   ├── ai/                 # AI capabilities (code review, generation, etc.)
│   ├── analytics/          # Analytics and anomaly detection
│   ├── cli/                # CLI tools and commands
│   ├── code-roach/         # Code quality integration
│   ├── enterprise/         # Enterprise features (SENTINEL, RBAC, SSO)
│   ├── intelligence/       # Predictive analytics, recommendations
│   ├── janitor/            # AI Janitor (Day 2 Operations)
│   ├── marketplace/       # Plugin and integration marketplace
│   ├── mlops/              # MLOps infrastructure (117 files!)
│   ├── oracle/             # Knowledge layer integration
│   ├── quality.js          # Quality engine
│   └── index.js            # Main entry point
│
├── website/                # Next.js web application
│   ├── app/                # Next.js 14 App Router
│   │   ├── api/            # API routes (120+ endpoints)
│   │   ├── ide/            # IDE interface
│   │   ├── dashboard/      # User dashboard
│   │   └── ...
│   ├── components/         # React components (112 files)
│   ├── lib/                # Shared utilities
│   │   ├── mlops/          # MLOps client-side integration
│   │   ├── ide/            # IDE utilities
│   │   └── ...
│   └── scripts/            # Build and automation scripts
│
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
│
├── scripts/                # Automation and utility scripts
├── docs/                   # Documentation
└── .beast-mode/            # Local data storage (models, training data)
```

---

## 🏗️ Architecture Overview

### Core Components

1. **BeastMode Class** (`lib/index.js`)
   - Main entry point for BEAST MODE
   - Initializes all components
   - License validation and feature gating
   - Subscription tier management

2. **Quality Engine** (`lib/quality.js`)
   - Code quality scoring
   - Quality prediction models
   - Quality-to-code mapping

3. **Intelligence System** (`lib/intelligence/`)
   - Organization quality intelligence
   - Predictive development analytics
   - Automated team optimization
   - Enterprise knowledge management

4. **Marketplace** (`lib/marketplace/`)
   - Plugin marketplace
   - Integration marketplace
   - Tool discovery
   - Monetization programs

5. **MLOps Infrastructure** (`lib/mlops/`)
   - 117 files covering:
     - Model routing and selection
     - Custom model management
     - Training pipelines
     - Feedback collection
     - Database integration
     - Storage integration (Supabase Storage)
     - Quality prediction
     - Code generation
     - Context-aware generation

6. **AI Janitor** (`lib/janitor/`)
   - Silent refactoring
   - Architecture enforcement
   - Brand reputation interception
   - Day 2 Operations

7. **Enterprise (SENTINEL)** (`lib/sentinel/`)
   - Governance layer
   - Enterprise guardrails
   - Compliance and audit logging

---

## 🔌 API Architecture

### Code Generation Flow

```
User Request
    ↓
BEAST MODE API Key Authentication
    ↓
BEAST MODE Backend API (/api/v1/code/generate)
    ↓
BEAST MODE Custom Models (from Supabase)
    ↓
Generated Code
```

### Key API Endpoints

1. **`POST /api/beast-mode/generate-code`**
   - Direct code generation
   - Uses BEAST MODE backend API
   - Falls back to local custom models

2. **`POST /api/v1/code/generate`**
   - BEAST MODE Backend API v1
   - Authenticates with BEAST MODE API key
   - Routes to custom models via model router

3. **`POST /api/beast-mode/conversation`**
   - Conversational code generation
   - Chat-based interface

4. **`GET /api/v1/health`**
   - Health check endpoint

### Authentication

- **BEAST MODE API Keys:** `bm_live_...` or `bm_test_...`
- **Headers:**
  - `X-BEAST-MODE-API-KEY`
  - `Authorization: Bearer {key}`
  - `X-User-Id` (optional)

---

## 🗄️ Database Schema (Supabase)

### Key Tables

1. **`custom_models`**
   - Stores custom model configurations
   - Fields: `model_id`, `model_name`, `endpoint_url`, `is_active`, `is_public`, `user_id`

2. **`user_api_keys`**
   - User-provided API keys (encrypted)
   - Fields: `user_id`, `provider`, `encrypted_key`

3. **`secrets`**
   - System secrets and credentials
   - Fields: `key`, `value`, `description`, `category`, `environment`
   - **CRITICAL:** Never store secrets in documentation!

4. **`ml_predictions`**
   - ML prediction results
   - Stores quality predictions, code generation results, etc.

5. **`quality_feedback`**
   - User feedback on quality predictions
   - Used for model training

6. **`user_subscriptions`**
   - User subscription tiers
   - Fields: `user_id`, `tier`, `status`, `starts_at`, `ends_at`

7. **`github_app_credentials`**
   - GitHub OAuth and App credentials
   - Fields: `client_id`, `client_secret`, `webhook_secret`

8. **`chat_sessions`**
   - Codebase chat session persistence

9. **`credits`**
   - Credit system for usage tracking

### Storage Buckets

- **`ml-artifacts`**: Large ML artifacts (models, training data, catalogs)

---

## 🤖 Model System

### Custom Models

- Stored in Supabase `custom_models` table
- Model ID format: `custom:{model-id}`
- Provider: `beast-mode` (our own provider)
- Auto-discovery via `smartModelSelector.js`

### Model Router (`lib/mlops/modelRouter.js`)

- Routes requests to appropriate models
- Supports custom models and provider models
- Auto-selects best model for user
- Falls back gracefully

### Smart Model Selector (`lib/mlops/smartModelSelector.js`)

- Auto-detects custom models
- Falls back to provider models
- Zero configuration required
- Context-aware selection

---

## 🔐 Security & Secrets Management

### CRITICAL RULES

1. **Never store secrets in documentation**
   - Use placeholders: `[STORED_IN_DB]`, `[REDACTED]`
   - Store in Supabase `secrets` table

2. **Pre-commit checks**
   - Run `node scripts/check-secrets-in-docs.js`
   - Run `node scripts/scan-docs-for-secrets.js`

3. **Secret rotation**
   - See `docs/SECURITY_INCIDENT_ROTATION_GUIDE.md`
   - Rotate immediately if exposed

### Secret Storage

- **Database:** Supabase `secrets` table
- **Local:** `.env.local` (never commit)
- **Production:** Vercel environment variables

---

## 💳 Subscription Tiers

1. **Free**
   - Basic features
   - Limited API calls

2. **Developer** ($79/month)
   - Day 2 Operations
   - Advanced analytics

3. **Team** ($299/month)
   - Team collaboration
   - Advanced features

4. **Enterprise** ($799/month)
   - SENTINEL governance
   - Custom integrations
   - White-label

### Feature Gating

- Checked via `licenseValidator.checkFeature()`
- Tier-based access control
- API limits enforced

---

## 🚀 Deployment

### Vercel Configuration

- **Framework:** Next.js
- **Build Command:** `npm run build && node scripts/copy-mlops.js`
- **Root Directory:** `website` (Vercel project setting)
- **Region:** `iad1`

### Import Rules (CRITICAL)

- **ALWAYS** use `@/` aliases: `import { useUser } from '@/lib/user-context'`
- **NEVER** use relative paths: `import { useUser } from '../../lib/user-context'`
- **NEVER** add file extensions: `import { useUser } from '@/lib/user-context.tsx'`

### Pre-Deployment Checklist

1. `cd website && npm run build` (must succeed!)
2. `grep -r '../../lib' website/components website/app` (should find nothing)
3. Verify all imports use `@/` aliases
4. `git add -A && git commit && git push`
5. `cd BEAST-MODE-PRODUCT && vercel --prod --yes`

---

## 🧪 Testing

### Test Scripts

- `npm run test` - Run all tests
- `npm run test:e2e` - E2E tests (Playwright)
- `npm run test:api` - API tests
- `npm run test:ui` - UI tests

### E2E Tests

- Located in `website/e2e/`
- Uses Playwright
- Tests critical flows: auth, credit purchase, API endpoints

---

## 📊 MLOps Infrastructure

### Key Services

1. **Model Router** - Routes to best model
2. **Smart Selector** - Auto-selects models
3. **Database Writer** - Writes predictions to Supabase
4. **Storage Client** - Manages Supabase Storage
5. **Feedback Collector** - Collects user feedback
6. **Training Pipeline** - Trains models
7. **Quality Predictor** - Predicts code quality

### Data Flow

```
User Request → Model Router → Custom Model → Prediction → Database Writer → Supabase
                                                              ↓
                                                         Storage (large artifacts)
```

---

## 🛠️ Key Scripts

### Development

- `npm run dev` - Start dev server (port 7777)
- `npm run work` - Start all services + dev server
- `npm run build:website` - Build website

### MLOps

- `npm run ml:health-check` - Check ML database health
- `npm run ml:status` - ML system status
- `npm run train:quality` - Train quality model

### Deployment

- `npm run deploy` - Auto-deploy
- `vercel --prod --yes` - Manual Vercel deploy

### Secret Management

- `node scripts/check-secrets-in-docs.js` - Check for secrets
- `node scripts/scan-docs-for-secrets.js` - Scan and store secrets

---

## 📚 Key Documentation Files

1. **`docs/README.md`** - Documentation index
2. **`docs/SECRET_MANAGEMENT_RULES.md`** - Secret management (CRITICAL)
3. **`docs/SECURITY_INCIDENT_ROTATION_GUIDE.md`** - Security incident response
4. **`website/docs/BEAST_MODE_ARCHITECTURE.md`** - Architecture overview
5. **`website/docs/BEAST_MODE_COMPLETE_STATUS.md`** - Current status
6. **`lib/mlops/README.md`** - MLOps infrastructure guide

---

## 🎨 Frontend Architecture

### Next.js 14 App Router

- **Pages:** `app/` directory
- **API Routes:** `app/api/` directory
- **Components:** `components/` directory
- **Utilities:** `lib/` directory

### Key Components

- **Navigation** - Main navigation
- **UserProvider** - User context
- **ErrorBoundary** - Error handling
- **AutoFeedbackInitializer** - Auto feedback collection

### IDE Interface

- Located at `/ide`
- Monaco Editor integration
- Code generation via BEAST MODE
- Codebase context and navigation

---

## 🔄 Integration Points

### External Services

1. **Supabase**
   - Database (PostgreSQL)
   - Storage (for ML artifacts)
   - Auth (optional)

2. **Vercel**
   - Hosting and deployment
   - Environment variables

3. **Stripe**
   - Payment processing
   - Subscription management

4. **GitHub**
   - OAuth authentication
   - GitHub App integration
   - Repository scanning

---

## 🚨 Common Issues & Solutions

### Build Failures

- **Issue:** Import errors with relative paths
- **Solution:** Use `@/` aliases, never relative paths

### Model Not Found

- **Issue:** No custom models available
- **Solution:** Run `node scripts/setup-beast-mode-model.js`

### Secret Exposure

- **Issue:** Secrets in git history
- **Solution:** Follow `SECURITY_INCIDENT_ROTATION_GUIDE.md`

### Deployment Failures

- **Issue:** Build succeeds locally but fails on Vercel
- **Solution:** Check import paths, verify `@/` aliases

---

## 🎯 Key Principles

1. **BEAST MODE-only architecture** - No external providers
2. **Self-contained** - Own infrastructure and models
3. **Quality-first** - Everything goes through quality engine
4. **Security-first** - Secrets in database, never in docs
5. **User-centric** - Zero configuration, auto-discovery
6. **Enterprise-ready** - SENTINEL for governance

---

## 📝 Quick Reference

### File Paths

- Main entry: `lib/index.js`
- Website entry: `website/app/layout.tsx`
- API routes: `website/app/api/`
- MLOps: `lib/mlops/`
- Database: `supabase/migrations/`

### Environment Variables

- `BEAST_MODE_API_KEY` - BEAST MODE API key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Common Commands

```bash
# Development
npm run dev
npm run work

# Testing
npm run test
npm run test:e2e

# Deployment
cd website && npm run build
cd .. && vercel --prod --yes

# MLOps
npm run ml:health-check
npm run ml:status
```

---

## ✅ Expert Checklist

As a BEAST MODE expert, you should know:

- [x] Core architecture and philosophy
- [x] Project structure and key directories
- [x] API endpoints and authentication
- [x] Database schema and key tables
- [x] Model system and routing
- [x] Security and secrets management
- [x] Subscription tiers and feature gating
- [x] Deployment process and import rules
- [x] MLOps infrastructure
- [x] Key scripts and commands
- [x] Common issues and solutions

---

**Last Updated:** 2026-01-22  
**Status:** ✅ Expert Onboarding Complete
