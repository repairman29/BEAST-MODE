# Authentication & GitHub Integration Setup

## ✅ What's Been Implemented

### 1. **Real Authentication** (Supabase + JWT)
- ✅ Supabase integration for user management
- ✅ JWT token generation for sessions
- ✅ Password validation
- ✅ Fallback mock auth for development

### 2. **Real GitHub API Integration**
- ✅ GitHub API client setup
- ✅ Repository metadata fetching
- ✅ Real quality score calculation based on:
  - Stars, forks, open issues
  - License, description, topics
  - README presence
  - Language detection
- ✅ Fallback mock data if token not configured

## 🔧 Setup Instructions

### Step 1: Environment Variables

Create `.env.local` in the `website` directory:

```bash
# Supabase Authentication (optional - falls back to mock if not set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (required for token generation)
JWT_SECRET=your-secret-jwt-key-change-in-production

# GitHub API (optional - falls back to mock if not set)
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:7777
```

### Step 2: Get Supabase Credentials (Optional)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Get GitHub Token (Optional)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes:
   - `public_repo` (for public repos)
   - `repo` (for private repos, if needed)
3. Copy token → `GITHUB_TOKEN`

### Step 4: Generate JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

Copy the output to `JWT_SECRET` in `.env.local`

## 🚀 How It Works

### Authentication Flow

**Without Supabase (Mock Mode):**
- Accepts any email/password
- Generates JWT token
- Stores in localStorage
- Works for development/testing

**With Supabase (Production Mode):**
- Validates email/password against Supabase
- Creates user account on signup
- Sends email verification (if enabled)
- Generates secure JWT token
- Stores session in localStorage

### GitHub Scanning Flow

**Without GitHub Token (Mock Mode):**
- Returns simulated quality scores
- Shows mock metrics
- Works for testing UI

**With GitHub Token (Real Mode):**
- Fetches real repository data from GitHub API
- Calculates quality score based on:
  - Repository health metrics
  - Code quality indicators
  - Documentation presence
- Returns actual repository information

## 📝 Usage

### Sign Up / Sign In
1. Navigate to Dashboard → "Sign In" button
2. Enter email and password
3. Click "Sign Up" or "Sign In"
4. Token stored in localStorage

### Scan GitHub Repository
1. Navigate to Dashboard → "Scan Repo" button
2. Enter GitHub URL (e.g., `https://github.com/owner/repo` or `owner/repo`)
3. Click "Scan Repository"
4. View real-time quality analysis

## 🔒 Security Notes

- **JWT Secret**: Change in production! Use a strong random string
- **GitHub Token**: Store securely, never commit to git
- **Supabase Keys**: Anon key is safe for client-side, service role key is server-only
- **Password Validation**: Minimum 8 characters enforced

## 🐛 Troubleshooting

### "Authentication failed"
- Check Supabase credentials (if using)
- Verify JWT_SECRET is set
- Check browser console for errors

### "Repository not found"
- Verify GitHub token has correct permissions
- Check repository is public (or token has private repo access)
- Verify URL format is correct

### "GitHub token not configured"
- This is normal if you haven't set `GITHUB_TOKEN`
- System falls back to mock data
- Set token to enable real scanning

## 📚 Next Steps

- [ ] Set up Supabase database schema for users
- [ ] Add email verification flow
- [ ] Implement password reset
- [ ] Add OAuth providers (GitHub, Google)
- [ ] Connect GitHub scanning to BEAST MODE core analysis
- [ ] Add repository cloning for deeper analysis
- [ ] Implement caching for scan results

