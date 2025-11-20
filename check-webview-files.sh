#!/bin/bash
set -e

echo "🔍 Checking webview file structure..."
echo ""

echo "1. Checking webview-ui build:"
if [ -f "webview-ui/build/assets/index.js" ]; then
    echo "   ✅ webview-ui/build/assets/index.js exists"
    ls -lh webview-ui/build/assets/index.js | awk '{print "   Size: " $5}'
else
    echo "   ❌ webview-ui/build/assets/index.js NOT FOUND"
fi

echo ""
echo "2. Checking src/dist/webview build:"
if [ -f "src/dist/webview/build/assets/index.js" ]; then
    echo "   ✅ src/dist/webview/build/assets/index.js exists"
    ls -lh src/dist/webview/build/assets/index.js | awk '{print "   Size: " $5}'
else
    echo "   ❌ src/dist/webview/build/assets/index.js NOT FOUND"
fi

echo ""
echo "3. Checking VSIX package:"
if [ -f "bin/codekin-1.0.0.vsix" ]; then
    echo "   ✅ VSIX exists"
    ls -lh bin/codekin-1.0.0.vsix | awk '{print "   Size: " $5}'
    echo ""
    echo "   Checking VSIX contents for webview files:"
    unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -E "dist/webview/build/assets/index\.(js|css)" | head -5 || echo "   ⚠️  Webview files not found in VSIX"
else
    echo "   ❌ VSIX not found"
fi

echo ""
echo "4. Checking .vscodeignore:"
if grep -q "!dist" src/.vscodeignore; then
    echo "   ✅ .vscodeignore includes !dist"
else
    echo "   ❌ .vscodeignore does NOT include !dist"
fi

