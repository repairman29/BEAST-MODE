# Production Module Loading Guide

## Problem

In Vercel serverless environments, dynamic `require()` calls can fail because:
1. Modules aren't automatically bundled
2. File system access is limited
3. Path resolution works differently than in development

## Solution

### 1. Use Module Loader Utility

We've created `website/lib/api-module-loader.ts` that:
- Caches loaded modules
- Handles path resolution
- Provides fallbacks
- Works in both dev and production

**Usage:**
```typescript
import { loadModule } from '@/lib/api-module-loader';

const featureGenerator = loadModule('../../../../../lib/mlops/featureGenerator');
```

### 2. Update Next.js Config

Ensure modules are bundled in `next.config.js`:

```javascript
module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Bundle Node.js modules for serverless
      config.externals = config.externals || [];
      // Don't externalize our lib modules
      config.externals = config.externals.filter(
        (external) => !external.includes('lib/mlops')
      );
    }
    return config;
  },
};
```

### 3. Alternative: Use API Routes as Proxies

If modules still fail, create API route proxies that:
- Run in Node.js environment (not serverless)
- Have full file system access
- Can load modules normally

### 4. Pre-bundle Critical Modules

For critical modules, consider:
- Pre-bundling with webpack
- Creating wrapper modules
- Using edge functions (if compatible)

## Current Status

✅ Module loader utility created
⏳ Next.js config needs update
⏳ API routes need migration to module loader

## Testing

Test in production:
1. Deploy to Vercel
2. Test API endpoints
3. Check logs for module loading errors
4. Verify modules load correctly

## Migration Checklist

- [ ] Update all API routes to use module loader
- [ ] Update Next.js config for bundling
- [ ] Test in production
- [ ] Monitor for module loading errors
- [ ] Document any remaining issues
