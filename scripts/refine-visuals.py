#!/usr/bin/env python3
"""
BEAST MODE - Visual Assets Refinement System
Generate multiple passes to perfect brand consistency
"""

import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright
import json

BASE_DIR = Path(__file__).parent.parent
VISUALS_DIR = BASE_DIR / "visuals"
ASSETS_DIR = BASE_DIR / "assets"
HTML_DIR = VISUALS_DIR / "html"
REFINEMENT_DIR = ASSETS_DIR / "refinements"

REFINEMENT_DIR.mkdir(exist_ok=True)

# Brand color specifications
BRAND_COLORS = {
    "beast_mode": {
        "bg": "#0a0a0f",
        "primary": "#9333EA",
        "secondary": "#EC4899",
        "accent": "#06B6D4",
        "text": "#f9fafb",
        "glow": "rgba(147, 51, 234, 0.5)"
    },
    "sentinel": {
        "bg": "#1e293b",
        "primary": "#1E3A8A",
        "secondary": "#475569",
        "accent": "#F59E0B",
        "text": "#ffffff",
        "glow": "rgba(30, 58, 138, 0.3)"
    }
}

# Visual assets to refine
VISUAL_ASSETS = [
    {
        "name": "governance-layer",
        "html": "governance-layer-infographic.html",
        "output": "governance-layer-architecture.png",
        "width": 1600,
        "height": 1000,
        "brand": "beast_mode",
        "focus": ["shield glow", "particle flow", "diamond output"]
    },
    {
        "name": "mullet-strategy",
        "html": "mullet-strategy-infographic.html",
        "output": "mullet-strategy-dual-brand.png",
        "width": 1600,
        "height": 1200,
        "brand": "both",
        "focus": ["lightning bolt", "color contrast", "split balance"]
    },
    {
        "name": "before-after",
        "html": "before-after-infographic.html",
        "output": "before-after-transformation.png",
        "width": 1800,
        "height": 1000,
        "brand": "beast_mode",
        "focus": ["diff styling", "glitch effects", "bridge arrow"]
    },
    {
        "name": "overnight-cycle",
        "html": "overnight-cycle-infographic.html",
        "output": "overnight-refactoring-cycle.png",
        "width": 1400,
        "height": 1200,
        "brand": "beast_mode",
        "focus": ["clock glow", "segment colors", "center clock"]
    },
    {
        "name": "tech-stack",
        "html": "tech-stack-infographic.html",
        "output": "market-positioning-map.png",
        "width": 1600,
        "height": 1000,
        "brand": "both",
        "focus": ["layer glow", "governance prominence", "stack balance"]
    },
    {
        "name": "three-walls",
        "html": "three-walls-infographic.html",
        "output": "three-walls-solution-map.png",
        "width": 1800,
        "height": 1200,
        "brand": "beast_mode",
        "focus": ["wall icons", "solution bridges", "status badges"]
    },
    {
        "name": "english-source-code",
        "html": "english-source-code-infographic.html",
        "output": "english-as-source-code-workflow.png",
        "width": 1800,
        "height": 1000,
        "brand": "beast_mode",
        "focus": ["story flow", "step cards", "connecting line"]
    }
]

async def generate_refinement_pass(page, asset, pass_num):
    """Generate a refinement pass"""
    html_file = HTML_DIR / asset["html"]
    output_file = REFINEMENT_DIR / f"{asset['name']}-pass-{pass_num:02d}.png"
    
    if not html_file.exists():
        print(f"⚠️  {asset['html']} not found")
        return False
    
    try:
        file_url = html_file.as_uri()
        await page.goto(file_url, wait_until="networkidle")
        await page.set_viewport_size({"width": asset["width"], "height": asset["height"]})
        await asyncio.sleep(1.5)  # Wait for animations
        
        await page.screenshot(
            path=str(output_file),
            full_page=True,
            type="png"
        )
        
        print(f"✅ Pass {pass_num:02d}: {output_file.name}")
        return True
    except Exception as e:
        print(f"❌ Pass {pass_num:02d} failed: {e}")
        return False

async def refine_all_visuals(num_passes=10):
    """Generate multiple refinement passes for all visuals"""
    print("🎨 BEAST MODE Visual Refinement System\n")
    print(f"Generating {num_passes} passes for each visual...\n")
    
    results = {}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        for asset in VISUAL_ASSETS:
            print(f"\n{'='*60}")
            print(f"Refining: {asset['name']}")
            print(f"Focus areas: {', '.join(asset['focus'])}")
            print(f"{'='*60}\n")
            
            asset_results = []
            for pass_num in range(1, num_passes + 1):
                success = await generate_refinement_pass(page, asset, pass_num)
                asset_results.append(success)
                await asyncio.sleep(0.5)  # Small delay between passes
            
            results[asset['name']] = {
                "success": sum(asset_results),
                "total": num_passes,
                "passes": asset_results
            }
        
        await browser.close()
    
    # Summary
    print("\n" + "="*60)
    print("📊 Refinement Summary")
    print("="*60)
    
    for asset_name, result in results.items():
        success_rate = (result["success"] / result["total"]) * 100
        print(f"{asset_name}: {result['success']}/{result['total']} passes ({success_rate:.0f}%)")
    
    print(f"\n📁 Refinement passes saved to: {REFINEMENT_DIR}")
    print("\n💡 Next steps:")
    print("   1. Review all passes for each visual")
    print("   2. Select the best version")
    print("   3. Copy to assets/ as final version")
    print("   4. Update HTML/CSS based on best pass")

if __name__ == "__main__":
    import sys
    num_passes = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(refine_all_visuals(num_passes))

