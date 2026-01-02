# GitHub OAuth Fix - Supabase Integration

## Issues Fixed

1. **Client ID Mismatch**: Production was using dev client ID (`Ov23lidLvmp68FVMEqEB`) instead of production (`Ov23liDKFkIrnPneWwny`)
2. **Token Storage**: Migrated from in-memory Map to Supabase for proper persistence and user isolation
3. **User ID Management**: Now uses Supabase auth user IDs instead of session-based IDs
4. **Product Isolation**: Added `product` column to ensure users are separate per product for billing

## Changes Made

### 1. Database Migration
- Created `user_github_tokens` table in Supabase
- Includes proper RLS policies for user isolation
- Supports multi-product architecture with `product` column

### 2. OAuth Flow Updates
- **Authorize Route**: Now extracts Supabase user ID from JWT token
- **Callback Route**: Stores tokens in Supabase when user is authenticated
- Falls back to in-memory storage for anonymous users

### 3. Client ID Detection
- Added environment detection to warn about wrong client ID usage
- Production should use: `Ov23liDKFkIrnPneWwny`
- Development should use: `Ov23lidLvmp68FVMEqEB`

## Setup Instructions

### 1. Run Migration
```sql
-- Run in Supabase SQL Editor
-- File: website/supabase/migrations/20250102000001_create_user_github_tokens.sql
```

### 2. Update Vercel Environment Variables

**Production Environment:**
```bash
GITHUB_CLIENT_ID=Ov23liDKFkIrnPneWwny
GITHUB_CLIENT_SECRET=014c7fab1ba6cc6a7398b5bde04e26463f16f4e9
GITHUB_REDIRECT_URI=https://beastmode.dev/api/github/oauth/callback
GITHUB_TOKEN_ENCRYPTION_KEY=<your-64-char-hex-key>
NEXT_PUBLIC_URL=https://beastmode.dev
```

**Development Environment:**
```bash
GITHUB_CLIENT_ID=Ov23lidLvmp68FVMEqEB
GITHUB_CLIENT_SECRET=df4c598018de45ce8cb90313489eeb21448aedcf
GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback
GITHUB_TOKEN_ENCRYPTION_KEY=<your-64-char-hex-key>
NEXT_PUBLIC_URL=http://localhost:7777
```

### 3. Verify GitHub OAuth App Settings

**Production App** (Client ID: `Ov23liDKFkIrnPneWwny`):
- Callback URL: `https://beastmode.dev/api/github/oauth/callback`
- Homepage URL: `https://beastmode.dev`

**Development App** (Client ID: `Ov23lidLvmp68FVMEqEB`):
- Callback URL: `http://localhost:7777/api/github/oauth/callback`
- Homepage URL: `http://localhost:7777`

## Architecture

### User Isolation
- Each user's GitHub token is stored with their Supabase `user_id`
- `product` column ensures separation between products (beast-mode, echeo, etc.)
- RLS policies ensure users can only access their own tokens

### Token Storage
- **Supabase Users**: Tokens stored in `user_github_tokens` table
- **Anonymous Users**: Tokens stored in-memory (temporary, lost on restart)
- Encryption: AES-256-CBC with key from `GITHUB_TOKEN_ENCRYPTION_KEY`

### Multi-Product Support
The `product` column allows the same Supabase user to have different GitHub connections for different products, enabling:
- Separate billing per product
- Product-specific OAuth scopes
- Independent token management

## Testing

1. **Test OAuth Flow**:
   - Sign in with Supabase auth
   - Click "Connect GitHub"
   - Verify token is stored in Supabase

2. **Verify User Isolation**:
   - Connect GitHub as User A
   - Sign in as User B
   - Verify User B cannot see User A's token

3. **Check Client ID**:
   - Production should show production client ID in logs
   - Development should show dev client ID in logs
   - Warnings will appear if wrong client ID is used

## Troubleshooting

### OAuth Fails with "redirect_uri_mismatch"
- Check that callback URL in GitHub OAuth app matches `GITHUB_REDIRECT_URI`
- Production: `https://beastmode.dev/api/github/oauth/callback`
- Development: `http://localhost:7777/api/github/oauth/callback`

### Wrong Client ID Warning
- Check Vercel environment variables
- Production must use: `Ov23liDKFkIrnPneWwny`
- Development must use: `Ov23lidLvmp68FVMEqEB`

### Token Not Stored
- Check Supabase connection
- Verify migration was run
- Check RLS policies allow service role access
- Check logs for encryption errors

