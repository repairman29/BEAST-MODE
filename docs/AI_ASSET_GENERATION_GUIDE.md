# AI Asset Generation Guide for BEAST MODE Brand Assets

**Purpose:** Use existing AI tools to generate brand assets (logos, images, videos)

---

## 🎨 Available AI Tools

### **1. OpenAI (DALL-E 3)**
**Capability:** Image generation (logos, graphics, illustrations)  
**Quality:** High (photorealistic, detailed)  
**Best For:** Logos, brand graphics, illustrations

**How to Use:**
```javascript
const openai = require('openai');
const client = new openai({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.images.generate({
  model: "dall-e-3",
  prompt: "A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style",
  size: "1024x1024",
  quality: "hd",
  n: 1
});
```

**API Route:** Can be added to `/api/ai/generate-image`

---

### **2. Replicate (Stable Diffusion, Flux)**
**Capability:** Image generation (logos, graphics, illustrations)  
**Quality:** High (multiple models available)  
**Best For:** Logos, brand graphics, concept art

**Available Models:**
- `stability-ai/stable-diffusion-xl-base-1.0`
- `black-forest-labs/flux-dev`
- `lucataco/sdxl-lightning`

**How to Use:**
```javascript
const Replicate = require('replicate');
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await replicate.run(
  "stability-ai/stable-diffusion-xl-base-1.0",
  {
    input: {
      prompt: "A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style",
      width: 1024,
      height: 1024
    }
  }
);
```

**API Route:** Can be added to `/api/ai/generate-image`

---

### **3. Anthropic (Claude)**
**Capability:** Text generation, image analysis, design guidance  
**Quality:** High (excellent for prompts)  
**Best For:** Writing prompts, design guidance, content generation

**How to Use:**
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: "Write a detailed prompt for generating a BEAST MODE logo: a modern, minimal beast head silhouette, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style"
  }]
});
```

**API Route:** Already available via `/api/llm`

---

### **4. Google Gemini (Imagen 3)**
**Capability:** Image generation (if available)  
**Quality:** High  
**Best For:** Logos, graphics

**How to Use:**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Note: Image generation may require specific API access
```

---

## 🚀 Implementation Plan

### **Step 1: Create Image Generation API Route**

**File:** `website/app/api/ai/generate-image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  const { prompt, model = 'dalle-3', size = '1024x1024' } = await request.json();

  try {
    let imageUrl;

    if (model === 'dalle-3') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: size === '1024x1024' ? '1024x1024' : '1792x1024',
        quality: "hd",
        n: 1
      });
      imageUrl = response.data[0].url;
    } else if (model === 'stable-diffusion') {
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      const output = await replicate.run(
        "stability-ai/stable-diffusion-xl-base-1.0",
        { input: { prompt, width: 1024, height: 1024 } }
      );
      imageUrl = Array.isArray(output) ? output[0] : output;
    }

    return NextResponse.json({ imageUrl, prompt, model });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### **Step 2: Create Logo Generation Script**

**File:** `scripts/generate-logo.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const logoPrompts = [
  {
    name: 'beast-head-primary',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, white background, 1024x1024'
  },
  {
    name: 'beast-head-dark',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, dark background (#1F2937), 1024x1024'
  },
  {
    name: 'full-logo-horizontal',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on the left, "BEAST MODE" text on the right in bold uppercase sans-serif font, blue (#3B82F6) and dark gray (#1F2937), professional tech company style, horizontal layout, white background, 2048x512'
  },
  {
    name: 'full-logo-stacked',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on top, "BEAST MODE" text below in bold uppercase sans-serif font, blue (#3B82F6) and dark gray (#1F2937), professional tech company style, vertical layout, white background, 512x1024'
  }
];

async function generateLogo(prompt, outputPath) {
  console.log(`Generating: ${outputPath}...`);
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "hd",
      n: 1
    });

    const imageUrl = response.data[0].url;
    console.log(`✅ Generated: ${imageUrl}`);
    console.log(`   Download to: ${outputPath}`);
    
    // Note: You'll need to download the image from the URL
    // Can use: curl or fetch to download
    
    return imageUrl;
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
    throw error;
  }
}

