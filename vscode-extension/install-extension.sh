#!/bin/bash
echo "🚀 Installing BEAST MODE Extension"
echo "=================================="
echo ""

VSIX_FILE="beast-mode-0.1.0.vsix"

if [ ! -f "$VSIX_FILE" ]; then
  echo "❌ VSIX file not found: $VSIX_FILE"
  echo "   Run: vsce package"
  exit 1
fi

echo "📦 VSIX file found: $VSIX_FILE"
echo ""

# Try installation
echo "Installing extension..."
code --install-extension "$VSIX_FILE" --force

echo ""
echo "✅ Installation complete!"
echo ""
echo "🔄 NEXT STEPS:"
echo "  1. Quit VS Code completely (Cmd+Q)"
echo "  2. Reopen VS Code"
echo "  3. Check Extensions panel (Cmd+Shift+X)"
echo "  4. Search for 'beast mode'"
echo ""
