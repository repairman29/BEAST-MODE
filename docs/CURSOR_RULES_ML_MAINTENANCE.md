# Cursor Rules - ML Database Maintenance
## What's Been Added to .cursorrules

**Status**: ✅ **Updated**

---

## 📋 New Section Added

### ML Database Integration Section

Added to `.cursorrules`:

```yaml
ml_database:
  status: "✅ Active - All predictions writing to Supabase"
  location: "BEAST-MODE-PRODUCT/lib/mlops/databaseWriter.js"
  tables: "supabase/migrations/20250101000000_create_ml_predictions_tables.sql"
  
  services_integrated:
    - "code-roach"
    - "oracle"
    - "daisy-chain"
    - "ai-gm"
    - "first-mate"
    - "game-app"
  
  maintenance:
    weekly: "Check prediction volume, review error logs"
    monthly: "Review data quality, check database size, analyze performance"
    quarterly: "Archive old data, vacuum/reindex, review retention"
  
  monitoring:
    health_check: "npm run ml:health-check"
    performance: "npm run ml:performance"
    test_connection: "npm run test:db-writer"
  
  documentation: "BEAST-MODE-PRODUCT/docs/ML_DATABASE_MAINTENANCE.md"
  
  rules:
    - "When adding new service → Add serviceName to context"
    - "When modifying predictions → Ensure database writes still work"
    - "When changing schema → Update migration file"
    - "Monitor prediction volume weekly"
    - "Review error rates monthly"
    - "Archive data older than 90 days"
```

---

## 🔄 Updated Rules Maintenance

### New Update Triggers:
- "ML prediction changes → update ml_database section"

### New Principles:
- "Update ML database section when predictions change"

---

## 📊 What This Means

### For AI Assistant:
1. **Knows ML database is active** - Won't suggest removing it
2. **Knows which services are integrated** - Can verify when adding new ones
3. **Knows maintenance schedule** - Can remind about weekly/monthly tasks
4. **Knows monitoring commands** - Can run health checks
5. **Knows documentation location** - Can reference maintenance guide

### For Developers:
1. **Clear maintenance schedule** - Weekly/monthly/quarterly tasks
2. **Monitoring commands** - Easy health checks
3. **Documentation reference** - Full maintenance guide
4. **Update triggers** - Know when to update rules

---

## 🎯 Maintenance Reminders

### Weekly (AI can remind):
- Check prediction volume
- Review error logs
- Verify all services writing

### Monthly (AI can remind):
- Review data quality
- Check database size
- Analyze performance

### Quarterly (AI can remind):
- Archive old data
- Vacuum/reindex tables
- Review retention policies

---

## 🚀 Usage

### Health Check:
```bash
npm run ml:health-check
```

### Performance Analysis:
```bash
npm run ml:performance
```

### Test Connection:
```bash
npm run test:db-writer
```

---

**Status**: ✅ **Rules Updated**  
**Next**: AI assistant will now maintain ML database integration!

