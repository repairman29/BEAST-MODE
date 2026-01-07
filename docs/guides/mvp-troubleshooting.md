# MVP Troubleshooting Guide
## Common MVP-Specific Issues and Solutions

**Date:** January 2026  
**Version:** MVP 1.0

---

## 🎯 **MVP-Specific Issues**

### **Value Metrics Not Loading**

**Symptoms:**
- Value metrics show loading spinner indefinitely
- Metrics display as 0 or N/A
- Error message appears

**Solutions:**
1. **Check Authentication:**
   ```bash
   beast-mode status
   ```
   Verify you're logged in.

2. **Verify API Key:**
   - Go to Dashboard → Settings → API Keys
   - Ensure API key is set
   - Check API key is valid

3. **Check Network:**
   - Verify internet connection
   - Check if API endpoints are accessible
   - Review browser console for errors

4. **Clear Cache:**
   ```bash
   # Clear browser cache
   # Or in browser: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   ```

5. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Look for failed API requests

---

### **ROI Calculator Not Working**

**Symptoms:**
- Sliders don't respond
- Values don't update
- Calculator shows incorrect results

**Solutions:**
1. **JavaScript Enabled:**
   - Ensure JavaScript is enabled in browser
   - Check browser console for errors

2. **Browser Compatibility:**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Update browser to latest version

3. **Clear Cache:**
   - Clear browser cache
   - Hard refresh (Ctrl+F5 / Cmd+Shift+R)

4. **Check Console:**
   - Open Developer Tools
   - Check for JavaScript errors
   - Verify no blocked scripts

---

### **Performance Monitoring Missing Data**

**Symptoms:**
- Performance metrics show "No data"
- Metrics don't update
- Error loading performance data

**Solutions:**
1. **Check Permissions:**
   - Verify you have access to performance monitoring
   - Check subscription tier (some features require paid tier)

2. **API Connection:**
   - Verify API is accessible
   - Check network connectivity
   - Review API logs

3. **Wait for Data:**
   - Performance data may take time to collect
   - Check again after a few minutes
   - Ensure you've made some API calls

4. **Check Logs:**
   - Review server logs
   - Check error monitoring
   - Contact support if issues persist

---

### **E2E Tests Failing**

**Symptoms:**
- Tests fail with errors
- Tests timeout
- Tests don't run at all

**Solutions:**
1. **Environment Setup:**
   ```bash
   # Verify environment variables
   cat .env.local
   
   # Check required variables are set
   # BEAST_MODE_API_KEY
   # SUPABASE_URL
   # SUPABASE_ANON_KEY
   ```

2. **Dependencies:**
   ```bash
   # Reinstall dependencies
   npm install
   
   # Update dependencies
   npm update
   ```

3. **Test Configuration:**
   ```bash
   # Check test configuration
   cat website/scripts/test-e2e-flows.js
   
   # Verify test endpoints are correct
   ```

4. **Network Issues:**
   - Verify test environment is accessible
   - Check firewall settings
   - Review network connectivity

5. **Timeout Issues:**
   - Increase timeout in test configuration
   - Check server response times
   - Review performance metrics

---

### **Loading States Not Showing**

**Symptoms:**
- Components don't show loading spinners
- Loading states appear broken
- Inconsistent loading behavior

**Solutions:**
1. **Component Updates:**
   - Ensure components use `LoadingSpinner` component
   - Check component imports
   - Verify component is properly implemented

2. **Check Implementation:**
   ```typescript
   // Should use LoadingSpinner
   import LoadingSpinner from '../ui/LoadingSpinner';
   
   if (loading) {
     return <LoadingSpinner size="md" text="Loading..." />;
   }
   ```

3. **Clear Cache:**
   - Clear browser cache
   - Hard refresh page
   - Restart development server

---

### **Error States Not Displaying**

**Symptoms:**
- Errors don't show user-friendly messages
- Error states appear broken
- No retry buttons

**Solutions:**
1. **Component Updates:**
   - Ensure components use `ErrorMessage` component
   - Check component imports
   - Verify error handling

2. **Check Implementation:**
   ```typescript
   // Should use ErrorMessage
   import ErrorMessage from '../ui/ErrorMessage';
   
   if (error) {
     return (
       <ErrorMessage
         title="Error"
         message={error.message}
         onRetry={handleRetry}
       />
     );
   }
   ```

3. **Error Handling:**
   - Verify error objects are properly formatted
   - Check error messages are user-friendly
   - Ensure retry functions work

---

## 🔧 **General Troubleshooting**

### **Check System Status:**
```bash
# Check BEAST MODE status
beast-mode status

# Check API connectivity
curl https://beastmode.dev/api/health

# Check version
beast-mode --version
```

### **Review Logs:**
- Browser console (F12)
- Server logs
- Error monitoring dashboard
- Performance monitoring dashboard

### **Common Solutions:**
1. **Restart Services:**
   ```bash
   # Restart development server
   npm run dev
   
   # Restart AI services
   npm run services:restart
   ```

2. **Clear Cache:**
   - Browser cache
   - Application cache
   - API cache

3. **Update Dependencies:**
   ```bash
   npm update
   ```

4. **Check Environment:**
   ```bash
   # Verify environment variables
   cat .env.local
   ```

---

## 📞 **Getting Help**

### **Documentation:**
- [Getting Started Guide](./getting-started/README.md)
- [MVP User Guide](./mvp-user-guide.md)
- [FAQ](./faq.md)
- [API Documentation](./api.md)

### **Support:**
- **Email:** support@beastmode.dev
- **GitHub Issues:** [Report Issues](https://github.com/repairman29/BEAST-MODE/issues)
- **Community:** Join discussions

### **Before Contacting Support:**
1. Check this troubleshooting guide
2. Review related documentation
3. Check GitHub issues for similar problems
4. Gather error logs and screenshots

---

**Last Updated:** January 2026  
**MVP Version:** 1.0

