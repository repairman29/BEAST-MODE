# ML Database Integration - Maintenance Guide
## Keeping the System Healthy & Updated

**Status**: ✅ **Active** | 📋 **Maintenance Required**

---

## 🔄 Regular Maintenance Tasks

### Daily (Automated)
- ✅ **Auto-flush**: Database writer automatically flushes every 5 seconds
- ✅ **Queue Management**: Batch writes when queue reaches 50 items
- ✅ **Error Handling**: Failed writes are logged but don't block predictions

### Weekly (Manual Check)
- 📊 **Monitor Prediction Volume**: Check if predictions are flowing
- 🔍 **Review Error Logs**: Check for connection issues
- 📈 **Performance Metrics**: Review latency and throughput

### Monthly (Manual Review)
- 🗄️ **Database Size**: Check table sizes and growth
- 📉 **Data Quality**: Review prediction accuracy
- 🔧 **Index Performance**: Verify indexes are being used
- 🧹 **Cleanup**: Archive old data if needed

---

## 📊 Monitoring Queries

### 1. **Check Prediction Volume**
```sql
-- Daily prediction count by service
SELECT 
  DATE(created_at) as date,
  service_name,
  COUNT(*) as predictions,
  AVG(predicted_value) as avg_prediction,
  AVG(confidence) as avg_confidence
FROM ml_predictions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), service_name
ORDER BY date DESC, predictions DESC;
```

### 2. **Check Data Quality**
```sql
-- Prediction accuracy (where actual available)
SELECT 
  service_name,
  COUNT(*) as total_predictions,
  COUNT(actual_value) as with_actual,
  AVG(error) as avg_error,
  STDDEV(error) as error_stddev,
  MIN(error) as min_error,
  MAX(error) as max_error
FROM ml_predictions
WHERE actual_value IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY service_name
ORDER BY avg_error ASC;
```

### 3. **Check Database Size**
```sql
-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'ml_%' OR tablename LIKE '%_ml_%'
ORDER BY size_bytes DESC;
```

### 4. **Check Recent Activity**
```sql
-- Last 24 hours activity
SELECT 
  service_name,
  COUNT(*) as predictions,
  MAX(created_at) as last_prediction,
  MIN(created_at) as first_prediction
FROM ml_predictions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_name
ORDER BY predictions DESC;
```

### 5. **Check Errors**
```sql
-- Predictions with high error (if actual available)
SELECT 
  service_name,
  prediction_type,
  predicted_value,
  actual_value,
  error,
  created_at
FROM ml_predictions
WHERE actual_value IS NOT NULL
  AND error > 0.3  -- 30% error threshold
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY error DESC
LIMIT 50;
```

---

## 🔧 Maintenance Scripts

### 1. **Health Check Script**
**File**: `scripts/ml-db-health-check.js`

```javascript
// Run: npm run ml:health-check
// Checks:
// - Database connection
// - Table existence
// - Recent activity
// - Error rates
// - Queue status
```

### 2. **Performance Analysis**
**File**: `scripts/ml-db-performance.js`

```javascript
// Run: npm run ml:performance
// Analyzes:
// - Prediction latency
// - Database write performance
// - Queue flush times
// - Index usage
```

### 3. **Data Cleanup**
**File**: `scripts/ml-db-cleanup.js`

```javascript
// Run: npm run ml:cleanup
// Options:
// - Archive old predictions (>90 days)
// - Remove test data
// - Vacuum tables
// - Reindex
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: **Predictions Not Writing**
**Symptoms**: No data in `ml_predictions` table

**Check:**
1. Supabase connection configured?
2. Service role key valid?
3. Tables exist?
4. RLS policies correct?

**Solution:**
```bash
# Test database connection
npm run test:db-writer

