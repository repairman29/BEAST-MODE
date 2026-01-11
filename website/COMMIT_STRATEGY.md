# 📝 BEAST MODE Commit Strategy

**Last Updated:** December 30, 2025

## Repository Structure

BEAST MODE is a **public open source repository** (MIT License) with the following structure:

```
BEAST-MODE-PRODUCT/
├── lib/              # Open source core library
├── website/          # Open source Next.js application
├── bin/              # Open source CLI tools
├── scripts/          # Open source automation scripts
└── docs/             # Open source documentation
```

## Commit Guidelines

### ✅ What Should Be Committed (Open Source)

1. **Core Library Code** (`lib/`)
   - All AI system integrations
   - Quality validators
   - Marketplace functionality
   - MLOps infrastructure

2. **Website Application** (`website/`)
   - All React components
   - API routes (without secrets)
   - UI/UX improvements
   - Documentation

3. **Documentation**
   - README files
   - User guides
   - API documentation
   - Roadmaps

4. **Configuration Files**
   - `package.json`
   - `tsconfig.json`
   - `next.config.js`
   - `vercel.json` (public config only)

### ❌ What Should NOT Be Committed (Proprietary/Private)

1. **Environment Variables**
   - `.env` files
   - `.env.local` files
   - API keys
   - Database credentials
   - Third-party service tokens

2. **Proprietary Business Logic**
   - Advanced monetization algorithms
   - Enterprise-specific features (if any)
   - Proprietary ML models (weights)

3. **Secrets & Credentials**
   - Private keys
   - OAuth secrets
   - Stripe keys
   - Supabase service keys

4. **Build Artifacts**
   - `.next/` directory
   - `node_modules/`
   - `dist/` or `build/` directories

## Commit Message Format

### Standard Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature (open source)
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

**Good Commit Messages:**
```
feat(plugins): Add reviews UI component

- Display plugin reviews with ratings
- Add review submission form
- Show rating distribution charts
- Integrate with reviews API

Closes #123
```

```
fix(marketplace): Resolve plugin installation state issue

The installation state was not persisting correctly
after page refresh. Fixed by improving localStorage
synchronization with API state.
```

```
docs(roadmap): Update Q1 2026 roadmap

Added plugin system enhancements and integration
expansion to immediate next steps.
```

**Bad Commit Messages:**
```
- "Fixed stuff"
- "WIP"
- "Update"
- "Added API key" (NEVER commit secrets!)
```

## Branch Strategy

### Main Branches
- `main`: Production-ready open source code
- `develop`: Development branch for open source features

### Feature Branches
- `feat/plugin-reviews`: Feature development
- `fix/marketplace-bug`: Bug fixes
- `docs/user-guide`: Documentation updates

## Pre-Commit Checklist

Before committing, ensure:

- [ ] No `.env` files or secrets in commit
- [ ] No API keys or credentials
- [ ] All code follows MIT license requirements
- [ ] Documentation is updated if needed
- [ ] Commit message follows format
- [ ] Code is tested and working
- [ ] No proprietary business logic exposed

## Commit Organization

### Separate Commits for Different Concerns

**Example:**
```bash
# Feature commit
git add components/beast-mode/PluginReviews.tsx
git commit -m "feat(plugins): Add reviews UI component"

# Integration commit
git add components/beast-mode/BeastModeDashboard.tsx
git commit -m "feat(marketplace): Integrate reviews into marketplace view"

# Documentation commit
git add docs/USER_GUIDE.md
git commit -m "docs(plugins): Update user guide with reviews feature"
```

### Avoid Monolithic Commits

**Bad:**
```bash
git add .
git commit -m "Updated everything"
```

**Good:**
```bash
git add components/beast-mode/PluginReviews.tsx
git commit -m "feat(plugins): Add reviews UI component"

git add components/beast-mode/PluginAnalytics.tsx
git commit -m "feat(plugins): Add analytics dashboard"

git add components/beast-mode/PluginUpdates.tsx
git commit -m "feat(plugins): Add update notifications UI"
```

## Handling Proprietary Code

If you need to work with proprietary code:

1. **Keep it in a separate private repository**
2. **Use environment variables** for configuration
3. **Abstract proprietary logic** behind interfaces
4. **Document the interface** in open source code
5. **Never commit proprietary implementations**

## Git Ignore

Ensure `.gitignore` includes:
- `.env*` files
- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `*.log`
- IDE files
- OS files

## Review Process

Before pushing to `main`:

1. Review all changes for secrets
2. Ensure no proprietary code
3. Verify commit messages are clear
4. Check that documentation is updated
5. Test that code works without secrets

## Emergency: If Secrets Were Committed

If secrets were accidentally committed:

1. **Immediately rotate the secret**
2. **Remove from git history** (if not pushed):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Add to `.gitignore`**
4. **Force push** (if already pushed, coordinate with team)
5. **Document the incident**

---

**Remember:** This is a public repository. Everything committed is visible to everyone. When in doubt, don't commit it.

