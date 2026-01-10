# Quick Start: Generate Brand Assets

**Fastest way to generate BEAST MODE logos and brand assets**

---

## 🚀 Option 1: Direct Generation (Fastest)

**If you have an OpenAI API key:**

```bash
# 1. Set API key
export OPENAI_API_KEY=sk-your-key-here

# 2. Generate assets
cd BEAST-MODE-PRODUCT
node scripts/generate-brand-assets-direct.js
```

**That's it!** Assets will be saved to `website/public/logos/`

---

## 🔑 Option 2: Add Key to Supabase First

**If you want to store the key in Supabase:**

```bash
# 1. Run setup script
cd BEAST-MODE-PRODUCT
node scripts/setup-openai-key-for-assets.js

# 2. Enter your OpenAI API key when prompted
# (Get it from: https://platform.openai.com/api-keys)

# 3. Generate assets
node scripts/generate-brand-assets-with-supabase.js
```

---

## 📝 Option 3: Add to .env.local

**If you prefer environment variables:**

```bash
# 1. Add to .env.local
echo 'OPENAI_API_KEY=sk-your-key-here' >> website/.env.local

# 2. Generate assets
node scripts/generate-brand-assets-direct.js
```

---

## 🎨 What Gets Generated

1. **beast-head-primary.png** - Beast head icon (light background)
2. **beast-head-dark.png** - Beast head icon (dark background)
3. **full-logo-horizontal.png** - Full logo with text (horizontal)
4. **full-logo-stacked.png** - Full logo with text (vertical)
5. **favicon.png** - Simplified icon for favicon

**Location:** `website/public/logos/`

---

## 💰 Cost & Time

- **Cost:** ~$0.20 (5 images × $0.04 each)
- **Time:** ~2-3 minutes (includes rate limit delays)
- **Quality:** High (DALL-E 3 HD)

---

## ✅ After Generation

1. **Review images** in `website/public/logos/`
2. **Optimize for web** (compress if needed)
3. **Create favicon** from `favicon.png` (resize to 32x32, 16x16)
4. **Update website** to use new logos

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not found"
- Set the key using one of the options above
- Or add to Supabase using setup script

### "Rate limit exceeded"
- DALL-E 3 has rate limits (~1 request per 3 seconds)
- Script automatically waits between requests
- If still failing, wait a few minutes and retry

### "Failed to download image"
- Check internet connection
- Image URLs expire after 1 hour
- Re-run generation if needed

---

## 🎯 Next Steps

After generating assets:
1. Review and select best variations
2. Optimize images for web
3. Create favicon sizes (16x16, 32x32)
4. Update website components to use new logos
5. Update social media profiles

---

**Ready to generate! Run one of the options above. 🚀**
