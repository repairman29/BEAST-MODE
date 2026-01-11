# Authentication Loop Fix

## Problem

Users were experiencing an authentication loop:
1. Click "Sign In with GitHub"
2. Complete GitHub OAuth
3. See black page with blue "Sign In" button (Google sign-in)
4. Redirected back to main page (not authenticated)
5. Loop repeats

## Root Cause

- **GitHub OAuth is for connecting GitHub**, not for site authentication
- **Dashboard requires Supabase authentication** (`isAuthenticated()` checks Supabase session)
- After GitHub OAuth completes, there's **no Supabase session**
- Dashboard redirects to `/?auth=required`
- This creates an infinite loop

## Solution

Updated the OAuth callback to:
1. Check if user has a Supabase account
2. If **no Supabase account** → Redirect to sign-in page with helpful message
3. If **has Supabase account** → Redirect to dashboard (existing flow)

### Changes Made

**File: `website/app/api/github/oauth/callback/route.ts`**
- Added check for Supabase user account
- Redirects to sign-in page if no account: `/?action=signin&message=github_connected&github_username=...`
- Shows helpful message to user

**File: `website/components/beast-mode/AuthSection.tsx`**
- Added handling for `message=github_connected` URL param
- Shows message: "GitHub account (@username) connected! Please sign in with your email and password to continue."

## How It Works Now

1. User clicks "Sign In with GitHub"
2. Completes GitHub OAuth flow
3. **If no Supabase account exists:**
   - Redirects to: `/?action=signin&message=github_connected&github_username=...`
   - Shows sign-in form with helpful message
   - User signs in with email/password
   - GitHub connection is preserved
4. **If Supabase account exists:**
   - Redirects to dashboard (existing flow)

## Next Steps

### For Users
1. **Sign up first** with email/password at `/?action=signup`
2. **Then** connect GitHub account from dashboard
3. Or use GitHub OAuth, then sign in when prompted

### For Development
- Test the flow: GitHub OAuth → Sign-in page
- Verify message displays correctly
- Ensure GitHub connection is preserved after sign-in

### Future Improvements
- Consider implementing Supabase's GitHub OAuth provider for true "Sign in with GitHub"
- Or create Supabase user automatically from GitHub OAuth (requires email verification)

## Testing

1. Clear cookies/localStorage
2. Go to `https://beast-mode.dev/dashboard/customer?tab=billing`
3. Click "Sign In with GitHub"
4. Complete OAuth
5. **Expected:** Redirect to sign-in page with message
6. Sign in with email/password
7. **Expected:** Access dashboard successfully
