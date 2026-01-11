# Authentication Testing & Verification Plan

## Current Status
- **Average Quality**: 97.0/100 ✅
- **OAuth Callback**: 100/100 ✅
- **OAuth Authorize**: 100/100 ✅
- **Homepage**: 100/100 ✅
- **Dashboard Layout**: 100/100 ✅
- **AuthSection**: 85/100 (1 minor issue)

## Critical Authentication Flows to Test

### 1. GitHub OAuth Flow
**Priority: CRITICAL**

#### Test Cases:
- [ ] **Happy Path**: User clicks "Sign in with GitHub" → Authorizes → Redirects to sign-in page
- [ ] **Existing User**: GitHub OAuth with existing Supabase account → Pre-fills email on sign-in
- [ ] **New User**: GitHub OAuth without account → Pre-fills email on sign-up
- [ ] **State Validation**: Invalid state parameter → Redirects with error
- [ ] **Session Expired**: OAuth callback after session expires → Shows error message
- [ ] **Token Storage**: GitHub token stored securely in database
- [ ] **Installation Linking**: GitHub installations linked to user account

#### Endpoints to Test:
- `GET /api/github/oauth/authorize` - Initiates OAuth
- `GET /api/github/oauth/callback` - Handles callback
- `GET /api/github/token` - Retrieves stored token

#### Manual Test Steps:
1. Navigate to homepage
2. Click "Sign in with GitHub"
3. Authorize on GitHub
4. Verify redirect to sign-in page with email pre-filled
5. Sign in with password
6. Verify GitHub token stored in database
7. Verify redirect to dashboard

### 2. Email/Password Authentication
**Priority: CRITICAL**

#### Test Cases:
- [ ] **Sign Up**: New user registration → Account created → Email verification sent
- [ ] **Sign In**: Existing user → Valid credentials → JWT token issued
- [ ] **Invalid Credentials**: Wrong password → Error message displayed
- [ ] **Email Validation**: Invalid email format → Validation error
- [ ] **Password Strength**: Weak password → Validation error
- [ ] **Password Reset**: Forgot password → Reset email sent
- [ ] **Session Management**: Token stored in localStorage → Persists across page reloads

#### Endpoints to Test:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/reset-password` - Password reset

#### Manual Test Steps:
1. Navigate to homepage with `?action=signup`
2. Fill in name, email, password
3. Submit form
4. Verify account created or email verification sent
5. Sign in with credentials
6. Verify redirect to dashboard
7. Refresh page → Verify still logged in

### 3. Error Handling & Edge Cases
**Priority: HIGH**

#### Test Cases:
- [ ] **OAuth Errors**: `invalid_state`, `session_expired`, `oauth_error` → Error messages displayed
- [ ] **Network Errors**: API calls fail → Graceful error handling
- [ ] **Invalid Input**: XSS attempts → Input sanitized
- [ ] **CSRF Protection**: Invalid state token → Request rejected
- [ ] **Token Expiry**: Expired JWT → Redirected to sign-in
- [ ] **Concurrent Sessions**: Multiple tabs → Consistent state

#### Manual Test Steps:
1. Try OAuth with invalid state (modify cookie)
2. Try XSS in email field: `<script>alert('xss')</script>`
3. Try SQL injection in password field
4. Verify all inputs sanitized
5. Test with expired token
6. Test with multiple browser tabs

### 4. Redirect Flow & URL Parameters
**Priority: HIGH**

#### Test Cases:
- [ ] **Auth Required**: Unauthenticated access to dashboard → Redirects to `/?auth=required`
- [ ] **OAuth Callback**: `?action=signin&message=github_connected` → Shows message
- [ ] **Email Pre-fill**: `?email=user@example.com` → Email field pre-filled
- [ ] **Error Display**: `?error=oauth_state_mismatch` → Error message shown
- [ ] **URL Cleanup**: After successful auth → URL params cleared

