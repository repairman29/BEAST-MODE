# Credit Purchase E2E Test

Automated end-to-end test for the credit purchase flow using Playwright.

## Prerequisites

1. **Playwright installed**: `npm install` (already in package.json)
2. **Environment variables**: Set in `website/.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TEST_USER_EMAIL` (optional - for auth)
   - `TEST_USER_PASSWORD` (optional - for auth)
   - `PLAYWRIGHT_BASE_URL` (optional - defaults to https://beast-mode.dev)

## Running the Test

### Option 1: Run against production
```bash
cd website
npm run test:e2e -- e2e/credit-purchase.spec.ts
```

### Option 2: Run with UI (headed mode)
```bash
cd website
npm run test:e2e:headed -- e2e/credit-purchase.spec.ts
```

### Option 3: Run in debug mode
```bash
cd website
npm run test:e2e:debug -- e2e/credit-purchase.spec.ts
```

### Option 4: Run against local dev server
```bash
cd website
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- e2e/credit-purchase.spec.ts
```

## What the Test Does

1. **Navigates to billing page**: `/dashboard/customer?tab=billing`
2. **Handles authentication**: If not logged in, attempts to authenticate
3. **Clicks "Buy Credits"**: Finds and clicks the credit purchase button
4. **Selects a package**: Chooses a credit package (prefers 1,000 Credits)
5. **Fills Stripe checkout**: 
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
6. **Submits payment**: Completes the Stripe checkout
7. **Verifies success**: Checks for redirect to success page
8. **Verifies credits added**: 
   - Checks database for purchase record
   - Verifies credit balance increased

## Test Configuration

The test uses Stripe test mode, so no real charges are made. The test card `4242 4242 4242 4242` is Stripe's standard test card.

## Troubleshooting

### Authentication Issues
If the test fails at authentication:
- Ensure you have a test user account
- Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.local`
- Or manually authenticate before running the test

### Stripe Checkout Not Found
If the test can't find Stripe checkout:
- Check that credit packages are configured
- Verify Stripe is in test mode
- Ensure webhook endpoint is accessible

### Webhook Not Processing
If credits aren't added:
- Check Stripe dashboard for webhook events
- Verify webhook secret is configured
- Check database for purchase records

## Expected Results

✅ **Success**: 
- Checkout completes
- Redirects to success page
- Purchase record in database
- Credits added to account

❌ **Failure**:
- Test will show which step failed
- Screenshots saved on failure
- Video recording available in debug mode

## Manual Testing Alternative

If automated testing isn't working, you can test manually:

1. Visit: https://beast-mode.dev/dashboard/customer?tab=billing
2. Click "Buy Credits"
3. Select a package
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Run: `node scripts/monitor-production.js` to verify
