# BEAST MODE API Documentation

**Last Updated:** 2026-01-09  
**Base URL:** `https://beast-mode-website.vercel.app`

---

## 📋 Table of Contents

- [AB-TESTING](#ab-testing)
- [ALERTS](#alerts)
- [ANALYTICS](#analytics)
- [ANNOTATIONS](#annotations)
- [ANOMALIES](#anomalies)
- [API](#api)
- [API-DOCUMENTATION](#api-documentation)
- [API-KEYS](#api-keys)
- [AUDIT](#audit)
- [AUTO-COLLECT](#auto-collect)
- [BATCH-PROCESSING](#batch-processing)
- [BENCHMARK](#benchmark)
- [BILLING](#billing)
- [BITBUCKET](#bitbucket)
- [BOT](#bot)
- [BUG-TRACKING](#bug-tracking)
- [CACHE](#cache)
- [CHAT](#chat)
- [CIRCUIT-BREAKER](#circuit-breaker)
- [CODE-COMMENTS](#code-comments)
- [CODE-REVIEW](#code-review)
- [COLLABORATION](#collaboration)
- [COLLECT](#collect)
- [COMMENT](#comment)
- [COMPLIANCE](#compliance)
- [CONFIG](#config)
- [CONTEXT-AWARE-SELECTION](#context-aware-selection)
- [CONVERSATION](#conversation)
- [COST](#cost)
- [CREATE-CHECKOUT](#create-checkout)
- [CUSTOM](#custom)
- [CYCLE](#cycle)
- [DASHBOARD](#dashboard)
- [DATABASE](#database)
- [DEBUG](#debug)
- [DEPLOYMENTS](#deployments)
- [DISASTER-RECOVERY](#disaster-recovery)
- [DISCORD](#discord)
- [DOCUMENTATION](#documentation)
- [DRIFT-DETECTION](#drift-detection)
- [EMAIL](#email)
- [ENSEMBLE](#ensemble)
- [ENTERPRISE](#enterprise)
- [ERROR-ENHANCEMENT](#error-enhancement)
- [ERRORS](#errors)
- [EXPLAIN](#explain)
- [EXPORT](#export)
- [FEATURE-STORE](#feature-store)
- [FEEDBACK-LOOP](#feedback-loop)
- [FINE-TUNING](#fine-tuning)
- [GITHUB-ACTIONS](#github-actions)
- [GITLAB](#gitlab)
- [HEAL](#heal)
- [HEALTH](#health)
- [IMPROVE](#improve)
- [INDEX](#index)
- [INTEGRATIONS](#integrations)
- [INTELLIGENCE](#intelligence)
- [ISSUE-RECOMMENDATIONS](#issue-recommendations)
- [JANITOR](#janitor)
- [JIRA](#jira)
- [LATENCY](#latency)
- [LEARN](#learn)
- [LEARNING](#learning)
- [LIST](#list)
- [LOAD-BALANCE](#load-balance)
- [LOGS](#logs)
- [MARKETPLACE](#marketplace)
- [METRICS](#metrics)
- [MISSIONS](#missions)
- [MODEL-REGISTRY](#model-registry)
- [MODELS](#models)
- [MONITORING](#monitoring)
- [MULTI-FILE](#multi-file)
- [NOTIFY](#notify)
- [OAUTH](#oauth)
- [OPTIMIZE](#optimize)
- [PARTICIPANTS](#participants)
- [PERFORMANCE](#performance)
- [PERFORMANCE-OPTIMIZATION](#performance-optimization)
- [PLUGINS](#plugins)
- [PREDICT](#predict)
- [PREDICT-ALL](#predict-all)
- [PREDICTIONS](#predictions)
- [PRODUCTIVITY](#productivity)
- [PROMPTS](#prompts)
- [PROXY](#proxy)
- [QUALITY](#quality)
- [QUALITY-EXPLANATION](#quality-explanation)
- [QUALITY-ROUTING](#quality-routing)
- [RAILWAY](#railway)
- [RBAC](#rbac)
- [RECOMMENDATIONS](#recommendations)
- [REFACTOR](#refactor)
- [REFACTORING](#refactoring)
- [REPOS](#repos)
- [RESET-PASSWORD](#reset-password)
- [RESOURCES](#resources)
- [RETRAINING](#retraining)
- [SCALE](#scale)
- [SCAN](#scan)
- [SECURITY](#security)
- [SECURITY-ANALYSIS](#security-analysis)
- [SELF-IMPROVE](#self-improve)
- [SERVICES](#services)
- [SESSION](#session)
- [SESSIONS](#sessions)
- [SHARED-DASHBOARD](#shared-dashboard)
- [SIGNIN](#signin)
- [SIGNUP](#signup)
- [SLACK](#slack)
- [STATS](#stats)
- [STREAK](#streak)
- [SUBMIT](#submit)
- [SUGGESTIONS](#suggestions)
- [SURVEY](#survey)
- [TASK-SELECTION](#task-selection)
- [TEAM-WORKSPACE](#team-workspace)
- [TEAMS](#teams)
- [TEMPLATES](#templates)
- [TEST-GENERATION](#test-generation)
- [TESTS](#tests)
- [TOKEN](#token)
- [TRENDS](#trends)
- [TUNING](#tuning)
- [USAGE](#usage)
- [VALIDATE](#validate)
- [VERCEL](#vercel)

---

## AB-TESTING

### `GET /mlops/ab-testing`

A/B Testing API Provides A/B testing functionality for ML models Phase 3: Model Management Integration

**File:** `mlops/ab-testing/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/ab-testing`

A/B Testing API Provides A/B testing functionality for ML models Phase 3: Model Management Integration

**File:** `mlops/ab-testing/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ALERTS

### `GET /monitoring/alerts`

Monitoring Alerts API Provides production monitoring alerts Phase 1: Production Deployment

**File:** `monitoring/alerts/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /monitoring/alerts/rules`

Alert Rules API Manages alert rules and evaluates alerts Phase 1: Production Deployment

**File:** `monitoring/alerts/rules/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /monitoring/alerts/rules`

Alert Rules API Manages alert rules and evaluates alerts Phase 1: Production Deployment

**File:** `monitoring/alerts/rules/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /monitoring/alerts/notifications`

Notification Channels API Manages notification channels Phase 1: Production Deployment

**File:** `monitoring/alerts/notifications/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /monitoring/alerts/notifications`

Notification Channels API Manages notification channels Phase 1: Production Deployment

**File:** `monitoring/alerts/notifications/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ANALYTICS

### `GET /stripe/analytics`

Stripe Analytics API Fetches revenue and subscription analytics from Stripe

**File:** `stripe/analytics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /mlops/analytics`

Advanced Analytics API Provides advanced analytics functionality Phase 3: Feature Store & Advanced Analytics Integration

**File:** `mlops/analytics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/analytics`

Advanced Analytics API Provides advanced analytics functionality Phase 3: Feature Store & Advanced Analytics Integration

**File:** `mlops/analytics/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/analytics`

BEAST MODE Analytics API Privacy-first analytics endpoint that stores anonymized user engagement data

**File:** `beast-mode/analytics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/analytics`

BEAST MODE Analytics API Privacy-first analytics endpoint that stores anonymized user engagement data

**File:** `beast-mode/analytics/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/analytics/unified`

Unified Analytics API Provides comprehensive analytics view across: - CLI sessions - API usage - Cursor/IDE sessions - Web dashboard usage All tied to user's GitHub account

**File:** `beast-mode/analytics/unified/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## ANNOTATIONS

### `GET /collaboration/annotations`

BEAST MODE Collaboration Annotations API Manages annotations (comments, suggestions) in code review sessions

**File:** `collaboration/annotations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /collaboration/annotations`

BEAST MODE Collaboration Annotations API Manages annotations (comments, suggestions) in code review sessions

**File:** `collaboration/annotations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /collaboration/annotations`

BEAST MODE Collaboration Annotations API Manages annotations (comments, suggestions) in code review sessions

**File:** `collaboration/annotations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /collaboration/annotations`

BEAST MODE Collaboration Annotations API Manages annotations (comments, suggestions) in code review sessions

**File:** `collaboration/annotations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## ANOMALIES

### `GET /ml/anomalies`

Anomalies API Returns anomaly detection results Phase 1, Week 2: High-Impact Services Integration

**File:** `ml/anomalies/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /analytics/anomalies`

Anomaly Detection API

**File:** `analytics/anomalies/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /analytics/anomalies`

Anomaly Detection API

**File:** `analytics/anomalies/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## API

### `GET /multi-region`

Multi-Region API Unified multi-region operations (regions, replication, load balancing, failover, monitoring) Phase 3, Week 1: Multi-Region Deployment

**File:** `multi-region/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /multi-region`

Multi-Region API Unified multi-region operations (regions, replication, load balancing, failover, monitoring) Phase 3, Week 1: Multi-Region Deployment

**File:** `multi-region/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /health`

Health Check API Comprehensive health check for all services Phase 1: Production Deployment

**File:** `health/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /enterprise`

Enterprise API Unified enterprise operations (multi-tenant, RBAC, security, analytics) Phase 2, Week 1: Enterprise Unification

**File:** `enterprise/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /enterprise`

Enterprise API Unified enterprise operations (multi-tenant, RBAC, security, analytics) Phase 2, Week 1: Enterprise Unification

**File:** `enterprise/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /cost-tracking`

Cost Tracking API Provides cost tracking and savings analytics

**File:** `cost-tracking/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /analytics`

Aggregated Analytics API Combines data from multiple sources for comprehensive analytics

**File:** `analytics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## API-DOCUMENTATION

### `POST /llm/api-documentation`

API Documentation Generation API Generates OpenAPI/Swagger documentation

**File:** `llm/api-documentation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## API-KEYS

### `GET /customer/api-keys`

API endpoint

**File:** `customer/api-keys/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /customer/api-keys`

API endpoint

**File:** `customer/api-keys/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /customer/api-keys/[keyId]`

API endpoint

**File:** `customer/api-keys/[keyId]/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /auth/api-keys`

BEAST MODE API Key Management Generate and manage API keys for BEAST MODE subscriptions GET /api/auth/api-keys - List user's API keys POST /api/auth/api-keys - Generate new API key DELETE /api/auth/api-keys/[id] - Revoke API key

**File:** `auth/api-keys/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /auth/api-keys`

BEAST MODE API Key Management Generate and manage API keys for BEAST MODE subscriptions GET /api/auth/api-keys - List user's API keys POST /api/auth/api-keys - Generate new API key DELETE /api/auth/api-keys/[id] - Revoke API key

**File:** `auth/api-keys/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /auth/api-keys/[id]`

DELETE /api/auth/api-keys/[id] Revoke a BEAST MODE API key

**File:** `auth/api-keys/[id]/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## AUDIT

### `GET /enterprise/audit`

Audit Log API Enterprise audit logging and compliance

**File:** `enterprise/audit/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /enterprise/audit`

Audit Log API Enterprise audit logging and compliance

**File:** `enterprise/audit/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## AUTO-COLLECT

### `POST /feedback/auto-collect`

Auto Feedback Collection API Receives user actions and automatically collects feedback Phase 3: Automated Feedback Collection

**File:** `feedback/auto-collect/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## BATCH-PROCESSING

### `POST /llm/batch-processing`

Batch Processing API Batches similar LLM requests for efficiency

**File:** `llm/batch-processing/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## BENCHMARK

### `GET /repos/benchmark`

Repository Benchmarking API Compares a repository against the dataset to show percentiles and rankings User Stories: - Echeo: "As a developer, I want to see how my repos compare to others" - BEAST MODE: "As a developer, I want to know my repo's percentile ranking"

**File:** `repos/benchmark/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/benchmark`

Repository Benchmarking API Compares a repository against the dataset to show percentiles and rankings User Stories: - Echeo: "As a developer, I want to see how my repos compare to others" - BEAST MODE: "As a developer, I want to know my repo's percentile ranking"

**File:** `repos/benchmark/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## BILLING

### `GET /customer/billing`

API endpoint

**File:** `customer/billing/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## BITBUCKET

### `GET /integrations/bitbucket`

Bitbucket Integration API

**File:** `integrations/bitbucket/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/bitbucket`

Bitbucket Integration API

**File:** `integrations/bitbucket/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## BOT

### `POST /feedback/bot`

Bot/AI System Feedback API Collect feedback from AI systems and bots

**File:** `feedback/bot/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## BUG-TRACKING

### `GET /delivery/bug-tracking`

Bug Tracking API Tracks bugs per feature generation, bug rates, and trends

**File:** `delivery/bug-tracking/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /delivery/bug-tracking`

Bug Tracking API Tracks bugs per feature generation, bug rates, and trends

**File:** `delivery/bug-tracking/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CACHE

### `GET /optimization/cache`

Cache Optimization API Provides cache optimization functionality Phase 4: Performance Optimization

**File:** `optimization/cache/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/cache`

Cache Optimization API Provides cache optimization functionality Phase 4: Performance Optimization

**File:** `optimization/cache/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /llm/cache`

LLM Cache Management API Manages caching for LLM requests

**File:** `llm/cache/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /llm/cache`

LLM Cache Management API Manages caching for LLM requests

**File:** `llm/cache/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## CHAT

### `GET /codebase/chat`

Codebase Chat API Conversational interface for code generation and assistance. Similar to Cursor's chat feature.

**File:** `codebase/chat/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /codebase/chat`

Codebase Chat API Conversational interface for code generation and assistance. Similar to Cursor's chat feature.

**File:** `codebase/chat/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /codebase/chat`

Codebase Chat API Conversational interface for code generation and assistance. Similar to Cursor's chat feature.

**File:** `codebase/chat/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## CIRCUIT-BREAKER

### `GET /resilience/circuit-breaker`

Circuit Breaker API Provides circuit breaker management and execution Phase 3, Week 2: Resilience & Recovery

**File:** `resilience/circuit-breaker/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /resilience/circuit-breaker`

Circuit Breaker API Provides circuit breaker management and execution Phase 3, Week 2: Resilience & Recovery

**File:** `resilience/circuit-breaker/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CODE-COMMENTS

### `POST /llm/code-comments`

Code Comments API Generates inline comments and documentation for code

**File:** `llm/code-comments/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CODE-REVIEW

### `POST /ai/code-review`

Code Review Automation API

**File:** `ai/code-review/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## COLLABORATION

### `GET /beast-mode/collaboration/workspace`

BEAST MODE Team Workspace API Shared dashboards, team quality metrics, collaborative missions

**File:** `beast-mode/collaboration/workspace/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/collaboration/workspace`

BEAST MODE Team Workspace API Shared dashboards, team quality metrics, collaborative missions

**File:** `beast-mode/collaboration/workspace/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/collaboration/dashboard`

BEAST MODE Shared Dashboard API Team visibility, role-based access, collaborative insights

**File:** `beast-mode/collaboration/dashboard/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/collaboration/dashboard`

BEAST MODE Shared Dashboard API Team visibility, role-based access, collaborative insights

**File:** `beast-mode/collaboration/dashboard/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## COLLECT

### `POST /feedback/collect`

Unified Feedback Collection API Handles all types of feedback: users, bots, AI systems, surveys, comments

**File:** `feedback/collect/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## COMMENT

### `POST /feedback/comment`

Comment Feedback API Collect open-ended text feedback

**File:** `feedback/comment/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## COMPLIANCE

### `GET /enterprise/compliance`

Compliance API Enterprise compliance features (GDPR, SOC2, HIPAA)

**File:** `enterprise/compliance/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /enterprise/compliance`

Compliance API Enterprise compliance features (GDPR, SOC2, HIPAA)

**File:** `enterprise/compliance/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CONFIG

### `GET /github/config`

GitHub OAuth Configuration API Stores and retrieves GitHub OAuth credentials from Supabase

**File:** `github/config/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /github/config`

GitHub OAuth Configuration API Stores and retrieves GitHub OAuth credentials from Supabase

**File:** `github/config/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CONTEXT-AWARE-SELECTION

### `POST /llm/context-aware-selection`

Context-Aware Model Selection API Selects the best model based on code context

**File:** `llm/context-aware-selection/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CONVERSATION

### `POST /beast-mode/conversation`

BEAST MODE Conversation API Handles AI conversation requests

**File:** `beast-mode/conversation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## COST

### `GET /optimization/cost`

Cost Optimization API Provides cost optimization functionality Phase 4: Performance Optimization

**File:** `optimization/cost/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/cost`

Cost Optimization API Provides cost optimization functionality Phase 4: Performance Optimization

**File:** `optimization/cost/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CREATE-CHECKOUT

### `POST /stripe/create-checkout`

Stripe Checkout Session Creation Creates a Stripe checkout session for subscription

**File:** `stripe/create-checkout/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CUSTOM

### `GET /models/custom`

Custom Models API Register and manage custom AI models (self-hosted, OpenAI-compatible, etc.)

**File:** `models/custom/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /models/custom`

Custom Models API Register and manage custom AI models (self-hosted, OpenAI-compatible, etc.)

**File:** `models/custom/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /models/custom`

Custom Models API Register and manage custom AI models (self-hosted, OpenAI-compatible, etc.)

**File:** `models/custom/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `PATCH /models/custom`

Custom Models API Register and manage custom AI models (self-hosted, OpenAI-compatible, etc.)

**File:** `models/custom/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /models/custom/monitoring`

Custom Models Monitoring API Get metrics and health status for custom models

**File:** `models/custom/monitoring/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /models/custom/monitoring`

Custom Models Monitoring API Get metrics and health status for custom models

**File:** `models/custom/monitoring/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## CYCLE

### `GET /self-improvement/cycle`

POST /api/self-improvement/cycle Run a full improvement cycle (scan + improve + apply)

**File:** `self-improvement/cycle/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /self-improvement/cycle`

POST /api/self-improvement/cycle Run a full improvement cycle (scan + improve + apply)

**File:** `self-improvement/cycle/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DASHBOARD

### `GET /observability/dashboard`

Observability Dashboard API Provides comprehensive system observability including: - Cost tracking and savings - Service health - Performance metrics - Error rates

**File:** `observability/dashboard/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## DATABASE

### `GET /optimization/database`

Database Optimization API Provides database optimization functionality Phase 4: Performance Optimization

**File:** `optimization/database/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/database`

Database Optimization API Provides database optimization functionality Phase 4: Performance Optimization

**File:** `optimization/database/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ml/database/optimize`

Database Optimization API Optimizes database queries and provides recommendations Phase 1, Week 3: Enterprise Unification & Security Enhancement

**File:** `ml/database/optimize/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/database/optimize`

Database Optimization API Optimizes database queries and provides recommendations Phase 1, Week 3: Enterprise Unification & Security Enhancement

**File:** `ml/database/optimize/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DEBUG

### `GET /feedback/debug`

Feedback Debug API Check environment variables and feedback collector status

**File:** `feedback/debug/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## DEPLOYMENTS

### `GET /beast-mode/deployments`

BEAST MODE Deployments API Enterprise deployment orchestration across multiple platforms

**File:** `beast-mode/deployments/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/deployments`

BEAST MODE Deployments API Enterprise deployment orchestration across multiple platforms

**File:** `beast-mode/deployments/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/deployments/strategies`

Deployment Strategies API Get supported deployment strategies

**File:** `beast-mode/deployments/strategies/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/deployments/platforms`

Deployment Platforms API Get supported deployment platforms

**File:** `beast-mode/deployments/platforms/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/deployments/[id]/rollback`

BEAST MODE Deployment Rollback API Rolls back a deployment to the previous version

**File:** `beast-mode/deployments/[id]/rollback/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DISASTER-RECOVERY

### `GET /resilience/disaster-recovery`

Disaster Recovery API Provides backup and recovery operations Phase 3, Week 2: Resilience & Recovery

**File:** `resilience/disaster-recovery/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /resilience/disaster-recovery`

Disaster Recovery API Provides backup and recovery operations Phase 3, Week 2: Resilience & Recovery

**File:** `resilience/disaster-recovery/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DISCORD

### `GET /integrations/discord`

BEAST MODE Discord Integration API Sends notifications to Discord channels for community updates, plugin updates, and system status

**File:** `integrations/discord/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/discord`

BEAST MODE Discord Integration API Sends notifications to Discord channels for community updates, plugin updates, and system status

**File:** `integrations/discord/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DOCUMENTATION

### `POST /llm/documentation`

Documentation Generation API Generates Markdown documentation for code

**File:** `llm/documentation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ai/documentation`

Documentation Generation API

**File:** `ai/documentation/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ai/documentation`

Documentation Generation API

**File:** `ai/documentation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## DRIFT-DETECTION

### `GET /mlops/drift-detection`

Drift Detection API Provides data drift detection functionality Phase 3: MLOps Automation Integration

**File:** `mlops/drift-detection/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/drift-detection`

Drift Detection API Provides data drift detection functionality Phase 3: MLOps Automation Integration

**File:** `mlops/drift-detection/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## EMAIL

### `GET /integrations/email`

BEAST MODE Email Integration API Sends email notifications for weekly reports, critical alerts, and plugin updates

**File:** `integrations/email/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/email`

BEAST MODE Email Integration API Sends email notifications for weekly reports, critical alerts, and plugin updates

**File:** `integrations/email/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ENSEMBLE

### `POST /llm/ensemble`

Ensemble Model Responses API Combines responses from multiple models

**File:** `llm/ensemble/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ENTERPRISE

### `GET /beast-mode/enterprise/white-label`

BEAST MODE White-Label API Custom branding, domain customization, and theme customization

**File:** `beast-mode/enterprise/white-label/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/white-label`

BEAST MODE White-Label API Custom branding, domain customization, and theme customization

**File:** `beast-mode/enterprise/white-label/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/enterprise/users`

Enterprise Users API Manage users for enterprise organizations ⚠️ DEVELOPMENT ONLY: Example users below are for development/testing only. In production, this should connect to a real database (Supabase). These example users should NEVER appear in production UI or be shown to real users.

**File:** `beast-mode/enterprise/users/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/users`

Enterprise Users API Manage users for enterprise organizations ⚠️ DEVELOPMENT ONLY: Example users below are for development/testing only. In production, this should connect to a real database (Supabase). These example users should NEVER appear in production UI or be shown to real users.

**File:** `beast-mode/enterprise/users/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /beast-mode/enterprise/users`

Enterprise Users API Manage users for enterprise organizations ⚠️ DEVELOPMENT ONLY: Example users below are for development/testing only. In production, this should connect to a real database (Supabase). These example users should NEVER appear in production UI or be shown to real users.

**File:** `beast-mode/enterprise/users/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/enterprise/users`

Enterprise Users API Manage users for enterprise organizations ⚠️ DEVELOPMENT ONLY: Example users below are for development/testing only. In production, this should connect to a real database (Supabase). These example users should NEVER appear in production UI or be shown to real users.

**File:** `beast-mode/enterprise/users/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/enterprise/teams`

Enterprise Teams API Manage teams for enterprise organizations

**File:** `beast-mode/enterprise/teams/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/teams`

Enterprise Teams API Manage teams for enterprise organizations

**File:** `beast-mode/enterprise/teams/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /beast-mode/enterprise/teams`

Enterprise Teams API Manage teams for enterprise organizations

**File:** `beast-mode/enterprise/teams/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/enterprise/teams`

Enterprise Teams API Manage teams for enterprise organizations

**File:** `beast-mode/enterprise/teams/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/enterprise/sso`

BEAST MODE Enterprise SSO API SAML, OAuth, LDAP integration and single sign-on

**File:** `beast-mode/enterprise/sso/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/sso`

BEAST MODE Enterprise SSO API SAML, OAuth, LDAP integration and single sign-on

**File:** `beast-mode/enterprise/sso/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/enterprise/repos`

Enterprise Repositories API Manage repositories for enterprise organizations

**File:** `beast-mode/enterprise/repos/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/repos`

Enterprise Repositories API Manage repositories for enterprise organizations

**File:** `beast-mode/enterprise/repos/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /beast-mode/enterprise/repos`

Enterprise Repositories API Manage repositories for enterprise organizations

**File:** `beast-mode/enterprise/repos/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/enterprise/repos`

Enterprise Repositories API Manage repositories for enterprise organizations

**File:** `beast-mode/enterprise/repos/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/enterprise/integrations`

BEAST MODE Custom Integrations API API for custom integrations, webhook system, and extensibility

**File:** `beast-mode/enterprise/integrations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/enterprise/integrations`

BEAST MODE Custom Integrations API API for custom integrations, webhook system, and extensibility

**File:** `beast-mode/enterprise/integrations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ERROR-ENHANCEMENT

### `POST /llm/error-enhancement`

Error Message Enhancement API Enhances error messages with helpful context

**File:** `llm/error-enhancement/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ERRORS

### `GET /beast-mode/errors`

BEAST MODE Error Logging API Stores error logs for monitoring and debugging

**File:** `beast-mode/errors/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/errors`

BEAST MODE Error Logging API Stores error logs for monitoring and debugging

**File:** `beast-mode/errors/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## EXPLAIN

### `GET /ml/explain`

ML Explainability API Returns prediction explanations with feature importance and SHAP values Month 6: Week 2 - Explainability API

**File:** `ml/explain/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/explain`

ML Explainability API Returns prediction explanations with feature importance and SHAP values Month 6: Week 2 - Explainability API

**File:** `ml/explain/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## EXPORT

### `GET /ml/export`

BI Export API Exports performance data for BI tools Phase 1, Week 3: Enterprise Unification & Security Enhancement

**File:** `ml/export/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## FEATURE-STORE

### `GET /mlops/feature-store`

Feature Store API Provides feature store functionality Phase 3: Feature Store & Advanced Analytics Integration

**File:** `mlops/feature-store/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/feature-store`

Feature Store API Provides feature store functionality Phase 3: Feature Store & Advanced Analytics Integration

**File:** `mlops/feature-store/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## FEEDBACK-LOOP

### `GET /mlops/feedback-loop`

Feedback Loop API Provides feedback loop functionality for ML models Phase 2: Advanced MLOps Integration

**File:** `mlops/feedback-loop/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/feedback-loop`

Feedback Loop API Provides feedback loop functionality for ML models Phase 2: Advanced MLOps Integration

**File:** `mlops/feedback-loop/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## FINE-TUNING

### `GET /mlops/fine-tuning`

Model Fine-Tuning API Provides model fine-tuning functionality Phase 2: Advanced MLOps Integration

**File:** `mlops/fine-tuning/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/fine-tuning`

Model Fine-Tuning API Provides model fine-tuning functionality Phase 2: Advanced MLOps Integration

**File:** `mlops/fine-tuning/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /llm/fine-tuning`

Model Fine-Tuning API Collects training data and prepares for fine-tuning

**File:** `llm/fine-tuning/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## GITHUB-ACTIONS

### `GET /integrations/github-actions`

GitHub Actions Integration API

**File:** `integrations/github-actions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/github-actions`

GitHub Actions Integration API

**File:** `integrations/github-actions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ci/github-actions`

BEAST MODE GitHub Actions Integration API Provides endpoints for GitHub Actions workflows to interact with BEAST MODE

**File:** `ci/github-actions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ci/github-actions`

BEAST MODE GitHub Actions Integration API Provides endpoints for GitHub Actions workflows to interact with BEAST MODE

**File:** `ci/github-actions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## GITLAB

### `GET /integrations/gitlab`

GitLab Integration API

**File:** `integrations/gitlab/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/gitlab`

GitLab Integration API

**File:** `integrations/gitlab/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## HEAL

### `GET /beast-mode/heal`

BEAST MODE Self-Healing API Triggers automatic recovery for failed components

**File:** `beast-mode/heal/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/heal`

BEAST MODE Self-Healing API Triggers automatic recovery for failed components

**File:** `beast-mode/heal/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## HEALTH

### `GET /feedback/health`

Feedback Service Health Check Check if feedback service is running and healthy Phase 2: Enhanced with feedback monitoring

**File:** `feedback/health/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/health`

BEAST MODE Health Monitoring API Provides real-time health status of all system components

**File:** `beast-mode/health/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/health`

BEAST MODE Health Monitoring API Provides real-time health status of all system components

**File:** `beast-mode/health/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## IMPROVE

### `POST /self-improvement/improve`

POST /api/self-improvement/improve Generate and optionally apply improvements

**File:** `self-improvement/improve/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## INDEX

### `GET /codebase/index`

Codebase Indexing API Indexes a repository for fast search and context.

**File:** `codebase/index/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /codebase/index`

Codebase Indexing API Indexes a repository for fast search and context.

**File:** `codebase/index/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## INTEGRATIONS

### `GET /marketplace/integrations`

Integration Marketplace API Provides integration marketplace functionality Phase 2: Optimization Services Integration

**File:** `marketplace/integrations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /marketplace/integrations`

Integration Marketplace API Provides integration marketplace functionality Phase 2: Optimization Services Integration

**File:** `marketplace/integrations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## INTELLIGENCE

### `POST /beast-mode/intelligence/predictive-analytics`

BEAST MODE Predictive Analytics API Forecast future issues, risk prediction models, trend analysis

**File:** `beast-mode/intelligence/predictive-analytics/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/intelligence/code-review`

BEAST MODE Automated Code Review API AI-powered code review suggestions and pattern analysis

**File:** `beast-mode/intelligence/code-review/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/intelligence/advanced-recommendations`

BEAST MODE Advanced AI Recommendations API Neural code generation, context-aware completions, pattern recognition

**File:** `beast-mode/intelligence/advanced-recommendations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## ISSUE-RECOMMENDATIONS

### `POST /llm/issue-recommendations`

Issue Recommendations API Provides LLM-generated recommendations for code issues

**File:** `llm/issue-recommendations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## JANITOR

### `POST /beast-mode/janitor/vibe-restoration/restore/[stateId]`

POST /api/beast-mode/janitor/vibe-restoration/restore/[stateId] Restore code to a specific state

**File:** `beast-mode/janitor/vibe-restoration/restore/[stateId]/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/vibe-restoration/history`

GET /api/beast-mode/janitor/vibe-restoration/history Get vibe restoration history

**File:** `beast-mode/janitor/vibe-restoration/history/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/vibe-ops/create-test`

POST /api/beast-mode/janitor/vibe-ops/create-test Create a new Vibe Ops test from plain English description

**File:** `beast-mode/janitor/vibe-ops/create-test/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/status`

GET /api/beast-mode/janitor/status Get current status of all janitor features

**File:** `beast-mode/janitor/status/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/repo-memory/graph`

GET /api/beast-mode/janitor/repo-memory/graph Get repo memory graph

**File:** `beast-mode/janitor/repo-memory/graph/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/refactoring/history`

GET /api/beast-mode/janitor/refactoring/history Get refactoring history

**File:** `beast-mode/janitor/refactoring/history/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/refactor`

POST /api/beast-mode/janitor/refactor Trigger a manual refactoring run

**File:** `beast-mode/janitor/refactor/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/notifications`

GET /api/beast-mode/janitor/notifications Get janitor notifications

**File:** `beast-mode/janitor/notifications/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/notifications/[id]/read`

POST /api/beast-mode/janitor/notifications/[id]/read Mark notification as read

**File:** `beast-mode/janitor/notifications/[id]/read/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/metrics`

GET /api/beast-mode/janitor/metrics Get metrics over time for janitor features

**File:** `beast-mode/janitor/metrics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/invisible-cicd/logs`

GET /api/beast-mode/janitor/invisible-cicd/logs Get invisible CI/CD scan logs

**File:** `beast-mode/janitor/invisible-cicd/logs/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/errors`

POST /api/beast-mode/janitor/errors Log janitor errors for debugging

**File:** `beast-mode/janitor/errors/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/architecture/rules`

GET /api/beast-mode/janitor/architecture/rules Get all architecture rules

**File:** `beast-mode/janitor/architecture/rules/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/architecture/rules/[ruleId]`

POST /api/beast-mode/janitor/architecture/rules/[ruleId] Enable/disable a specific rule

**File:** `beast-mode/janitor/architecture/rules/[ruleId]/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/janitor/activity`

GET /api/beast-mode/janitor/activity Get recent janitor activity feed

**File:** `beast-mode/janitor/activity/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/janitor/[feature]`

POST /api/beast-mode/janitor/[feature] Enable/disable a specific janitor feature

**File:** `beast-mode/janitor/[feature]/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## JIRA

### `GET /integrations/jira`

Jira Integration API

**File:** `integrations/jira/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/jira`

Jira Integration API

**File:** `integrations/jira/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## LATENCY

### `GET /optimization/latency`

Latency Optimization API Provides latency optimization recommendations and status

**File:** `optimization/latency/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/latency`

Latency Optimization API Provides latency optimization recommendations and status

**File:** `optimization/latency/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## LEARN

### `GET /ml/learn`

Learning API Records learning outcomes for self-learning system Phase 2, Week 2: Self-Learning & Recommendation Engine Integration

**File:** `ml/learn/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/learn`

Learning API Records learning outcomes for self-learning system Phase 2, Week 2: Self-Learning & Recommendation Engine Integration

**File:** `ml/learn/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## LEARNING

### `GET /ai/learning`

Learning System API

**File:** `ai/learning/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ai/learning`

Learning System API

**File:** `ai/learning/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## LIST

### `GET /models/list`

List Models API Get list of available models (both provider models and custom models)

**File:** `models/list/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## LOAD-BALANCE

### `GET /ml/load-balance`

Load Balancing API Provides advanced load balancing and routing Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/load-balance/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/load-balance`

Load Balancing API Provides advanced load balancing and routing Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/load-balance/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## LOGS

### `GET /monitoring/logs`

Monitoring Logs API Provides production monitoring logs Phase 1: Production Deployment

**File:** `monitoring/logs/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## MARKETPLACE

### `GET /beast-mode/marketplace/updates`

BEAST MODE Plugin Updates API Handles plugin version checking and auto-updates

**File:** `beast-mode/marketplace/updates/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/updates`

BEAST MODE Plugin Updates API Handles plugin version checking and auto-updates

**File:** `beast-mode/marketplace/updates/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/sandbox`

BEAST MODE Plugin Sandbox API Manages sandbox configuration for plugin execution

**File:** `beast-mode/marketplace/sandbox/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/sandbox`

BEAST MODE Plugin Sandbox API Manages sandbox configuration for plugin execution

**File:** `beast-mode/marketplace/sandbox/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/reviews`

BEAST MODE Plugin Reviews API Handles plugin reviews and ratings

**File:** `beast-mode/marketplace/reviews/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/reviews`

BEAST MODE Plugin Reviews API Handles plugin reviews and ratings

**File:** `beast-mode/marketplace/reviews/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/marketplace/reviews`

BEAST MODE Plugin Reviews API Handles plugin reviews and ratings

**File:** `beast-mode/marketplace/reviews/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/recommendations`

BEAST MODE AI Recommendations API Provides AI-powered plugin recommendations based on user profile and project context

**File:** `beast-mode/marketplace/recommendations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/recommendations`

BEAST MODE AI Recommendations API Provides AI-powered plugin recommendations based on user profile and project context

**File:** `beast-mode/marketplace/recommendations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/plugins`

BEAST MODE Plugin Registry API Manages plugin registry, installation, and execution

**File:** `beast-mode/marketplace/plugins/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/plugins`

BEAST MODE Plugin Registry API Manages plugin registry, installation, and execution

**File:** `beast-mode/marketplace/plugins/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/permissions`

BEAST MODE Plugin Permissions API Handles plugin permission requests, grants, and management

**File:** `beast-mode/marketplace/permissions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/permissions`

BEAST MODE Plugin Permissions API Handles plugin permission requests, grants, and management

**File:** `beast-mode/marketplace/permissions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/marketplace/permissions`

BEAST MODE Plugin Permissions API Handles plugin permission requests, grants, and management

**File:** `beast-mode/marketplace/permissions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/installed`

BEAST MODE Installed Plugins API Manages installed plugins for users

**File:** `beast-mode/marketplace/installed/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/installed`

BEAST MODE Installed Plugins API Manages installed plugins for users

**File:** `beast-mode/marketplace/installed/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/marketplace/installed`

BEAST MODE Installed Plugins API Manages installed plugins for users

**File:** `beast-mode/marketplace/installed/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/install`

BEAST MODE Plugin Installation API Handles plugin installation requests from the marketplace

**File:** `beast-mode/marketplace/install/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/install`

BEAST MODE Plugin Installation API Handles plugin installation requests from the marketplace

**File:** `beast-mode/marketplace/install/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/execute`

BEAST MODE Plugin Execution API Executes installed plugins programmatically

**File:** `beast-mode/marketplace/execute/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/execute`

BEAST MODE Plugin Execution API Executes installed plugins programmatically

**File:** `beast-mode/marketplace/execute/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/dependencies`

BEAST MODE Plugin Dependencies API Handles dependency resolution, conflict detection, and auto-installation

**File:** `beast-mode/marketplace/dependencies/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/marketplace/dependencies`

BEAST MODE Plugin Dependencies API Handles dependency resolution, conflict detection, and auto-installation

**File:** `beast-mode/marketplace/dependencies/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/marketplace/analytics`

BEAST MODE Plugin Analytics API Tracks plugin usage, performance, and statistics

**File:** `beast-mode/marketplace/analytics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## METRICS

### `GET /monitoring/metrics`

Monitoring Metrics API Provides production monitoring metrics Phase 1: Production Deployment

**File:** `monitoring/metrics/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## MISSIONS

### `GET /beast-mode/missions`

BEAST MODE Missions API Mission creation, management, and tracking

**File:** `beast-mode/missions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/missions`

BEAST MODE Missions API Mission creation, management, and tracking

**File:** `beast-mode/missions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/missions/recommendations`

Mission Recommendations API AI-powered mission recommendations based on project context

**File:** `beast-mode/missions/recommendations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/missions/[id]`

Mission Management API Update or delete individual missions

**File:** `beast-mode/missions/[id]/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /beast-mode/missions/[id]`

Mission Management API Update or delete individual missions

**File:** `beast-mode/missions/[id]/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /beast-mode/missions/[id]`

Mission Management API Update or delete individual missions

**File:** `beast-mode/missions/[id]/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/missions/[id]/start`

Start Mission API Starts an existing mission

**File:** `beast-mode/missions/[id]/start/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## MODEL-REGISTRY

### `GET /mlops/model-registry`

Model Registry API Provides model registry and versioning functionality Phase 3: Model Management Integration

**File:** `mlops/model-registry/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/model-registry`

Model Registry API Provides model registry and versioning functionality Phase 3: Model Management Integration

**File:** `mlops/model-registry/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## MODELS

### `GET /optimization/models`

Models Optimization API Provides model optimization functionality Phase 4: Performance Optimization

**File:** `optimization/models/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/models`

Models Optimization API Provides model optimization functionality Phase 4: Performance Optimization

**File:** `optimization/models/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ml/models/compare`

Model Comparison API Compares performance of all available models Month 6: Week 2 - Model Comparison API

**File:** `ml/models/compare/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/models/compare`

Model Comparison API Compares performance of all available models Month 6: Week 2 - Model Comparison API

**File:** `ml/models/compare/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /marketplace/models`

Model Marketplace API

**File:** `marketplace/models/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /marketplace/models`

Model Marketplace API

**File:** `marketplace/models/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## MONITORING

### `GET /ml/monitoring`

ML Monitoring API Provides production monitoring data for ML system Month 3: Week 1 - Production Monitoring

**File:** `ml/monitoring/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/monitoring`

ML Monitoring API Provides production monitoring data for ML system Month 3: Week 1 - Production Monitoring

**File:** `ml/monitoring/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/monitoring/performance`

Performance Monitoring API Receives and stores performance metrics

**File:** `beast-mode/monitoring/performance/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/monitoring/performance`

Performance Monitoring API Receives and stores performance metrics

**File:** `beast-mode/monitoring/performance/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## MULTI-FILE

### `POST /codebase/multi-file`

Multi-File Editor API Handles editing multiple files simultaneously with dependency tracking.

**File:** `codebase/multi-file/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## NOTIFY

### `POST /feedback/notify`

Feedback Notification API Send notifications when feedback rate is low

**File:** `feedback/notify/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## OAUTH

### `GET /github/oauth/callback`

GitHub OAuth Callback Handles GitHub OAuth callback and stores user's GitHub token

**File:** `github/oauth/callback/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /github/oauth/authorize`

GitHub OAuth Authorization Initiates GitHub OAuth flow for user to connect their account This allows scanning of private repositories Now integrated with Supabase auth for proper user isolation

**File:** `github/oauth/authorize/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## OPTIMIZE

### `GET /ml/optimize`

Auto-Optimization API Triggers automatic optimization based on current performance Phase 1, Week 2: High-Impact Services Integration

**File:** `ml/optimize/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/optimize`

Auto-Optimization API Triggers automatic optimization based on current performance Phase 1, Week 2: High-Impact Services Integration

**File:** `ml/optimize/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PARTICIPANTS

### `GET /collaboration/participants`

BEAST MODE Collaboration Participants API Manages participants in collaboration sessions

**File:** `collaboration/participants/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /collaboration/participants`

BEAST MODE Collaboration Participants API Manages participants in collaboration sessions

**File:** `collaboration/participants/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /collaboration/participants`

BEAST MODE Collaboration Participants API Manages participants in collaboration sessions

**File:** `collaboration/participants/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## PERFORMANCE

### `GET /optimization/performance`

Performance Optimization API Provides performance tracking and optimization Phase 2: Optimization Services Integration

**File:** `optimization/performance/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/performance`

Performance Optimization API Provides performance tracking and optimization Phase 2: Optimization Services Integration

**File:** `optimization/performance/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ml/performance`

Performance Statistics API Returns real-time performance metrics Phase 1, Week 1: Production Integration

**File:** `ml/performance/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## PERFORMANCE-OPTIMIZATION

### `POST /llm/performance-optimization`

Performance Optimization API Suggests performance improvements for code

**File:** `llm/performance-optimization/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PLUGINS

### `GET /marketplace/plugins`

Plugin Marketplace API Provides plugin marketplace functionality Phase 2: Optimization Services Integration

**File:** `marketplace/plugins/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /marketplace/plugins`

Plugin Marketplace API Provides plugin marketplace functionality Phase 2: Optimization Services Integration

**File:** `marketplace/plugins/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PREDICT

### `GET /ml/predict`

ML Prediction API Provides ML quality predictions with intelligent routing to specialized services Routing Strategy: 1. Try specialized service (Code Roach, Oracle, etc.) if context matches 2. Fall back to BEAST MODE ML model if available 3. Fall back to heuristics Month 3: Week 1 - First Mate Integration Phase 1, Week 1: Production Integration (Error Handling, Performance Monitoring, Caching) Phase 2: Service Integration - Specialized ML services

**File:** `ml/predict/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/predict`

ML Prediction API Provides ML quality predictions with intelligent routing to specialized services Routing Strategy: 1. Try specialized service (Code Roach, Oracle, etc.) if context matches 2. Fall back to BEAST MODE ML model if available 3. Fall back to heuristics Month 3: Week 1 - First Mate Integration Phase 1, Week 1: Production Integration (Error Handling, Performance Monitoring, Caching) Phase 2: Service Integration - Specialized ML services

**File:** `ml/predict/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PREDICT-ALL

### `GET /ml/predict-all`

ML Predict All API Returns all prediction types: quality, latency, cost, satisfaction, resources Month 5: Week 3 - Expanded Predictions API

**File:** `ml/predict-all/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/predict-all`

ML Predict All API Returns all prediction types: quality, latency, cost, satisfaction, resources Month 5: Week 3 - Expanded Predictions API

**File:** `ml/predict-all/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PREDICTIONS

### `GET /analytics/predictions`

Predictive Analysis API

**File:** `analytics/predictions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /analytics/predictions`

Predictive Analysis API

**File:** `analytics/predictions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ai/predictions`

Predictive Capabilities API

**File:** `ai/predictions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ai/predictions`

Predictive Capabilities API

**File:** `ai/predictions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## PRODUCTIVITY

### `GET /delivery/productivity`

Developer Productivity API Tracks developer productivity metrics

**File:** `delivery/productivity/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## PROMPTS

### `GET /feedback/prompts`

Feedback Prompts API Get high-value predictions that need feedback

**File:** `feedback/prompts/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## PROXY

### `GET /cursor/proxy`

Cursor Proxy API Proxies Cursor's AI requests to BEAST MODE's custom models Provides OpenAI-compatible interface for Cursor

**File:** `cursor/proxy/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /cursor/proxy`

Cursor Proxy API Proxies Cursor's AI requests to BEAST MODE's custom models Provides OpenAI-compatible interface for Cursor

**File:** `cursor/proxy/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## QUALITY

### `GET /repos/quality`

Repository Quality API Provides quality predictions for GitHub repositories Serves both Echeo.io and Code-Beast.dev (BEAST MODE) platforms User Stories: - Echeo: "As a developer, I want my repo quality to factor into my trust score" - Echeo: "As a company, I want to verify repo quality before posting bounties" - BEAST MODE: "As a developer, I want instant quality scores for my repos" - BEAST MODE: "As a developer, I want to see what makes my repo high quality"

**File:** `repos/quality/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality`

Repository Quality API Provides quality predictions for GitHub repositories Serves both Echeo.io and Code-Beast.dev (BEAST MODE) platforms User Stories: - Echeo: "As a developer, I want my repo quality to factor into my trust score" - Echeo: "As a company, I want to verify repo quality before posting bounties" - BEAST MODE: "As a developer, I want instant quality scores for my repos" - BEAST MODE: "As a developer, I want to see what makes my repo high quality"

**File:** `repos/quality/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/validate`

Quality Validation API Validates that generated code meets quality standards.

**File:** `repos/quality/validate/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/themes`

Codebase Themes & Opportunities API Analyzes codebase for bigger themes, opportunities, and architectural insights. Goes beyond file-by-file to identify systemic patterns.

**File:** `repos/quality/themes/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /repos/quality/stats`

GET /api/repos/quality/stats Get quality API statistics (cache hits, misses, etc.)

**File:** `repos/quality/stats/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /repos/quality/monitoring`

GET /api/repos/quality/monitoring Get quality API monitoring metrics

**File:** `repos/quality/monitoring/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/improve`

Automated Quality Improvement API Improves repository quality from current score to target score. Phase 3: Automated Improvement Workflows

**File:** `repos/quality/improve/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /repos/quality/history`

Quality Improvement History API Retrieves quality improvement history, trends, and snapshots from Supabase.

**File:** `repos/quality/history/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/generate-feature`

Feature/Application Generation API Generates complete features or applications based on user requests and codebase context. Uses quality insights to create code that matches existing patterns.

**File:** `repos/quality/generate-feature/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/generate`

Quality-Driven Code Generation API Generates code (tests, CI/CD, docs) based on quality recommendations.

**File:** `repos/quality/generate/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/files`

File-Level Quality Analysis API Analyzes individual files in a repository and maps quality insights to specific code-level improvements.

**File:** `repos/quality/files/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/export-pdf`

POST /api/repos/quality/export-pdf Export repository quality data as a stunning PDF zine User Stories: - "As a developer, I want to export my quality report as a beautiful PDF" - "As a team lead, I want to share quality insights in a professional format"

**File:** `repos/quality/export-pdf/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/compare`

POST /api/repos/quality/compare Compare quality scores between repositories User Stories: - "As a developer, I want to compare my repo quality to competitors" - "As a team lead, I want to see quality differences across projects"

**File:** `repos/quality/compare/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /repos/quality/batch`

POST /api/repos/quality/batch Batch quality prediction endpoint User Stories: - "As a developer, I want to analyze multiple repos at once" - "As a team lead, I want to compare quality across my organization" Performance: Processes up to 50 repos in parallel

**File:** `repos/quality/batch/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /models/quality`

Model Quality API Tracks and reports on model quality metrics

**File:** `models/quality/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /models/quality`

Model Quality API Tracks and reports on model quality metrics

**File:** `models/quality/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /feedback/quality`

POST /api/feedback/quality Collect user feedback on quality predictions User Stories: - "As a user, I want to provide feedback on quality scores" - "As a developer, I want to improve the model based on feedback"

**File:** `feedback/quality/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /feedback/quality`

POST /api/feedback/quality Collect user feedback on quality predictions User Stories: - "As a user, I want to provide feedback on quality scores" - "As a developer, I want to improve the model based on feedback"

**File:** `feedback/quality/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## QUALITY-EXPLANATION

### `POST /llm/quality-explanation`

Quality Explanation API Provides LLM-generated explanations for quality scores

**File:** `llm/quality-explanation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## QUALITY-ROUTING

### `POST /llm/quality-routing`

Quality-Based Routing API Routes requests based on predicted quality

**File:** `llm/quality-routing/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## RAILWAY

### `GET /integrations/railway`

BEAST MODE Railway Integration API Provides endpoints for Railway deployments to interact with BEAST MODE

**File:** `integrations/railway/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /integrations/railway`

BEAST MODE Railway Integration API Provides endpoints for Railway deployments to interact with BEAST MODE

**File:** `integrations/railway/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## RBAC

### `GET /enterprise/rbac`

RBAC API Role-based access control

**File:** `enterprise/rbac/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /enterprise/rbac`

RBAC API Role-based access control

**File:** `enterprise/rbac/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /enterprise/rbac`

RBAC API Role-based access control

**File:** `enterprise/rbac/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## RECOMMENDATIONS

### `GET /ml/recommendations`

Recommendations API Provides personalized recommendations Phase 2, Week 2: Self-Learning & Recommendation Engine Integration

**File:** `ml/recommendations/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/recommendations`

Recommendations API Provides personalized recommendations Phase 2, Week 2: Self-Learning & Recommendation Engine Integration

**File:** `ml/recommendations/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## REFACTOR

### `POST /codebase/refactor`

Automated Refactoring API Analyzes and applies refactorings to improve code quality. Unique differentiator - competitors don't have this.

**File:** `codebase/refactor/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## REFACTORING

### `POST /llm/refactoring`

Refactoring Suggestions API Provides refactoring suggestions and code improvements

**File:** `llm/refactoring/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## REPOS

### `GET /github/repos`

GitHub Repositories API Fetches user's GitHub repositories (including private repos if connected)

**File:** `github/repos/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## RESET-PASSWORD

### `POST /auth/reset-password`

Password Reset API Sends password reset email to user

**File:** `auth/reset-password/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## RESOURCES

### `GET /optimization/resources`

Resource Optimization API Provides resource management and optimization Phase 2: Optimization Services Integration

**File:** `optimization/resources/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /optimization/resources`

Resource Optimization API Provides resource management and optimization Phase 2: Optimization Services Integration

**File:** `optimization/resources/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /ml/resources`

Resources API Provides resource optimization and management Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/resources/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/resources`

Resources API Provides resource optimization and management Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/resources/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## RETRAINING

### `GET /mlops/retraining`

Model Retraining API Provides automated model retraining functionality Phase 3: MLOps Automation Integration

**File:** `mlops/retraining/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /mlops/retraining`

Model Retraining API Provides automated model retraining functionality Phase 3: MLOps Automation Integration

**File:** `mlops/retraining/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SCALE

### `GET /ml/scale`

Scaling API Provides scaling decisions and management Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/scale/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/scale`

Scaling API Provides scaling decisions and management Phase 2, Week 3: Advanced Scaling Features

**File:** `ml/scale/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SCAN

### `GET /self-improvement/scan`

POST /api/self-improvement/scan Scan codebase for improvement opportunities

**File:** `self-improvement/scan/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /self-improvement/scan`

POST /api/self-improvement/scan Scan codebase for improvement opportunities

**File:** `self-improvement/scan/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /github/scan`

GitHub Repository Scanning API Scans a GitHub repository for code quality issues using GitHub API Supports private repos when user has connected their GitHub account

**File:** `github/scan/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SECURITY

### `GET /ml/security/validate`

Security Validation API Validates and sanitizes input data Phase 1, Week 3: Enterprise Unification & Security Enhancement

**File:** `ml/security/validate/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ml/security/validate`

Security Validation API Validates and sanitizes input data Phase 1, Week 3: Enterprise Unification & Security Enhancement

**File:** `ml/security/validate/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SECURITY-ANALYSIS

### `POST /llm/security-analysis`

Security Analysis API Analyzes code for security vulnerabilities

**File:** `llm/security-analysis/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SELF-IMPROVE

### `POST /beast-mode/self-improve`

Self-Improvement Analysis API Analyzes the BEAST MODE website itself and provides improvement recommendations

**File:** `beast-mode/self-improve/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/self-improve/apply-fix`

Apply Fix API Applies recommended fixes to the codebase with real file modifications

**File:** `beast-mode/self-improve/apply-fix/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SERVICES

### `GET /health/services`

Service Health Check API Detailed health check for individual services Phase 1: Production Deployment

**File:** `health/services/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## SESSION

### `POST /cursor/session`

Cursor/IDE Session Tracking API Tracks Cursor IDE sessions and activity Can be called from Cursor extension or webhook

**File:** `cursor/session/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SESSIONS

### `GET /collaboration/sessions`

BEAST MODE Real-Time Collaboration API Manages live code review sessions and team workspaces

**File:** `collaboration/sessions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /collaboration/sessions`

BEAST MODE Real-Time Collaboration API Manages live code review sessions and team workspaces

**File:** `collaboration/sessions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `PUT /collaboration/sessions`

BEAST MODE Real-Time Collaboration API Manages live code review sessions and team workspaces

**File:** `collaboration/sessions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /collaboration/sessions`

BEAST MODE Real-Time Collaboration API Manages live code review sessions and team workspaces

**File:** `collaboration/sessions/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /beast-mode/sessions/track`

Unified Session Tracking API Tracks sessions from CLI, API, Cursor/IDE, and Web All tied to user's GitHub account

**File:** `beast-mode/sessions/track/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /beast-mode/sessions/track`

Unified Session Tracking API Tracks sessions from CLI, API, Cursor/IDE, and Web All tied to user's GitHub account

**File:** `beast-mode/sessions/track/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SHARED-DASHBOARD

### `GET /collaboration/shared-dashboard`

Shared Dashboard API Provides shared dashboard functionality Phase 2: Collaboration Services Integration

**File:** `collaboration/shared-dashboard/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /collaboration/shared-dashboard`

Shared Dashboard API Provides shared dashboard functionality Phase 2: Collaboration Services Integration

**File:** `collaboration/shared-dashboard/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SIGNIN

### `POST /auth/signin`

Sign In API Real authentication with Supabase or fallback to simple JWT

**File:** `auth/signin/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SIGNUP

### `POST /auth/signup`

Sign Up API Real user registration with Supabase or fallback

**File:** `auth/signup/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SLACK

### `POST /integrations/slack`

Slack Integration API

**File:** `integrations/slack/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## STATS

### `GET /feedback/stats`

GET /api/feedback/stats Get ML feedback collection statistics

**File:** `feedback/stats/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## STREAK

### `GET /feedback/streak`

Feedback Streak API Track user feedback streaks and incentives Phase 3: Feedback Incentives (Optional)

**File:** `feedback/streak/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## SUBMIT

### `POST /feedback/submit`

Submit Feedback API Record feedback for a prediction

**File:** `feedback/submit/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SUGGESTIONS

### `POST /codebase/suggestions`

Real-Time Code Suggestions API Provides inline code completion and suggestions. Similar to GitHub Copilot.

**File:** `codebase/suggestions/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## SURVEY

### `POST /feedback/survey`

Survey Feedback API Collect structured survey responses

**File:** `feedback/survey/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TASK-SELECTION

### `POST /llm/task-selection`

Task-Specific Model Selection API Selects models optimized for specific tasks

**File:** `llm/task-selection/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TEAM-WORKSPACE

### `GET /collaboration/team-workspace`

Team Workspace API Provides team workspace functionality Phase 2: Collaboration Services Integration

**File:** `collaboration/team-workspace/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /collaboration/team-workspace`

Team Workspace API Provides team workspace functionality Phase 2: Collaboration Services Integration

**File:** `collaboration/team-workspace/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TEAMS

### `GET /enterprise/teams`

Teams API Enterprise team management

**File:** `enterprise/teams/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /enterprise/teams`

Teams API Enterprise team management

**File:** `enterprise/teams/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /enterprise/teams`

Teams API Enterprise team management

**File:** `enterprise/teams/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `PATCH /enterprise/teams`

Teams API Enterprise team management

**File:** `enterprise/teams/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TEMPLATES

### `GET /marketplace/templates`

Model Templates API

**File:** `marketplace/templates/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /marketplace/templates`

Model Templates API

**File:** `marketplace/templates/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TEST-GENERATION

### `POST /llm/test-generation`

Test Generation API Generates comprehensive tests for code

**File:** `llm/test-generation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ai/test-generation`

Intelligent Test Generation API

**File:** `ai/test-generation/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TESTS

### `POST /codebase/tests/generate`

Automated Test Generation API Generates tests for files automatically. Unique differentiator - competitors don't have this.

**File:** `codebase/tests/generate/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /codebase/tests/execute`

Test Execution API Executes generated tests and reports results.

**File:** `codebase/tests/execute/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /codebase/tests/execute`

Test Execution API Executes generated tests and reports results.

**File:** `codebase/tests/execute/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## TOKEN

### `GET /github/token`

GitHub Token Management API Stores and retrieves encrypted GitHub tokens for users

**File:** `github/token/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /github/token`

GitHub Token Management API Stores and retrieves encrypted GitHub tokens for users

**File:** `github/token/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `DELETE /github/token`

GitHub Token Management API Stores and retrieves encrypted GitHub tokens for users

**File:** `github/token/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## TRENDS

### `GET /ml/trends`

Trends API Returns trend analysis for performance metrics Phase 1, Week 2: High-Impact Services Integration

**File:** `ml/trends/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## TUNING

### `GET /models/tuning`

Model Tuning API Provides model performance tuning recommendations

**File:** `models/tuning/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /models/tuning`

Model Tuning API Provides model performance tuning recommendations

**File:** `models/tuning/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## USAGE

### `GET /customer/usage`

API endpoint

**File:** `customer/usage/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `GET /auth/usage`

API Usage Tracking API Returns current API usage for the authenticated user GET /api/auth/usage Headers: Authorization: Bearer <api_key>

**File:** `auth/usage/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /auth/usage`

API Usage Tracking API Returns current API usage for the authenticated user GET /api/auth/usage Headers: Authorization: Bearer <api_key>

**File:** `auth/usage/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## VALIDATE

### `GET /auth/validate`

License Validation API Validates BEAST MODE API keys and returns subscription tier GET /api/auth/validate Headers: Authorization: Bearer <api_key>

**File:** `auth/validate/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

## VERCEL

### `GET /ci/vercel`

BEAST MODE Vercel Integration API Provides endpoints for Vercel deployments to interact with BEAST MODE

**File:** `ci/vercel/route.ts`

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ci/vercel`

BEAST MODE Vercel Integration API Provides endpoints for Vercel deployments to interact with BEAST MODE

**File:** `ci/vercel/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

### `POST /ci/vercel/webhook`

BEAST MODE Vercel Webhook Receives deployment events from Vercel and runs quality checks

**File:** `ci/vercel/webhook/route.ts`

**Request Body:**
```json
{
  // Request body schema
}
```

**Response:**
```json
{
  // Response schema
}
```

---

## Authentication

Most endpoints require authentication. Include your authentication token in the request:

```
Authorization: Bearer <your-token>
```

---

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

---

## Rate Limiting

API requests are rate-limited. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Support

For API support, please contact: support@beastmode.dev