#### Manual Test Steps:
1. Navigate to `/dashboard` without auth → Verify redirect
2. Complete OAuth flow → Verify URL params handled
3. Check email pre-fill works
4. Verify error messages display correctly
5. After sign-in → Verify URL cleaned

### 5. Security & Validation
**Priority: CRITICAL**

#### Test Cases:
- [ ] **Input Validation**: Email regex, password length, name length
- [ ] **XSS Protection**: All user inputs sanitized
- [ ] **CSRF Protection**: State validation in OAuth
- [ ] **Token Security**: JWT tokens httpOnly where possible
- [ ] **Rate Limiting**: Multiple failed login attempts → Rate limited
- [ ] **Password Hashing**: Passwords never stored in plain text

#### Manual Test Steps:
1. Test email validation with various formats
2. Test password validation (min length, special chars)
3. Test XSS payloads in all input fields
4. Verify state validation works
5. Check network tab for token exposure

## Existing Test Coverage

### E2E Tests (Playwright)
- `e2e/auth-flow.spec.ts` - Basic auth flow
- `e2e/critical-flows.spec.ts` - Critical user flows
- `e2e/credit-purchase.spec.ts` - Credit purchase (requires auth)
- `e2e/api-endpoints.spec.ts` - API endpoint tests

### Manual Test Checklist
- [ ] Run all E2E tests: `npm run test:e2e`
- [ ] Test OAuth flow end-to-end manually
- [ ] Test sign-up/sign-in flow manually
- [ ] Test error scenarios manually
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

## API Endpoints to Verify

### Authentication Endpoints
- [ ] `POST /api/auth/signup` - User registration
- [ ] `POST /api/auth/signin` - User login
- [ ] `POST /api/auth/reset-password` - Password reset
- [ ] `GET /api/github/oauth/authorize` - OAuth initiation
- [ ] `GET /api/github/oauth/callback` - OAuth callback
- [ ] `GET /api/github/token` - Get stored token

### Health Check Endpoints
- [ ] `GET /api/health` - System health
- [ ] `GET /api/user/usage` - User usage stats (requires auth)

## Database Verification

### Tables to Check
- [ ] `user_github_tokens` - GitHub tokens stored
- [ ] `github_installations` - Installations linked to users
- [ ] Supabase `auth.users` - User accounts created
- [ ] `user_subscriptions` - User subscription data

### Queries to Run
```sql
-- Check GitHub tokens
SELECT COUNT(*) FROM user_github_tokens WHERE user_id = 'USER_ID';

-- Check installations
SELECT * FROM github_installations WHERE user_id = 'USER_ID';

-- Check user accounts
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

## Performance Testing

### Metrics to Monitor
- [ ] OAuth flow completion time < 5 seconds
- [ ] Sign-in API response time < 500ms
- [ ] Sign-up API response time < 1 second
- [ ] Page load time with auth < 2 seconds
- [ ] Token validation time < 100ms

## Security Audit Checklist

- [ ] All API endpoints require authentication where needed
- [ ] OAuth state validation prevents CSRF
- [ ] Input validation prevents XSS
- [ ] Passwords never logged or exposed
- [ ] Tokens stored securely (encrypted in database)
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

## Deployment Verification

### Pre-Deployment
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OAuth credentials configured

### Post-Deployment
- [ ] OAuth flow works in production
- [ ] Sign-up/sign-in works in production
- [ ] Error handling works correctly
- [ ] Logs show no errors
- [ ] Database connections stable

## Next Steps

1. **Run E2E Tests**: Execute all Playwright tests
2. **Manual Testing**: Complete manual test checklist
3. **Security Audit**: Review security checklist
4. **Performance Testing**: Measure and optimize
5. **Documentation**: Update API documentation
6. **Monitoring**: Set up error tracking and alerts

## Test Scripts

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test
```bash
npx playwright test e2e/auth-flow.spec.ts
```

### Manual OAuth Test
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with GitHub"
4. Complete OAuth flow
5. Verify redirect and sign-in

### API Test
```bash
# Test sign-up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'

# Test sign-in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```
