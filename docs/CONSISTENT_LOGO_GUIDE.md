# Consistent Logo Guide

## Problem
AI-generated logos (DALL-E 3) create different variations each time, making them inconsistent across different sizes/backgrounds.

## Solution
**Use ONE base image and create all variations from it.**

## Quick Fix (Current)

All logos in `website/public/logos/consistent/` are copies of the best base image (`beast-head-primary.png`). This ensures they're all identical.

### Next Steps

1. **Select the best base icon** from the generated logos
2. **Use Sharp or design tool** to create variations:
   - Different backgrounds (light/dark)
   - Add text for full logos
   - Resize for favicon

3. **Or use the website API route** (`/api/ai/generate-image`) with image-to-image models (Replicate) to remix the base image consistently.

## Using Sharp (Recommended)

```bash
npm install sharp
node scripts/create-consistent-logos.js
```

This will:
- Take the best base image
- Create all variations with different backgrounds
- Maintain the same icon across all

## Using Replicate (AI Remixing)

If you have `REPLICATE_API_TOKEN`:

```bash
node scripts/remix-logo-for-consistency.js
```

This uses image-to-image models to remix the base image with different prompts while maintaining consistency.

## Manual Approach

1. Pick the best logo (e.g., `beast-head-primary.png`)
2. Use a design tool (Figma, Photoshop, etc.) to:
   - Change backgrounds
   - Add "BEAST MODE" text
   - Create different sizes
3. Export all variations

## Current Status

✅ Base images copied to `consistent/` folder
⚠️ Need to add backgrounds/text using Sharp or design tool
📋 All variations currently use the same base image (consistent!)
