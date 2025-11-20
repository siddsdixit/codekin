#!/bin/bash

echo "🔍 Quick Verification Test"
echo ""

cd "$(dirname "$0")"

# Check VSIX exists
if [ -f "bin/codekin-1.0.0.vsix" ]; then
    echo "✅ VSIX exists"
    VSIX_SIZE=$(ls -lh bin/codekin-1.0.0.vsix | awk '{print $5}')
    echo "   Size: $VSIX_SIZE"
    
    # Check if size suggests webview is included (should be ~40MB)
    SIZE_BYTES=$(stat -f%z bin/codekin-1.0.0.vsix 2>/dev/null || stat -c%s bin/codekin-1.0.0.vsix 2>/dev/null)
    SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
    if [ "$SIZE_MB" -gt 30 ]; then
        echo "   ✅ Size looks good (webview likely included)"
    else
        echo "   ⚠️  Size seems small - webview might be missing"
    fi
else
    echo "❌ VSIX not found - run: bash rebuild-vsix.sh"
    exit 1
fi

echo ""

# Check source files
if [ -f "src/dist/webview/build/assets/index.js" ]; then
    JS_SIZE=$(ls -lh src/dist/webview/build/assets/index.js | awk '{print $5}')
    echo "✅ Source: index.js exists ($JS_SIZE)"
else
    echo "❌ Source: index.js missing - run: cd src && pnpm bundle"
fi

if [ -f "src/dist/webview/build/assets/index.css" ]; then
    CSS_SIZE=$(ls -lh src/dist/webview/build/assets/index.css | awk '{print $5}')
    echo "✅ Source: index.css exists ($CSS_SIZE)"
else
    echo "❌ Source: index.css missing"
fi

echo ""

# Check VSIX contents
echo "Checking VSIX contents..."
if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.js"; then
    echo "✅ index.js found in VSIX"
else
    echo "❌ index.js NOT in VSIX - rebuild needed"
fi

if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.css"; then
    echo "✅ index.css found in VSIX"
else
    echo "❌ index.css NOT in VSIX - rebuild needed"
fi

WEBVIEW_COUNT=$(unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep "dist/webview" | wc -l | tr -d ' ')
echo "   Webview files in VSIX: $WEBVIEW_COUNT"

if [ "$WEBVIEW_COUNT" -gt 100 ]; then
    echo "   ✅ Good number of webview files"
else
    echo "   ⚠️  Few webview files - might be incomplete"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Install VSIX in VS Code:"
echo "   Extensions → ... → Install from VSIX → bin/codekin-1.0.0.vsix"
echo ""
echo "2. Open Codekin sidebar and check if webview loads"
echo ""
echo "3. If blank, right-click → Inspect → Check Console for errors"
echo ""
echo "4. See TESTING_GUIDE.md for detailed testing steps"


