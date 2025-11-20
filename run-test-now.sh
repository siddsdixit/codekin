#!/bin/bash
# Simple test script with explicit echo statements

cd "$(dirname "$0")"

echo "=========================================="
echo "🔍 Codekin VSIX Verification Test"
echo "=========================================="
echo ""

# Check VSIX
echo "1. Checking VSIX file..."
if [ -f "bin/codekin-1.0.0.vsix" ]; then
    SIZE=$(ls -lh bin/codekin-1.0.0.vsix | awk '{print $5}')
    echo "   ✅ VSIX found: bin/codekin-1.0.0.vsix"
    echo "   📦 Size: $SIZE"
    
    # Get size in bytes for comparison
    if command -v stat >/dev/null 2>&1; then
        SIZE_BYTES=$(stat -f%z bin/codekin-1.0.0.vsix 2>/dev/null || stat -c%s bin/codekin-1.0.0.vsix 2>/dev/null)
        SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
        echo "   📊 Size: ${SIZE_MB} MB"
        if [ "$SIZE_MB" -gt 35 ]; then
            echo "   ✅ Size indicates webview files are included"
        elif [ "$SIZE_MB" -lt 30 ]; then
            echo "   ⚠️  Size seems small - webview might be missing"
        fi
    fi
else
    echo "   ❌ VSIX not found!"
    echo "   Run: bash rebuild-vsix.sh"
    exit 1
fi

echo ""

# Check source files
echo "2. Checking source build files..."
if [ -f "src/dist/webview/build/assets/index.js" ]; then
    JS_SIZE=$(ls -lh src/dist/webview/build/assets/index.js | awk '{print $5}')
    echo "   ✅ index.js exists ($JS_SIZE)"
else
    echo "   ❌ index.js missing"
    echo "   Run: cd src && pnpm bundle"
fi

if [ -f "src/dist/webview/build/assets/index.css" ]; then
    CSS_SIZE=$(ls -lh src/dist/webview/build/assets/index.css | awk '{print $5}')
    echo "   ✅ index.css exists ($CSS_SIZE)"
else
    echo "   ❌ index.css missing"
fi

echo ""

# Check VSIX contents
echo "3. Checking VSIX contents..."
if command -v unzip >/dev/null 2>&1; then
    if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.js"; then
        echo "   ✅ index.js found in VSIX"
    else
        echo "   ❌ index.js NOT in VSIX"
    fi
    
    if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.css"; then
        echo "   ✅ index.css found in VSIX"
    else
        echo "   ❌ index.css NOT in VSIX"
    fi
    
    WEBVIEW_COUNT=$(unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -c "dist/webview" || echo "0")
    echo "   📁 Webview files in VSIX: $WEBVIEW_COUNT"
    
    if [ "$WEBVIEW_COUNT" -gt 100 ]; then
        echo "   ✅ Good number of webview files"
    else
        echo "   ⚠️  Few webview files - might need rebuild"
    fi
else
    echo "   ⚠️  unzip not available - cannot check VSIX contents"
fi

echo ""
echo "=========================================="
echo "✅ Verification Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Install VSIX in VS Code:"
echo "   - Open VS Code"
echo "   - Press Cmd+Shift+X (Extensions)"
echo "   - Click ... menu → 'Install from VSIX...'"
echo "   - Select: $(pwd)/bin/codekin-1.0.0.vsix"
echo ""
echo "2. Test the webview:"
echo "   - Click Codekin icon in Activity Bar"
echo "   - Check if UI loads (not blank)"
echo ""
echo "3. If blank, debug:"
echo "   - Right-click webview → Inspect"
echo "   - Check Console for errors"
echo "   - Check Network tab for 404s"
echo ""
echo "See TESTING_GUIDE.md for detailed steps"


