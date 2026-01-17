# BEAST MODE Model Configuration Plan

## Overview

This plan outlines the comprehensive setup of all BEAST MODE models for code generation and related AI capabilities.

## Current State

- ✅ Database schema exists (`custom_models` table)
- ✅ Model router infrastructure ready
- ✅ LLMCodeGenerator ready to use models
- ❌ No models currently configured
- ❌ Supabase connection needs verification

## Required Models

### 1. Primary Code Generation Model
- **Model ID:** `beast-mode-code-generator`
- **Purpose:** Main code generation for BEAST MODE
- **Priority:** P0 (Critical)
- **Provider:** `openai-compatible` or `custom`
- **Status:** Not configured

### 2. Quality Analysis Model (Optional)
- **Model ID:** `beast-mode-quality-analyzer`
- **Purpose:** Code quality analysis and scoring
- **Priority:** P1 (High)
- **Provider:** `openai-compatible` or `custom`
- **Status:** Not configured

### 3. Code Explanation Model (Optional)
- **Model ID:** `beast-mode-code-explainer`
- **Purpose:** Code explanation and documentation
- **Priority:** P2 (Medium)
- **Provider:** `openai-compatible` or `custom`
- **Status:** Not configured

## Configuration Steps

### Phase 1: Verify Infrastructure
1. ✅ Check Supabase connection
2. ✅ Verify `custom_models` table exists
3. ✅ Verify RLS policies allow service role access
4. ✅ Test database connectivity

### Phase 2: Determine Model Endpoints
1. Identify available model endpoints
2. Determine if using:
   - Self-hosted models (local/cloud)
   - OpenAI-compatible API
   - Anthropic-compatible API
   - Custom BEAST MODE model service
3. Get endpoint URLs and API keys if needed

### Phase 3: Configure Primary Model
1. Create `beast-mode-code-generator` model
2. Configure endpoint URL
3. Set provider type
4. Configure model parameters (temperature, max_tokens)
5. Activate model
6. Test code generation

### Phase 4: Configure Optional Models (if needed)
1. Configure quality analyzer model
2. Configure code explainer model
3. Test each model

### Phase 5: Verification & Testing
1. Run test suite
2. Verify code generation works
3. Test all configured models
4. Document configuration

## Model Endpoint Options

### Option 1: Self-Hosted Model
- Run your own model server (Ollama, vLLM, etc.)
- Endpoint: `http://localhost:11434/v1/chat/completions` (example)
- Provider: `openai-compatible`

### Option 2: Cloud Model Service
- Use cloud-hosted model API
- Endpoint: `https://api.your-model-service.com/v1/chat/completions`
- Provider: `openai-compatible` or `custom`

### Option 3: BEAST MODE Model Service
- Use BEAST MODE's own model infrastructure
- Endpoint: `https://api.beast-mode.dev/v1/chat/completions` (if available)
- Provider: `beast-mode`

## Configuration Script

We'll create a comprehensive script that:
1. Checks current models
2. Prompts for model endpoints
3. Creates/updates models
4. Tests each model
5. Provides verification

## Success Criteria

✅ At least one active model configured
✅ Code generation tests pass
✅ Model router can find and use models
✅ LLMCodeGenerator successfully generates code

## Next Steps

1. Fix Supabase connection issue
2. Create comprehensive configuration script
3. Execute model setup
4. Test and verify
