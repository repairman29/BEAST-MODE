# Supabase AI Tools for Brand Asset Generation

**Quick Reference:** Which AI tools in your Supabase can create brand assets

---

## 🎨 Available AI Tools in Your System

### **1. OpenAI (DALL-E 3) - BEST FOR LOGOS**
**Status:** ✅ Available  
**Location:** Can use via API or user API keys in Supabase  
**Capability:** High-quality image generation (logos, graphics)

**How to Access:**
- **Via User API Keys:** Stored in `user_api_keys` table (Supabase)
- **Via System Key:** `OPENAI_API_KEY` in environment
- **Via API Route:** `/api/ai/generate-image` (just created)

**Best For:**
- ✅ Logo generation (beast head, full logo)
- ✅ Brand graphics
- ✅ Social media assets
- ✅ Website illustrations

**Example Usage:**
```bash
# Via API route
curl -X POST http://localhost:3000/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "BEAST MODE logo: modern beast head silhouette...",
    "model": "dalle-3"
  }'

# Via script
node scripts/generate-brand-assets.js
```

---

### **2. Replicate (Stable Diffusion, Flux)**
**Status:** ✅ Available  
**Location:** Can use via API or user API keys  
**Capability:** Image generation with multiple models

**Available Models:**
- `stability-ai/stable-diffusion-xl-base-1.0` - High quality
- `black-forest-labs/flux-dev` - Latest, excellent quality
- `lucataco/sdxl-lightning` - Fast generation

**Best For:**
- ✅ Logo variations
- ✅ Concept art
- ✅ Multiple iterations

**How to Access:**
- **Via User API Keys:** `REPLICATE_API_TOKEN` in Supabase
- **Via System Key:** `REPLICATE_API_TOKEN` in environment
- **Via API Route:** `/api/ai/generate-image?model=stable-diffusion`

---

### **3. Anthropic (Claude)**
**Status:** ✅ Available  
**Location:** Can use via API or user API keys  
**Capability:** Text generation, prompt engineering

**Best For:**
- ✅ Writing detailed prompts for image generation
- ✅ Design guidance
- ✅ Content generation (blog posts, social media)

**How to Access:**
- **Via User API Keys:** `ANTHROPIC_API_KEY` in Supabase
- **Via System Key:** `ANTHROPIC_API_KEY` in environment
- **Via Existing Routes:** `/api/llm/*` routes

**Example Usage:**
```javascript
// Generate logo prompt
const prompt = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{
    role: "user",
    content: "Write a detailed DALL-E 3 prompt for BEAST MODE logo..."
  }]
});
```

---

### **4. Google Gemini**
**Status:** ✅ Available (if API key set)  
**Location:** Can use via user API keys  
**Capability:** Text generation, potentially image generation

**Best For:**
- ✅ Prompt generation
- ✅ Content creation
- ✅ Design suggestions

---

## 🗄️ Supabase Integration

### **User API Keys Table**
**Table:** `user_api_keys` (in Supabase)  
**Stores:**
- `user_id` - User identifier
- `provider` - 'openai', 'anthropic', 'replicate', 'gemini', etc.
- `key` - Encrypted API key
- `created_at`, `updated_at`

**How It Works:**
1. User adds their API key via dashboard
2. Key stored encrypted in Supabase
3. API routes fetch key for user
4. Use key to generate assets

### **Usage Tracking**
**Table:** `user_usage` (in Supabase)  
**Tracks:**
- `user_id`
- `action_type` - 'generate_image', 'api_call', etc.
- `usage_count` - Number of generations
- `period_start`, `period_end`

---

## 🚀 Quick Start: Generate Brand Assets

### **Option 1: Use System API Key (Fastest)**

```bash
# 1. Set API key in .env.local
echo "OPENAI_API_KEY=sk-..." >> website/.env.local

# 2. Start dev server
cd website && npm run dev

# 3. Generate assets
cd .. && node scripts/generate-brand-assets.js
```

### **Option 2: Use User API Key from Supabase**

```typescript
// In API route, fetch user's key
const { data: apiKey } = await supabase
  .from('user_api_keys')
  .select('key')
  .eq('user_id', userId)
  .eq('provider', 'openai')
  .single();

// Use key to generate
const openai = new OpenAI({ apiKey: apiKey.key });
```

### **Option 3: Via API Route (Web Interface)**

```bash
# Generate logo via API
curl -X POST https://beast-mode.dev/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "BEAST MODE logo...",
    "model": "dalle-3",
    "userId": "user-id-from-supabase"
  }'
```

---

## 📋 Assets You Can Generate

### **Logo Assets**
- [ ] Beast head icon (primary, light background)
- [ ] Beast head icon (dark background)
- [ ] Full logo horizontal (icon + text)
- [ ] Full logo stacked (icon above text)
- [ ] Favicon (32x32, simplified)

### **Social Media Assets**
- [ ] Twitter header (1500x500)
- [ ] LinkedIn banner (1584x396)
- [ ] Instagram profile (400x400)
- [ ] Reddit banner (1920x256)

### **Website Assets**
- [ ] Open Graph image (1200x630)
- [ ] Hero background (1920x1080)
- [ ] Feature illustrations
- [ ] Icon set

---

## 💡 Best Practices

### **Prompt Engineering**
1. **Be Specific:** Include colors (hex codes), style, dimensions
2. **Use Brand Guidelines:** Reference brand colors, typography
3. **Iterate:** Generate multiple variations, pick best
4. **Optimize:** Generate at high resolution, compress for web

### **Cost Management**
- **DALL-E 3:** ~$0.04 per image (1024x1024)
- **Stable Diffusion:** ~$0.002 per image (via Replicate)
- **Track Usage:** Use `user_usage` table to monitor

### **Quality Tips**
- Use "hd" quality for DALL-E 3
- Specify "vector art style" for logos
- Include "professional tech company style"
- Mention "minimal, modern, geometric"

---

## 🔗 Integration Points

### **Existing Infrastructure**
- ✅ User API keys stored in Supabase
- ✅ Rate limiting system
- ✅ Usage tracking
- ✅ Cost monitoring
- ✅ API routes for AI services

### **New Additions**
- ✅ `/api/ai/generate-image` route
- ✅ `scripts/generate-brand-assets.js`
- ✅ Asset generation guide

---

## 📊 Cost Estimates

### **Logo Generation (5 variations)**
- DALL-E 3: ~$0.20 (5 images × $0.04)
- Stable Diffusion: ~$0.01 (5 images × $0.002)

### **Full Brand Asset Set (20 assets)**
- DALL-E 3: ~$0.80
- Stable Diffusion: ~$0.04

**Recommendation:** Use DALL-E 3 for logos (better quality), Stable Diffusion for variations/iterations (lower cost)

---

## 🚀 Ready to Generate

**Quick Command:**
```bash
# Generate all brand assets
node scripts/generate-brand-assets.js
```

**What It Does:**
1. Uses OpenAI DALL-E 3 (or your preferred model)
2. Generates 5 logo variations
3. Downloads images to `website/public/logos/`
4. Ready to use in website

**Requirements:**
- `OPENAI_API_KEY` in `.env.local`
- Dev server running (for API route)
- Or use direct OpenAI SDK

---

**Your Supabase AI tools are ready to generate brand assets! 🎨**
