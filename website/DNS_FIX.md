# DNS Fix for beast-mode.dev

## Current Status
- ✅ Latest deployment: SUCCESS
- ❌ Domain: beast-mode.dev not resolving
- 🔧 Nameservers: Pointing to Porkbun (need to point to Vercel)

## Fix Option 1: Change Nameservers to Vercel (Recommended)

1. Go to Porkbun DNS management
2. Change nameservers to Vercel's:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

3. Wait 5-30 minutes for DNS propagation

## Fix Option 2: Add CNAME Records in Porkbun

1. Go to Porkbun DNS management for beast-mode.dev
2. Add these CNAME records:
   - Host: `@` → Answer: `cname.vercel-dns.com`
   - Host: `www` → Answer: `cname.vercel-dns.com`

3. Wait 5-30 minutes for DNS propagation

## Verify

After DNS propagates:
```bash
dig beast-mode.dev +short
# Should return Vercel IP addresses

curl -I https://beast-mode.dev
# Should return 200 OK
```

## Current Working URL

Until DNS is fixed, use:
- https://beast-mode-jeff-adkins-projects.vercel.app

