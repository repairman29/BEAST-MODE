# User Acceptance Testing (UAT) Checklist
## Day 2 Operations - The AI Janitor

**Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Ready for UAT

---

## 🎯 Pre-UAT Setup

### Environment Configuration
- [ ] Supabase project configured
- [ ] All migrations applied (`20250101000006_create_janitor_tables.sql`)
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- [ ] GitHub OAuth configured (for user authentication)
- [ ] Database RLS policies active

### Deployment
- [ ] Code deployed to staging environment
- [ ] Database migrations applied to staging
- [ ] Environment variables configured in staging
- [ ] Domain/DNS configured (if applicable)

---

## 📋 Core Functionality Tests

### 1. Dashboard Access
- [ ] Navigate to `/dashboard?view=janitor`
- [ ] Dashboard loads without errors
- [ ] All 6 feature cards visible
- [ ] Quick stats display correctly
- [ ] Status indicator shows current state

### 2. Enable/Disable Janitor
- [ ] Click "Enable Janitor" button
- [ ] Status changes to "Active"
- [ ] All features become available
- [ ] Click "Disable Janitor" button
- [ ] Status changes to "Inactive"
- [ ] Features become unavailable

### 3. Silent Refactoring Engine
- [ ] Enable Silent Refactoring feature
- [ ] Open configuration modal
- [ ] Toggle "Overnight Mode" on/off
- [ ] Set "Confidence Threshold" (99.9%)
- [ ] Toggle "Require Tests" on/off
- [ ] Toggle "Require Human Review" on/off
- [ ] Click "Run Manual Refactor"
- [ ] See refactoring status update
- [ ] View refactoring history
- [ ] See issues fixed and PRs created

### 4. Architecture Enforcement
- [ ] Enable Architecture Enforcement feature
- [ ] View architecture rules list
- [ ] Toggle individual rules on/off
- [ ] See rule details (description, examples)
- [ ] Verify rules are active in pre-commit hooks

### 5. Vibe Restoration
- [ ] Enable Vibe Restoration feature
- [ ] View restoration history
- [ ] See code quality states
- [ ] Click "Restore" on a previous state
- [ ] Verify restoration process

### 6. Repo-Level Memory
- [ ] Enable Repo Memory feature
- [ ] View memory graph visualization
- [ ] See nodes and connections
- [ ] Verify graph updates with code changes

### 7. Vibe Ops (QA for English)
- [ ] Enable Vibe Ops feature
- [ ] Open test creator
- [ ] Enter test description in plain English
- [ ] Select test type
- [ ] View auto-generated test code
- [ ] Create test
- [ ] See test in list

### 8. Invisible CI/CD
- [ ] Enable Invisible CI/CD feature
- [ ] View CI/CD logs
- [ ] See scan results
- [ ] Verify auto-fixes applied

---

## 🎨 UI/UX Tests

### Dashboard Layout
- [ ] All components render correctly
- [ ] Responsive design works on mobile
- [ ] Responsive design works on tablet
- [ ] Responsive design works on desktop
- [ ] Dark theme applied correctly
- [ ] Colors match brand guidelines

### Notifications
- [ ] Notifications panel visible
- [ ] Unread badge shows correct count
- [ ] Click notification navigates correctly
- [ ] Mark as read works
- [ ] Notifications update in real-time

### Activity Feed
- [ ] Activity feed displays recent activities
- [ ] Filter buttons work (All, Refactor, Enforcement, Test, Scan)
- [ ] Activities show correct icons and colors
- [ ] Timestamps display correctly
- [ ] Feed updates automatically (10s polling)

### Metrics Chart
- [ ] Chart displays correctly
- [ ] Time range buttons work (7d, 30d, 90d)
- [ ] Legend shows all metrics
- [ ] Summary stats calculate correctly
- [ ] Chart is responsive

### Quick Actions
- [ ] All 4 quick actions visible
- [ ] Click "Run Refactor" triggers manual refactor
- [ ] Click "Create Test" opens test creator
- [ ] Click "View History" shows history
- [ ] Click "View Rules" shows rules

### Onboarding
- [ ] Onboarding shows for first-time users
- [ ] Progress bar updates correctly
- [ ] Step navigation works
- [ ] "Skip onboarding" works
- [ ] Onboarding doesn't show after completion

---

## 🔌 Integration Tests

