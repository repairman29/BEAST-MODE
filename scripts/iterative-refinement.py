#!/usr/bin/env python3
"""
BEAST MODE - Iterative Refinement System
Generate 10 passes with incremental improvements
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright
from brand_refinement_system import refine_file, REFINEMENT_PASSES

BASE_DIR = Path(__file__).parent.parent
HTML_DIR = BASE_DIR / "visuals" / "html"
ASSETS_DIR = BASE_DIR / "assets"
REFINEMENT_DIR = ASSETS_DIR / "refinements"

REFINEMENT_DIR.mkdir(exist_ok=True)

async def generate_refined_visual(page, html_file, pass_num, total_passes):
    """Generate a visual with specific refinement pass applied"""
    # Apply refinement passes incrementally
    passes_to_apply = REFINEMENT_PASSES[:pass_num]
    
    # Read original
    original_content = html_file.read_text()
    
    # Apply passes incrementally
    refined_content = original_content
    for pass_config in passes_to_apply:
        refined_content = refine_file(html_file, [pass_config])
    
    # Write temporary file
    temp_file = html_file.parent / f".temp-{html_file.stem}-pass{pass_num}.html"
    temp_file.write_text(refined_content)
    
    # Generate screenshot
    output_file = REFINEMENT_DIR / f"{html_file.stem}-pass-{pass_num:02d}.png"
    
    try:
        file_url = temp_file.as_uri()
        await page.goto(file_url, wait_until="networkidle")
        await page.set_viewport_size({"width": 1600, "height": 1000})
        await asyncio.sleep(2)  # Wait for animations
        
        await page.screenshot(
            path=str(output_file),
            full_page=True,
            type="png"
        )
        
        # Cleanup temp file
        temp_file.unlink()
        
        return True
    except Exception as e:
        print(f"    ❌ Error: {e}")
        if temp_file.exists():
            temp_file.unlink()
        return False

async def iterative_refinement(num_passes=10):
    """Generate iterative refinement passes"""
    print("🎨 BEAST MODE Iterative Refinement System\n")
    print(f"Generating {num_passes} incremental passes...\n")
    
    html_files = list(HTML_DIR.glob("*-infographic.html"))
    
    if not html_files:
        print("⚠️  No infographic HTML files found")
        return
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        for html_file in html_files:
            print(f"\n{'='*60}")
            print(f"Refining: {html_file.name}")
            print(f"{'='*60}\n")
            
            for pass_num in range(1, num_passes + 1):
                print(f"  Pass {pass_num:02d}/{num_passes:02d}...", end=" ")
                success = await generate_refined_visual(page, html_file, pass_num, num_passes)
                if success:
                    print("✅")
                else:
                    print("❌")
                await asyncio.sleep(0.5)
        
        await browser.close()
    
    print("\n" + "="*60)
    print("✅ Iterative Refinement Complete")
    print("="*60)
    print(f"\n📁 Refinement passes: {REFINEMENT_DIR}")
    print("\n💡 Review passes and select best version")

if __name__ == "__main__":
    import sys
    num_passes = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(iterative_refinement(num_passes))

