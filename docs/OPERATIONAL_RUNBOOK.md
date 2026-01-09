# BEAST MODE - Operational Runbook

**Last Updated:** January 9, 2026  
**Purpose:** Troubleshooting guide and incident response procedures

---

## 🚨 **INCIDENT RESPONSE**

### **Severity Levels**

- **P0 - Critical**: Service completely down, data loss, security breach
- **P1 - High**: Major feature broken, significant performance degradation
- **P2 - Medium**: Minor feature broken, moderate performance issues
- **P3 - Low**: Cosmetic issues, minor bugs

### **Response Times**

- **P0**: Immediate response (< 5 minutes)
- **P1**: < 30 minutes
- **P2**: < 4 hours
- **P3**: < 24 hours

---

## 🔍 **TROUBLESHOOTING GUIDE**

### **1. Service Health Check**

**Problem:** Service appears down or unhealthy

**Steps:**
1. Check health endpoint: `curl https://beast-mode-website.vercel.app/api/health`
2. Check detailed health: `curl https://beast-mode-website.vercel.app/api/health?level=detailed`
3. Check Vercel deployment status: `vercel ls`
4. Check Supabase status: `supabase status --linked`

**Common Issues:**
- **503 Service Unavailable**: Check database connection
- **500 Internal Server Error**: Check application logs in Vercel
- **Timeout**: Check API response times, may need to increase timeout

**Resolution:**
- Restart service: `vercel --prod --yes` (redeploy)
- Check environment variables in Vercel dashboard
- Review error logs in Vercel dashboard → Functions → Logs

---

### **2. Database Connection Issues**

**Problem:** Database queries failing, connection errors

**Steps:**
1. Verify Supabase connection:
   ```bash
   cd BEAST-MODE-PRODUCT
   supabase status --linked
   ```

2. Test database connection:
   ```bash
   curl https://beast-mode-website.vercel.app/api/health?level=full
   ```

3. Check Supabase dashboard for:
   - Database status
   - Connection pool usage
   - Query performance

**Common Issues:**
- **Connection timeout**: Database may be overloaded
- **Authentication error**: Check `SUPABASE_SERVICE_ROLE_KEY` in Vercel
- **RLS policy blocking**: Check Row Level Security policies

**Resolution:**
- Verify environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase dashboard for connection issues
- Review RLS policies if queries are blocked
- Scale database if needed (Supabase dashboard)

---

### **3. API Endpoint Errors**

**Problem:** Specific API endpoint returning errors

**Steps:**
1. Test endpoint directly:
   ```bash
   curl -X POST https://beast-mode-website.vercel.app/api/<endpoint> \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. Check Vercel function logs:
   - Vercel Dashboard → Project → Functions → Select function → Logs

3. Check error tracking (Sentry):
   - Review Sentry dashboard for error details

**Common Issues:**
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Route doesn't exist or incorrect path
- **500 Internal Server Error**: Application error, check logs

**Resolution:**
- Review request format and parameters
- Check authentication token
- Review application logs for stack traces
- Fix code issue and redeploy

---

### **4. Build Failures**

**Problem:** Deployment fails during build

**Steps:**
1. Check build logs in Vercel dashboard
2. Test build locally:
   ```bash
   cd BEAST-MODE-PRODUCT/website
   npm run build
   ```

3. Check for:
   - TypeScript errors
   - Missing dependencies
   - Environment variable issues

**Common Issues:**
- **TypeScript errors**: Fix type errors in code
- **Missing dependencies**: Run `npm install`
- **Build timeout**: Optimize build process

**Resolution:**
- Fix TypeScript errors
- Update dependencies: `npm install`
- Optimize build configuration
- Redeploy: `vercel --prod --yes`

---

### **5. Performance Issues**

**Problem:** Slow response times, timeouts

**Steps:**
1. Check performance metrics:
   ```bash
   curl https://beast-mode-website.vercel.app/api/monitoring/metrics
   ```

2. Review Vercel Analytics:
   - Vercel Dashboard → Analytics
   - Check response times, error rates

3. Check database performance:
   - Supabase Dashboard → Database → Performance

**Common Issues:**
- **Slow database queries**: Optimize queries, add indexes
- **Large response payloads**: Implement pagination
- **Cold starts**: Consider keeping functions warm

**Resolution:**
- Optimize database queries
- Add caching where appropriate
- Implement pagination for large datasets
- Consider upgrading Vercel plan for better performance

---

### **6. Authentication Issues**

**Problem:** Users can't log in, OAuth failing

**Steps:**
1. Check GitHub OAuth:
   ```bash
   curl https://beast-mode-website.vercel.app/api/github/oauth/authorize
   ```

2. Verify environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_REDIRECT_URI`

