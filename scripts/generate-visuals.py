#!/usr/bin/env python3
"""
BEAST MODE - Visual Assets Generator (Python + Playwright)
Automatically generates high-fidelity visual assets from HTML files
"""

import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import time

# Paths
BASE_DIR = Path(__file__).parent.parent
VISUALS_DIR = BASE_DIR / "visuals"
ASSETS_DIR = BASE_DIR / "assets"
HTML_DIR = VISUALS_DIR / "html"
CSS_DIR = VISUALS_DIR / "css"

# Ensure assets directory exists
ASSETS_DIR.mkdir(exist_ok=True)

# Server configuration
SERVER_PORT = 8000
SERVER_URL = f"http://localhost:{SERVER_PORT}"

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Custom handler to serve files from visuals directory"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    """Start local HTTP server"""
    server = HTTPServer(("localhost", SERVER_PORT), CustomHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(1)  # Give server time to start
    return server

async def generate_html_visual(page, html_file, output_file, width=1200, height=800):
    """Generate screenshot from HTML file"""
    try:
        # Use file:// URL directly
        file_url = html_file.as_uri()
        
        print(f"📸 Generating: {output_file.name}")
        print(f"   File: {html_file}")
        
        await page.goto(file_url, wait_until="networkidle")
        await page.set_viewport_size({"width": width, "height": height})
        
        # Wait for any animations/transitions
        await asyncio.sleep(1)
        
        await page.screenshot(
            path=str(output_file),
            full_page=True,
            type="png"
        )
        
        print(f"✅ Generated: {output_file.name}")
        return True
    except Exception as e:
        print(f"❌ Failed to generate {output_file.name}: {e}")
        return False

async def generate_mermaid_diagram(page, mermaid_file, output_file):
    """Generate Mermaid diagram using mermaid.live API or local rendering"""
    try:
        # Read Mermaid content
        mermaid_content = mermaid_file.read_text()
        
        # Use Mermaid Live Editor approach
        # Create a simple HTML page with Mermaid
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
    </script>
</head>
<body style="margin: 0; padding: 20px; background: white;">
    <div class="mermaid">
{mermaid_content}
    </div>
</body>
</html>
"""
        
        # Create temp HTML file
        temp_html = HTML_DIR / f"temp_{mermaid_file.stem}.html"
        temp_html.write_text(html_content)
        
        # Generate screenshot using file:// URL
        file_url = temp_html.as_uri()
        
        print(f"📸 Generating: {output_file.name}")
        await page.goto(file_url, wait_until="networkidle")
        await page.set_viewport_size({"width": 1200, "height": 800})
        await asyncio.sleep(3)  # Wait for Mermaid to render
        
        await page.screenshot(
            path=str(output_file),
            full_page=True,
            type="png"
        )
        
        # Clean up temp file
        temp_html.unlink()
        
        print(f"✅ Generated: {output_file.name}")
        return True
    except Exception as e:
        print(f"❌ Failed to generate {output_file.name}: {e}")
        return False

async def generate_all_visuals():
    """Generate all visual assets"""
    print("🎨 BEAST MODE Visual Assets Generator (Python + Playwright)\n")
    
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. HTML-based visuals (Infographic versions)
        print("\n📄 Generating HTML-based infographics...\n")
        
        # Try infographic versions first, fallback to originals
        infographic_files = {
            "governance-layer-infographic.html": ("governance-layer-architecture.png", 1600, 1000),
            "mullet-strategy-infographic.html": ("mullet-strategy-dual-brand.png", 1600, 1200),
            "before-after-infographic.html": ("before-after-transformation.png", 1800, 1000),
            "overnight-cycle-infographic.html": ("overnight-refactoring-cycle.png", 1400, 1200),
            "tech-stack-infographic.html": ("market-positioning-map.png", 1600, 1000),
            "three-walls-infographic.html": ("three-walls-solution-map.png", 1800, 1200),
            "english-source-code-infographic.html": ("english-as-source-code-workflow.png", 1800, 1000),
        }
        
        # Fallback to original files if infographic versions don't exist
        fallback_files = {
            "mullet-strategy.html": ("mullet-strategy-dual-brand.png", 1400, 1200),
            "before-after.html": ("before-after-transformation.png", 1600, 900),
        }
        
        for html_file, (output_name, width, height) in infographic_files.items():
            html_path = HTML_DIR / html_file
            output_path = ASSETS_DIR / output_name
            
            if html_path.exists():
                if await generate_html_visual(page, html_path, output_path, width=width, height=height):
                    results["success"].append(output_name.replace(".png", "").replace("-", " ").title())
                else:
                    results["failed"].append(output_name.replace(".png", "").replace("-", " ").title())
            else:
                # Try fallback
                fallback_name = html_file.replace("-infographic", "")
                if fallback_name in fallback_files:
                    fallback_path = HTML_DIR / fallback_name
                    if fallback_path.exists():
                        fallback_output, fallback_w, fallback_h = fallback_files[fallback_name]
                        if await generate_html_visual(page, fallback_path, ASSETS_DIR / fallback_output, width=fallback_w, height=fallback_h):
                            results["success"].append(output_name.replace(".png", "").replace("-", " ").title())
                        else:
                            results["failed"].append(output_name.replace(".png", "").replace("-", " ").title())
                    else:
                        results["skipped"].append(f"{html_file} (file not found)")
                else:
                    results["skipped"].append(f"{html_file} (file not found)")
        
        # 2. Mermaid diagrams
        print("\n📊 Generating Mermaid diagrams...\n")
        
        mermaid_files = {
            "architecture.mmd": "governance-layer-architecture.png",
            "overnight-cycle.mmd": "overnight-refactoring-cycle.png",
            "vibe-ops.mmd": "english-as-source-code-workflow.png",
            "three-walls.mmd": "three-walls-solution-map.png",
            "market-positioning.mmd": "market-positioning-map.png"
        }
        
        for mmd_file, output_name in mermaid_files.items():
            mermaid_path = VISUALS_DIR / "mermaid" / mmd_file
            output_path = ASSETS_DIR / output_name
            
            if mermaid_path.exists():
                if await generate_mermaid_diagram(page, mermaid_path, output_path):
                    results["success"].append(output_name.replace(".png", "").replace("-", " ").title())
                else:
                    results["failed"].append(output_name.replace(".png", "").replace("-", " ").title())
            else:
                results["skipped"].append(f"{mmd_file} (file not found)")
        
        await browser.close()
    
    # Summary
    print("\n" + "="*60)
    print("📊 Generation Summary")
    print("="*60)
    print(f"✅ Success: {len(results['success'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    print(f"⏭️  Skipped: {len(results['skipped'])}")
    
    if results["success"]:
        print("\n✅ Generated:")
        for item in results["success"]:
            print(f"   - {item}")
    
    if results["failed"]:
        print("\n❌ Failed:")
        for item in results["failed"]:
            print(f"   - {item}")
    
    if results["skipped"]:
        print("\n⏭️  Skipped:")
        for item in results["skipped"]:
            print(f"   - {item}")
    
    print(f"\n📁 Assets saved to: {ASSETS_DIR}")
    print("="*60)

if __name__ == "__main__":
    try:
        asyncio.run(generate_all_visuals())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