async function generateAllLogos() {
  console.log('🎨 Generating BEAST MODE Logo Assets\n');
  
  const outputDir = path.join(__dirname, '../website/public/logos');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];

  for (const logo of logoPrompts) {
    const outputPath = path.join(outputDir, `${logo.name}.png`);
    try {
      const imageUrl = await generateLogo(logo.prompt, outputPath);
      results.push({ name: logo.name, url: imageUrl, path: outputPath });
    } catch (error) {
      console.error(`Failed to generate ${logo.name}`);
    }
  }

  console.log('\n📋 Generated Logos:');
  results.forEach(r => {
    console.log(`   ${r.name}: ${r.url}`);
    console.log(`   Download: curl "${r.url}" -o "${r.path}"`);
  });

  console.log('\n✅ Logo generation complete!');
  console.log('📝 Next: Download images and optimize for web');
}

if (require.main === module) {
  generateAllLogos().catch(console.error);
}

module.exports = { generateLogo, generateAllLogos };
```

---

### **Step 3: Create Prompt Generation Script**

**File:** `scripts/generate-logo-prompts.js`

```javascript
#!/usr/bin/env node

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateLogoPrompts() {
  console.log('🎨 Generating Logo Prompts with Claude\n');

  const request = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Create detailed DALL-E 3 prompts for BEAST MODE logo generation:

Brand: BEAST MODE
Colors: Beast Blue (#3B82F6), Mode Purple (#8B5CF6), Accent Orange (#F97316)
Style: Modern, minimal, angular, geometric, powerful, animalistic
Typography: Inter, bold, uppercase

Create prompts for:
1. Beast head icon (primary, light background)
2. Beast head icon (dark background)
3. Full logo horizontal (icon + text)
4. Full logo stacked (icon above text)
5. Favicon (32x32, simplified)

Each prompt should be detailed, specific, and optimized for DALL-E 3.`
    }]
  });

  console.log('✅ Generated Prompts:\n');
  console.log(request.content[0].text);
}

generateLogoPrompts().catch(console.error);
```

---

## 📋 Asset Generation Checklist

### **Logo Assets**
- [ ] Beast head icon (primary)
- [ ] Beast head icon (dark mode)
- [ ] Full logo horizontal
- [ ] Full logo stacked
- [ ] Favicon (32x32)
- [ ] Favicon (16x16)

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

## 🛠️ Quick Start

### **1. Generate Logo Prompts**
```bash
node scripts/generate-logo-prompts.js
```

### **2. Generate Logos**
```bash
# Set API keys
export OPENAI_API_KEY=your_key
export REPLICATE_API_TOKEN=your_token

# Generate logos
node scripts/generate-logo.js
```

### **3. Use API Route**
```bash
# Start dev server
npm run dev

# Generate image via API
curl -X POST http://localhost:3000/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "BEAST MODE logo...", "model": "dalle-3"}'
```

---

## 💡 Best Practices

### **Prompt Engineering**
- Be specific about colors (hex codes)
- Specify style (minimal, modern, geometric)
- Include dimensions and layout
- Mention "vector art style" for logos
- Specify background (white, dark, transparent)

### **Model Selection**
- **DALL-E 3:** Best for logos, high quality, follows prompts well
- **Stable Diffusion:** Good for variations, more control
- **Flux:** Latest model, excellent quality

### **Optimization**
- Generate at high resolution (1024x1024+)
- Use "hd" quality for DALL-E 3
- Post-process for web (compress, optimize)
- Create multiple variations

---

## 🔗 Integration with Existing System

### **Use Existing AI Infrastructure**
- User API keys from Supabase (`user_api_keys` table)
- Rate limiting via existing system
- Usage tracking via existing analytics
- Cost tracking via existing monitoring

### **Add to BEAST MODE API**
- New endpoint: `/api/ai/generate-image`
- Uses existing AI provider system
- Integrates with user authentication
- Tracks usage and costs

---

**Ready to generate brand assets with AI! 🎨**
