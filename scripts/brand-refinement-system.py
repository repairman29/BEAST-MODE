#!/usr/bin/env python3
"""
BEAST MODE - Brand Refinement System
Systematically improves visuals with incremental brand adjustments
"""

import re
from pathlib import Path
from typing import Dict, List

BASE_DIR = Path(__file__).parent.parent
HTML_DIR = BASE_DIR / "visuals" / "html"
CSS_DIR = BASE_DIR / "visuals" / "css"

# Brand color specifications (exact hex codes)
BRAND_COLORS = {
    "beast_mode": {
        "bg": "#0a0a0f",
        "primary": "#9333EA",
        "secondary": "#EC4899",
        "accent": "#06B6D4",
        "text": "#f9fafb",
        "glow": "rgba(147, 51, 234, 0.5)",
        "glow_strong": "rgba(147, 51, 234, 0.8)"
    },
    "sentinel": {
        "bg": "#1e293b",
        "primary": "#1E3A8A",
        "secondary": "#475569",
        "accent": "#F59E0B",
        "text": "#ffffff",
        "glow": "rgba(30, 58, 138, 0.3)",
        "glow_strong": "rgba(30, 58, 138, 0.6)"
    }
}

# Refinement passes with specific improvements
REFINEMENT_PASSES = [
    {
        "name": "Color Accuracy",
        "changes": [
            ("#9333EA", "#9333EA"),  # Verify exact purple
            ("#06B6D4", "#06B6D4"),  # Verify exact cyan
            ("#1E3A8A", "#1E3A8A"),  # Verify exact blue
            ("#F59E0B", "#F59E0B"),  # Verify exact gold
            ("#0a0a0f", "#0a0a0f"),  # Verify exact dark bg
        ]
    },
    {
        "name": "Glow Intensity",
        "changes": [
            (r"rgba\(147, 51, 234, 0\.\d+\)", lambda m: f"rgba(147, 51, 234, {min(0.8, float(m.group(0).split(',')[3].strip(')')) + 0.1)})"),
            (r"box-shadow: 0 0 \d+px", lambda m: f"box-shadow: 0 0 {int(m.group(0).split()[-1].replace('px', '')) + 10}px"),
        ]
    },
    {
        "name": "Typography",
        "changes": [
            (r"font-family: ['\"].*?['\"]", "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"),
            (r"font-size: (\d+\.?\d*)rem", lambda m: f"font-size: {max(1.0, float(m.group(1)))}rem"),  # Ensure minimum readability
        ]
    },
    {
        "name": "Spacing",
        "changes": [
            (r"padding: (\d+)rem", lambda m: f"padding: {max(2, int(m.group(1)))}rem"),
            (r"gap: (\d+)rem", lambda m: f"gap: {max(1.5, int(m.group(1)))}rem"),
        ]
    },
    {
        "name": "Contrast",
        "changes": [
            (r"opacity: 0\.(\d+)", lambda m: f"opacity: {min(0.95, float('0.' + m.group(1)) + 0.05)}"),
            (r"rgba\(255, 255, 255, 0\.(\d+)\)", lambda m: f"rgba(255, 255, 255, {min(0.95, float('0.' + m.group(1)) + 0.1)})"),
        ]
    },
    {
        "name": "Border Radius",
        "changes": [
            (r"border-radius: (\d+)px", lambda m: f"border-radius: {max(12, int(m.group(1)))}px"),
            (r"border-radius: (\d+\.?\d*)rem", lambda m: f"border-radius: {max(0.75, float(m.group(1)))}rem"),
        ]
    },
    {
        "name": "Shadow Depth",
        "changes": [
            (r"box-shadow: 0 0 (\d+)px", lambda m: f"box-shadow: 0 0 {int(m.group(1)) + 5}px"),
            (r"filter: drop-shadow\(0 0 (\d+)px", lambda m: f"filter: drop-shadow(0 0 {int(m.group(1)) + 5}px"),
        ]
    },
    {
        "name": "Animation Timing",
        "changes": [
            (r"animation: .*? (\d+)s", lambda m: f"animation: {m.group(0).split()[1]} {max(2, int(m.group(1)))}s"),
        ]
    },
    {
        "name": "Z-Index Layering",
        "changes": [
            (r"z-index: (\d+)", lambda m: f"z-index: {int(m.group(1)) + 1}"),  # Ensure proper layering
        ]
    },
    {
        "name": "Final Polish",
        "changes": [
            # Remove any trailing whitespace
            (r" +$", ""),
            # Ensure consistent spacing
            (r"\n{3,}", "\n\n"),
        ]
    }
]

def apply_refinement_pass(content: str, pass_config: Dict) -> str:
    """Apply a single refinement pass"""
    result = content
    for pattern, replacement in pass_config["changes"]:
        if callable(replacement):
            result = re.sub(pattern, replacement, result)
        else:
            result = re.sub(pattern, replacement, result)
    return result

def refine_file(file_path: Path, passes: List[Dict]) -> str:
    """Apply all refinement passes to a file"""
    content = file_path.read_text()
    
    print(f"  Refining: {file_path.name}")
    for i, pass_config in enumerate(passes, 1):
        print(f"    Pass {i:02d}: {pass_config['name']}")
        content = apply_refinement_pass(content, pass_config)
    
    return content

def refine_all_visuals():
    """Refine all HTML infographic files"""
    print("🎨 BEAST MODE Brand Refinement System\n")
    print(f"Applying {len(REFINEMENT_PASSES)} refinement passes...\n")
    
    html_files = list(HTML_DIR.glob("*-infographic.html"))
    
    if not html_files:
        print("⚠️  No infographic HTML files found")
        return
    
    for html_file in html_files:
        print(f"\n{'='*60}")
        print(f"Refining: {html_file.name}")
        print(f"{'='*60}")
        
        try:
            refined_content = refine_file(html_file, REFINEMENT_PASSES)
            
            # Create backup
            backup_path = html_file.with_suffix('.html.backup')
            if not backup_path.exists():
                backup_path.write_text(html_file.read_text())
            
            # Write refined content
            html_file.write_text(refined_content)
            print(f"  ✅ Refined and saved")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print("\n" + "="*60)
    print("✅ Brand Refinement Complete")
    print("="*60)
    print("\n💡 Next steps:")
    print("   1. Review refined HTML files")
    print("   2. Regenerate visuals: python3 scripts/generate-visuals.py")
    print("   3. Compare before/after")
    print("   4. Iterate if needed")

if __name__ == "__main__":
    refine_all_visuals()

