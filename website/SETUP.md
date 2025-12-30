# BEAST MODE Dashboard Setup Guide

## Interactive Features Added

The dashboard now includes 4 main interactive features:

1. **GitHub Repo Scanning** - Scan any GitHub repository for code quality
2. **Authentication** - Sign in/Sign up functionality
3. **Stripe Payments** - Subscribe to paid plans
4. **Self-Improvement** - Analyze and improve the BEAST MODE website itself

## Setup Instructions

### 1. Stripe Integration

```bash
# Install Stripe SDK
npm install stripe

# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:3001
```

Then update `/app/api/stripe/create-checkout/route.ts` to use the actual Stripe SDK (code is commented in the file).

### 2. Authentication Setup

Currently using mock authentication. For production:

**Option A: NextAuth.js**
```bash
npm install next-auth
```

**Option B: Custom Auth**
- Set up database (PostgreSQL/MongoDB)
- Implement password hashing (bcrypt)
- Add JWT token generation
- Update `/app/api/auth/signin/route.ts` and `/app/api/auth/signup/route.ts`

### 3. GitHub API Integration

For real GitHub repo scanning:

```bash
# Add to .env.local
GITHUB_TOKEN=ghp_...
```

Then update `/app/api/github/scan/route.ts` to:
- Use GitHub API to fetch repository
- Clone/analyze code
- Run BEAST MODE analysis
- Return real results

### 4. Self-Improvement Analysis

Update `/app/api/beast-mode/self-improve/route.ts` to:
- Scan the actual website codebase
- Use BEAST MODE's Oracle AI for real recommendations
- Analyze performance, SEO, accessibility, etc.

## Dashboard Navigation

New buttons added to the dashboard:
- **Scan Repo** - GitHub repository scanning
- **Sign In** - Authentication
- **Pricing** - Stripe subscription plans
- **Improve** - Self-improvement analysis

All features are now accessible from the dashboard!

