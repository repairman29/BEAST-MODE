# Day 2 Operations UI - Testing Guide
## Complete Testing Checklist

**Status:** ✅ All 74 tests passed

---

## 🧪 Automated Tests

### Run Test Suite
```bash
cd website
node scripts/test-janitor-ui-simple.js
```

**What it tests:**
- ✅ All 8 components exist and have proper exports
- ✅ All 11 API routes exist and have proper exports
- ✅ React patterns (useState, useEffect, JSX)
- ✅ API route patterns (NextRequest, NextResponse)
- ✅ Supabase integration in routes
- ✅ Database migration with all 6 tables

---

## 🚀 Manual Testing Checklist

### 1. Access Dashboard
- [ ] Navigate to `/dashboard?view=janitor`
- [ ] Or click "🧹 Day 2 Ops" in sidebar
- [ ] Or press `4` keyboard shortcut
- [ ] Dashboard loads without errors
- [ ] All 6 feature cards are visible

### 2. Quick Stats Bar
- [ ] Issues Fixed count displays
- [ ] Violations Blocked count displays
- [ ] Repo Memory Nodes count displays
- [ ] Vibe Ops Tests count displays
- [ ] Stats update when features run

### 3. Silent Refactoring
- [ ] Toggle ON/OFF works
- [ ] Click "Configure →" opens modal
- [ ] Can set overnight mode schedule
- [ ] Can adjust confidence threshold
- [ ] Can toggle auto-merge settings
- [ ] Click "History →" shows past runs
- [ ] Click "Run Manual Refactor" triggers refactoring
- [ ] Status updates after actions

### 4. Architecture Enforcement
- [ ] Toggle ON/OFF works
- [ ] Click "View Rules →" shows rules
- [ ] Can toggle individual rules on/off
- [ ] Can filter rules by category
- [ ] Rules show examples of violations
- [ ] Enforcement level can be changed

### 5. Vibe Restoration
- [ ] Toggle ON/OFF works
- [ ] Click "View History →" shows code states
- [ ] Can see quality scores over time
- [ ] Can identify regressions
- [ ] Can restore to last good state
- [ ] Restore button works

### 6. Repo-Level Memory
- [ ] Toggle ON/OFF works
- [ ] Click "View Graph →" shows semantic graph
- [ ] Can see file connections
- [ ] Can explore node relationships
- [ ] Can rebuild graph
- [ ] Graph size updates

### 7. Vibe Ops
- [ ] Toggle ON/OFF works
- [ ] Click "Create Test →" opens test creator
- [ ] Can select test type (Happy Path, Error, Edge)
- [ ] Can enter test description in plain English
- [ ] Example tests are clickable
- [ ] Test creation works
- [ ] Generated code displays

### 8. Invisible CI/CD
- [ ] Toggle ON/OFF works
- [ ] Click "View Logs →" shows scan logs
- [ ] Can filter by type (lint, test, security)
- [ ] Logs auto-refresh every 10 seconds
- [ ] Can see issues found and fixed
- [ ] Status indicators work (success, warning, error)

### 9. Global Controls
- [ ] Main "Enable/Disable Janitor" button works
- [ ] Status badge updates (Active/Inactive)
- [ ] All features respect global toggle
- [ ] Dashboard auto-refreshes every 30 seconds

### 10. Configuration Modals
- [ ] All modals open correctly
- [ ] All modals close on backdrop click
- [ ] All modals close on X button
- [ ] Configuration saves correctly
- [ ] Changes persist after refresh

### 11. API Integration
- [ ] Status endpoint returns data
- [ ] Feature toggle endpoints work
- [ ] History endpoints return data
- [ ] Graph endpoint returns nodes
- [ ] Test creation endpoint works
- [ ] Restore endpoint works
- [ ] Error handling works (shows fallback data)

### 12. Database Integration
- [ ] Supabase connection works
- [ ] Data persists to database
- [ ] Queries filter by user_id
- [ ] Fallback to mock data when DB unavailable
- [ ] All 6 tables accessible

---

## 🐛 Common Issues & Fixes

### Issue: Dashboard doesn't load
**Fix:** Check browser console for errors. Verify API routes are accessible.

### Issue: Modals don't open
**Fix:** Check z-index conflicts. Verify React state updates.

### Issue: Data doesn't persist
**Fix:** Check Supabase connection. Verify user_id is set in cookies.

### Issue: Auto-refresh not working
**Fix:** Check useEffect dependencies. Verify polling interval.

### Issue: API calls fail
**Fix:** Check network tab. Verify API routes exist. Check CORS settings.

---

## 📊 Test Results Summary

**Automated Tests:**
- ✅ 74 tests passed
- ❌ 0 tests failed

**Components:**
- ✅ 8/8 components exist
- ✅ 8/8 components have exports
- ✅ 8/8 components use React hooks

**API Routes:**
- ✅ 11/11 routes exist
- ✅ 11/11 routes have exports
- ✅ 3/3 routes have Supabase integration

**Database:**
- ✅ 6/6 tables defined in migration
- ✅ Migration file exists
- ✅ RLS policies configured

---

## 🎯 Next Steps

1. **Manual Testing:** Complete the checklist above
2. **Integration Testing:** Test with real Supabase database
3. **E2E Testing:** Test full user workflows
4. **Performance Testing:** Test with large datasets
5. **Accessibility Testing:** Test keyboard navigation, screen readers

---

## 📝 Test Data

### Mock Data Used
- Refactoring runs: 2 sample runs
- Architecture rules: 5 default rules
- Vibe restoration states: 3 sample states
- Repo memory nodes: 4 sample nodes
- Vibe Ops tests: Generated on demand
- CI/CD logs: 3 sample logs

### Database Schema
All tables defined in:
`website/supabase/migrations/20250101000006_create_janitor_tables.sql`

---

## ✅ Testing Complete

**Status:** All automated tests passed. Ready for manual testing.

**Next:** Start dev server and test UI interactions:
```bash
cd website && npm run dev
# Navigate to http://localhost:3001/dashboard?view=janitor
```