3. Check Supabase auth:
   - Supabase Dashboard → Authentication

**Common Issues:**
- **OAuth redirect mismatch**: Verify `GITHUB_REDIRECT_URI` matches GitHub app settings
- **Invalid client secret**: Check `GITHUB_CLIENT_SECRET` in Vercel
- **Session expired**: Check JWT token expiration

**Resolution:**
- Verify GitHub OAuth app settings match environment variables
- Check redirect URI matches exactly
- Review Supabase auth configuration
- Clear user sessions if needed

---

## 🔄 **ROLLBACK PROCEDURES**

### **Quick Rollback**

**Via Vercel CLI:**
```bash
cd BEAST-MODE-PRODUCT/website
vercel rollback
```

**Via Vercel Dashboard:**
1. Go to Vercel Dashboard → Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### **Database Rollback**

**If migration caused issues:**
```bash
cd BEAST-MODE-PRODUCT
supabase migration repair --status reverted <migration_version> --linked
```

**Manual SQL rollback:**
1. Go to Supabase Dashboard → SQL Editor
2. Run reverse migration SQL
3. Verify tables/data restored

---

## 📊 **MONITORING & ALERTING**

### **Health Checks**

**Automated Checks:**
- Health endpoint: `/api/health` (every 5 minutes)
- Detailed health: `/api/health?level=detailed` (every 15 minutes)
- Service health: `/api/health/services` (every 30 minutes)

**Set up monitoring:**
- Uptime monitoring: Use service like Pingdom, UptimeRobot
- Error tracking: Sentry (configured)
- Performance: Vercel Analytics

### **Key Metrics to Monitor**

1. **Availability**: Target 99.9% uptime
2. **Response Time**: Target < 500ms (p95)
3. **Error Rate**: Target < 1%
4. **Database Connections**: Monitor pool usage
5. **API Usage**: Track request volume

---

## 🛠️ **COMMON OPERATIONS**

### **View Logs**

**Vercel Logs:**
```bash
vercel logs <deployment-url>
```

**Or via Dashboard:**
- Vercel Dashboard → Project → Functions → Select function → Logs

### **Check Environment Variables**

**Via CLI:**
```bash
cd BEAST-MODE-PRODUCT/website
vercel env ls
```

**Via Dashboard:**
- Vercel Dashboard → Project → Settings → Environment Variables

### **Apply Database Migrations**

```bash
cd BEAST-MODE-PRODUCT
supabase db push --linked --include-all --yes
```

### **Validate Production Deployment**

```bash
cd BEAST-MODE-PRODUCT
node scripts/validate-production-deployment.js
```

---

## 🔐 **SECURITY INCIDENTS**

### **Suspected Security Breach**

**Immediate Actions:**
1. Rotate all API keys and secrets
2. Review access logs
3. Check for unauthorized access
4. Notify team immediately

**Steps:**
1. Rotate Supabase service role key
2. Rotate GitHub OAuth secrets
3. Rotate JWT secret
4. Review Vercel access logs
5. Check Supabase audit logs

### **Data Leak**

**Immediate Actions:**
1. Identify scope of leak
2. Notify affected users (if applicable)
3. Patch vulnerability
4. Review access controls

---

## 📞 **ESCALATION**

### **When to Escalate**

- P0 incidents that can't be resolved in 15 minutes
- Security breaches
- Data loss or corruption
- Extended downtime (> 1 hour)

### **Escalation Contacts**

- **Primary**: Development team lead
- **Secondary**: Infrastructure team
- **Emergency**: On-call engineer

---

## 📝 **POST-INCIDENT**

### **Incident Report Template**

1. **Incident Summary**
   - What happened?
   - When did it occur?
   - Impact (users affected, duration)

2. **Root Cause**
   - What caused the incident?
   - Why did it happen?

3. **Resolution**
   - How was it fixed?
   - Time to resolution

4. **Prevention**
   - What can prevent this in the future?
   - Action items

5. **Lessons Learned**
   - What went well?
   - What could be improved?

---

## 🔗 **QUICK LINKS**

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Sentry Dashboard**: https://sentry.io (if configured)
- **GitHub OAuth Apps**: https://github.com/settings/developers
- **Health Check**: https://beast-mode-website.vercel.app/api/health
- **API Documentation**: `/docs/API_DOCUMENTATION.md`

---

**Last Updated:** January 9, 2026  
**Maintained By:** BEAST MODE Operations Team
