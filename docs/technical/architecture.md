# BEAST MODE Architecture
## System Design & Architecture Overview

BEAST MODE is built as a distributed system with multiple services working together to provide comprehensive code quality and development assistance.

---

## 🏗️ High-Level Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    BEAST MODE Platform                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   API Layer  │  │  ML Services  │ │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Node.js)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                   ┌────────┴────────┐                   │
│                   │   Supabase      │                   │
│                   │   (Database)    │                   │
│                   └────────────────┘                   │
│                            │                            │
│         ┌──────────────────┼──────────────────┐         │
│         │                  │                  │         │
│  ┌──────┴──────┐  ┌────────┴────────┐  ┌─────┴──────┐ │
│  │   Vercel    │  │   Upstash Redis │  │  External   │ │
│  │  (Hosting)  │  │    (Cache)      │  │   APIs      │ │
│  └─────────────┘  └─────────────────┘  └─────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Context + Hooks

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash Redis

### Infrastructure
- **Hosting:** Vercel
- **Database:** Supabase
- **Cache:** Upstash Redis
- **CDN:** Cloudflare
- **Monitoring:** Sentry + Logtail

### AI/ML
- **Models:** Custom ML models (scikit-learn)
- **Providers:** OpenAI, Anthropic (for some features)
- **Training:** Custom training pipeline

---

## 📦 Service Architecture

### 1. Web Application (Next.js)
**Location:** `website/`

**Responsibilities:**
- User interface
- Dashboard
- Authentication
- API routes

**Key Components:**
- Landing page
- Dashboard
- API endpoints
- Authentication

---

### 2. Core Library (npm package)
**Location:** `lib/`

**Package:** `@beast-mode/core`

**Responsibilities:**
- Core functionality
- CLI commands
- Quality checks
- License validation

**Key Modules:**
- `lib/index.js` - Main entry point
- `lib/licensing/` - License validation
- `lib/quality/` - Quality checks
- `lib/cli/` - CLI commands

---

### 3. Database (Supabase)
**Location:** `website/supabase/migrations/`

**Responsibilities:**
- User data
- Subscriptions
- API keys
- Usage tracking
- ML predictions

**Key Tables:**
- `beast_mode_subscriptions` - User subscriptions
- `beast_mode_api_keys` - API keys
- `beast_mode_api_usage` - Usage tracking
- `ml_predictions` - ML model predictions

---

### 4. ML Services
**Location:** `lib/mlops/`

**Responsibilities:**
- Quality predictions
- Model training
- Feature engineering
- Model deployment

**Key Components:**
- Quality prediction models
- Training pipeline
- Feature extraction
- Model versioning

---

## 🔄 Data Flow

### Quality Check Flow

```
1. User runs: beast-mode quality check
   ↓
2. CLI sends request to API
   ↓
3. API validates license
   ↓
4. ML service analyzes code
   ↓
5. Database stores prediction
   ↓
6. API returns score + recommendations
   ↓
7. CLI displays results
```

### License Validation Flow

```
1. Client sends API key
   ↓
2. API hashes key (SHA-256)
   ↓
3. Database lookup (beast_mode_api_keys)
   ↓
4. Check subscription (beast_mode_subscriptions)
   ↓
5. Check usage limits (beast_mode_api_usage)
   ↓
6. Return validation result
```

---

## 🔐 Security Architecture

### API Key Security
- Keys hashed with SHA-256 before storage
- Keys never returned after creation
- Keys validated on every request
- Usage tracked per key

### Data Security
- Encryption at rest (Supabase)
- Encryption in transit (HTTPS)
- Row-level security (RLS)
- Service role for admin operations

---

## 📊 Scalability

### Horizontal Scaling
- Stateless API design
- Serverless functions (Vercel)
- Database connection pooling
- Redis caching

### Performance Optimization
- API response caching
- Database query optimization
- CDN for static assets
- Lazy loading

---

## 🧪 Testing Architecture

### Unit Tests
- Core library functions
- Utility functions
- License validation

### Integration Tests
- API endpoints
- Database operations
- ML model predictions

### E2E Tests
- User workflows
- CLI commands
- Dashboard interactions

---

## 📚 Related Documentation

- [Database](./database.md) - Database schema
- [Deployment](./deployment.md) - Deployment guide
- [ML Models](./ml-models.md) - ML architecture

---

**Last Updated:** January 2026