# Check Supabase credentials
# Verify in smuggler-ai-gm/.env or config
```

---

### Issue 2: **High Error Rates**
**Symptoms**: Large gap between predicted and actual values

**Check:**
```sql
-- Find services with high error
SELECT service_name, AVG(error) as avg_error
FROM ml_predictions
WHERE actual_value IS NOT NULL
GROUP BY service_name
HAVING AVG(error) > 0.2;
```

**Solution:**
- Review model training data
- Retrain model with recent data
- Check feature engineering

---

### Issue 3: **Slow Writes**
**Symptoms**: Predictions queue up, slow database writes

**Check:**
```sql
-- Check table sizes and indexes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename))
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ml_%';
```

**Solution:**
- Vacuum tables: `VACUUM ANALYZE ml_predictions;`
- Reindex: `REINDEX TABLE ml_predictions;`
- Check batch size (currently 50 items)

---

### Issue 4: **Missing Service Data**
**Symptoms**: Service-specific tables empty

**Check:**
```sql
-- Compare unified vs service-specific
SELECT 
  'ml_predictions' as table_name,
  COUNT(*) as count
FROM ml_predictions
WHERE service_name = 'code-roach'
UNION ALL
SELECT 
  'code_roach_ml_predictions',
  COUNT(*)
FROM code_roach_ml_predictions;
```

**Solution:**
- Verify `formatServiceData` in `databaseWriter.js`
- Check service name mapping
- Review context data

---

## 📈 Performance Optimization

### 1. **Index Maintenance**
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'ml_%'
ORDER BY idx_scan DESC;
```

### 2. **Query Optimization**
```sql
-- Analyze tables for query planner
ANALYZE ml_predictions;
ANALYZE ml_feedback;
ANALYZE ml_performance_metrics;
```

### 3. **Partitioning (Future)**
For high-volume services, consider partitioning by date:
```sql
-- Example: Partition by month
CREATE TABLE ml_predictions_2025_01 PARTITION OF ml_predictions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 🧹 Data Retention

### Recommended Retention:
- **ml_predictions**: 90 days (then archive)
- **ml_feedback**: 180 days
- **ml_performance_metrics**: 365 days (aggregated)
- **Service-specific tables**: 90 days

### Archive Script:
```sql
-- Archive old predictions
CREATE TABLE ml_predictions_archive AS
SELECT * FROM ml_predictions
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete archived data
DELETE FROM ml_predictions
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🔔 Alerts & Monitoring

### Key Metrics to Monitor:
1. **Prediction Volume**: Should be consistent
2. **Error Rate**: Should be < 20%
3. **Write Latency**: Should be < 100ms
4. **Queue Size**: Should be < 100 items
5. **Database Size**: Should grow predictably

### Alert Thresholds:
- ⚠️ **No predictions for 1 hour**: Service may be down
- ⚠️ **Error rate > 30%**: Model may need retraining
- ⚠️ **Queue size > 200**: Database writes may be slow
- ⚠️ **Database size > 10GB**: Consider archiving

---

## 📋 Maintenance Checklist

### Weekly:
- [ ] Check prediction volume
- [ ] Review error logs
- [ ] Verify all services writing

### Monthly:
- [ ] Review data quality metrics
- [ ] Check database size
- [ ] Analyze index performance
- [ ] Review error rates by service

### Quarterly:
- [ ] Archive old data
- [ ] Vacuum and reindex tables
- [ ] Review retention policies
- [ ] Update model if needed

---

## 🚀 Best Practices

1. **Monitor Regularly**: Check prediction volume daily
2. **Review Errors**: Investigate high error rates
3. **Archive Old Data**: Keep database size manageable
4. **Optimize Queries**: Use indexes effectively
5. **Retrain Models**: Use actual values to improve predictions
6. **Document Issues**: Keep track of problems and solutions

---

## 📞 Support

### If Issues Arise:
1. Check logs: `npm run ml:status`
2. Test connection: `npm run test:db-writer`
3. Review queries: Use monitoring queries above
4. Check Supabase dashboard: Verify tables and data

---

**Last Updated**: 2025-12-31  
**Next Review**: 2026-01-31