### API Routes
- [ ] `GET /api/beast-mode/janitor/status` returns correct data
- [ ] `POST /api/beast-mode/janitor/[feature]` updates feature status
- [ ] `POST /api/beast-mode/janitor/refactor` triggers refactoring
- [ ] `GET /api/beast-mode/janitor/refactoring/history` returns history
- [ ] `GET /api/beast-mode/janitor/architecture/rules` returns rules
- [ ] `POST /api/beast-mode/janitor/architecture/rules/[ruleId]` updates rule
- [ ] `POST /api/beast-mode/janitor/vibe-ops/create-test` creates test
- [ ] `GET /api/beast-mode/janitor/repo-memory/graph` returns graph
- [ ] `GET /api/beast-mode/janitor/vibe-restoration/history` returns history
- [ ] `POST /api/beast-mode/janitor/vibe-restoration/restore/[stateId]` restores
- [ ] `GET /api/beast-mode/janitor/invisible-cicd/logs` returns logs
- [ ] `GET /api/beast-mode/janitor/activity` returns activity feed
- [ ] `GET /api/beast-mode/janitor/metrics` returns metrics
- [ ] `GET /api/beast-mode/janitor/notifications` returns notifications
- [ ] `POST /api/beast-mode/janitor/notifications/[id]/read` marks as read

### Database
- [ ] Data persists when enabling/disabling features
- [ ] Refactoring runs saved to database
- [ ] Architecture rules saved to database
- [ ] Vibe restoration states saved to database
- [ ] Repo memory graph saved to database
- [ ] Vibe Ops tests saved to database
- [ ] RLS policies enforce user isolation

### Authentication
- [ ] User must be logged in to access dashboard
- [ ] User data isolated by user_id
- [ ] GitHub OAuth works correctly

---

## 🐛 Error Handling Tests

### Error Boundary
- [ ] Error boundary catches component errors
- [ ] Error message displays correctly
- [ ] "Try Again" button works
- [ ] "Reload Page" button works
- [ ] Errors logged to error tracking

### Network Errors
- [ ] Handles API timeout gracefully
- [ ] Shows loading states during requests
- [ ] Displays error messages for failed requests
- [ ] Retry mechanism works

### Missing Data
- [ ] Handles empty states gracefully
- [ ] Shows appropriate messages when no data
- [ ] Empty state actions work

---

## ⚡ Performance Tests

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] API responses in < 500ms
- [ ] Charts render smoothly
- [ ] No layout shift during load

### Real-Time Updates
- [ ] Activity feed updates without page refresh
- [ ] Notifications update automatically
- [ ] Status indicators update in real-time
- [ ] No performance degradation with polling

### Large Data Sets
- [ ] History view handles 100+ items
- [ ] Metrics chart handles 90 days of data
- [ ] Activity feed handles 50+ activities
- [ ] Graph visualization handles 100+ nodes

---

## 🔒 Security Tests

### Authentication
- [ ] Unauthenticated users redirected to login
- [ ] User can only see their own data
- [ ] RLS policies enforce data isolation

### Data Validation
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

### API Security
- [ ] API routes require authentication
- [ ] User ID validated on all requests
- [ ] Rate limiting applied (if configured)

---

## 📱 Cross-Browser Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🎯 Acceptance Criteria

### Must Have (Blockers)
- [ ] All core features functional
- [ ] No critical bugs
- [ ] Database migrations applied
- [ ] Authentication working
- [ ] Data persistence working
- [ ] Error handling working

### Should Have (Important)
- [ ] UI/UX polished
- [ ] Performance acceptable
- [ ] Real-time updates working
- [ ] Cross-browser compatibility
- [ ] Mobile responsive

### Nice to Have (Enhancements)
- [ ] Advanced metrics
- [ ] Export functionality
- [ ] Advanced filtering
- [ ] Keyboard shortcuts

---

## 📝 Test Results Template

### Test Session
- **Date:** _______________
- **Tester:** _______________
- **Environment:** _______________
- **Browser:** _______________

### Issues Found
1. **Issue:** _______________
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:** _______________
   - **Expected:** _______________
   - **Actual:** _______________

---

## ✅ Sign-Off

- [ ] **Product Owner:** _______________ Date: _______
- [ ] **QA Lead:** _______________ Date: _______
- [ ] **Tech Lead:** _______________ Date: _______

**UAT Status:** ☐ Passed  ☐ Failed  ☐ Needs Revision

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Next Steps After UAT:**
1. Address critical issues
2. Fix high-priority bugs
3. Plan enhancements
4. Schedule production deployment

