# Production Configuration Guide

**Date**: 2026-01-01  
**Status**: 📋 **Production Setup**

---

## 🎯 **OVERVIEW**

This guide covers production configuration for BEAST MODE website deployment.

---

## 📋 **VERCEL CONFIGURATION**

### **Current Configuration** (`vercel.json`):
- Framework: Next.js
- Regions: `iad1` (US East)
- API routes: 30s max duration
- CORS: Enabled for API routes
- Caching: Configured for static assets

### **Production Optimizations**:
- ✅ API route caching (60s with stale-while-revalidate)
- ✅ Static asset caching (1 year immutable)
- ✅ CORS headers configured
- ✅ Build command configured

---

## 📋 **NEXT.JS CONFIGURATION**

### **Production Settings** (`next.config.js`):
- ✅ React Strict Mode enabled
- ✅ SWC minification enabled
- ✅ Compression enabled
- ✅ Powered-by header disabled
- ✅ CSS optimization enabled

### **API Configuration**:
- ✅ CORS headers configured
- ✅ Cache control headers
- ✅ API route optimization

---

## 📋 **ENVIRONMENT VARIABLES**

### **Required in Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://playsmuggler.com
NODE_ENV=production
```

### **Optional Variables**:
- Monitoring (Datadog, New Relic)
- Alerts (Slack, PagerDuty)
- Feature flags
- Performance settings

---

## 📋 **DATABASE CONFIGURATION**

### **Supabase Production Setup**:
1. **Connection**: Uses `NEXT_PUBLIC_SUPABASE_URL` and keys
2. **Connection Pooling**: Handled by Supabase
3. **SSL**: Required for production
4. **Timeouts**: Configured in Supabase dashboard

### **Verification**:
```bash
# Test database connection
npm run verify:env
```

---

## 📋 **DEPLOYMENT STEPS**

### **1. Pre-Deployment**:
```bash
# Verify environment
npm run verify:env

# Test production build
npm run test:production-build
```

### **2. Deploy**:
```bash
cd website
vercel --prod --yes
```

### **3. Verify**:
```bash
# Check health
curl https://your-domain.com/api/health

# Check detailed health
curl https://your-domain.com/api/health?level=detailed
```

---

## 📋 **MONITORING SETUP**

### **Vercel Analytics** (Built-in):
- Automatic performance monitoring
- Real-time metrics
- Error tracking

### **Custom Monitoring** (Optional):
- Datadog integration
- New Relic integration
- Custom dashboards

---

## ✅ **CHECKLIST**

- [ ] Vercel configuration reviewed
- [ ] Next.js configuration reviewed
- [ ] Environment variables set in Vercel
- [ ] Production build tested
- [ ] Health checks verified
- [ ] Database connection verified
- [ ] Deployment procedure documented

---

**Status**: 📋 **Production Configuration Guide Complete!**

