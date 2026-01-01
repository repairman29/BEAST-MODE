# Environment Setup Guide

**Date**: 2026-01-01  
**Status**: 📋 **Production Setup**

---

## 🎯 **OVERVIEW**

This guide covers environment variable setup for production deployment.

---

## 📋 **REQUIRED ENVIRONMENT VARIABLES**

### **Database (Supabase)**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

### **Deployment**
- `NODE_ENV=production` - Environment mode
- `VERCEL_ENV=production` - Vercel environment
- `NEXT_PUBLIC_APP_URL` - Production URL (e.g., https://playsmuggler.com)

---

## 📋 **OPTIONAL ENVIRONMENT VARIABLES**

### **Monitoring**
- `DATADOG_API_KEY` - Datadog API key (if using Datadog)
- `DATADOG_APP_KEY` - Datadog application key
- `NEW_RELIC_LICENSE_KEY` - New Relic license key (if using New Relic)

### **Alerts**
- `SLACK_WEBHOOK_URL` - Slack webhook for alerts
- `PAGERDUTY_API_KEY` - PagerDuty API key for critical alerts

### **Feature Flags**
- `NEXT_PUBLIC_ENABLE_MULTI_REGION` - Enable multi-region features
- `NEXT_PUBLIC_ENABLE_CIRCUIT_BREAKER` - Enable circuit breaker
- `NEXT_PUBLIC_ENABLE_DISASTER_RECOVERY` - Enable disaster recovery
- `NEXT_PUBLIC_ENABLE_MONITORING` - Enable monitoring

### **Performance**
- `NEXT_PUBLIC_CACHE_ENABLED` - Enable caching
- `NEXT_PUBLIC_CACHE_TTL` - Cache TTL in seconds
- `NEXT_PUBLIC_MAX_CACHE_SIZE` - Maximum cache size

### **Security**
- `NEXT_PUBLIC_ENABLE_SECURITY_ENHANCEMENTS` - Enable security features
- `NEXT_PUBLIC_RATE_LIMIT_ENABLED` - Enable rate limiting
- `NEXT_PUBLIC_RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `NEXT_PUBLIC_RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds

---

## 🔐 **API KEY MANAGEMENT**

**IMPORTANT**: API keys are stored in Supabase, NOT in environment variables.

### **Supported Providers**:
- OpenAI (`sk-...`)
- Anthropic (`sk-ant-...`)
- Gemini (`AIza...`)
- Replicate (`r8_...`)
- ElevenLabs (`sk_...`)
- Groq (`gsk_...`)

### **Storage**:
- Table: `user_api_keys` in Supabase
- Encrypted before storage
- Retrieved per-user per-request

---

## 🚀 **SETUP INSTRUCTIONS**

### **1. Vercel Environment Variables**

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each required variable
5. Set environment to "Production"
6. Save

### **2. Local Development**

1. Copy `.env.production.example` to `.env.local`
2. Fill in your values
3. Never commit `.env.local` to git

### **3. Verification**

```bash
# Check environment variables are set
npm run verify:env

# Test health check
curl https://your-domain.com/api/health
```

---

## ✅ **CHECKLIST**

- [ ] Supabase credentials configured
- [ ] Production URL configured
- [ ] Monitoring configured (optional)
- [ ] Alerts configured (optional)
- [ ] Feature flags set
- [ ] Performance settings configured
- [ ] Security settings configured
- [ ] Environment variables verified

---

**Status**: 📋 **Environment Setup Guide Complete!**

