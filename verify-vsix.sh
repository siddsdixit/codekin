#!/bin/bash

echo "🔍 Verifying VSIX Package Contents..."
echo ""

VSIX_FILE="bin/codekin-1.0.0.vsix"

if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ VSIX file not found: $VSIX_FILE"
    exit 1
fi

echo "✅ VSIX file exists: $VSIX_FILE"
VSIX_SIZE=$(ls -lh "$VSIX_FILE" | awk '{print $5}')
echo "   Size: $VSIX_SIZE"
echo ""

echo "Checking for critical webview files in VSIX:"
echo ""

# Check for index.js
if unzip -l "$VSIX_FILE" 2>/dev/null | grep -q "dist/webview/build/assets/index.js"; then
    echo "✅ dist/webview/build/assets/index.js found"
else
    echo "❌ dist/webview/build/assets/index.js NOT FOUND"
fi

# Check for index.css
if unzip -l "$VSIX_FILE" 2>/dev/null | grep -q "dist/webview/build/assets/index.css"; then
    echo "✅ dist/webview/build/assets/index.css found"
else
    echo "❌ dist/webview/build/assets/index.css NOT FOUND"
fi

# Check for extension.js
if unzip -l "$VSIX_FILE" 2>/dev/null | grep -q "dist/extension.js"; then
    echo "✅ dist/extension.js found"
else
    echo "❌ dist/extension.js NOT FOUND"
fi

# Check for package.json
if unzip -l "$VSIX_FILE" 2>/dev/null | grep -q "package.json"; then
    echo "✅ package.json found"
else
    echo "❌ package.json NOT FOUND"
fi

echo ""
echo "Counting webview files in VSIX:"
WEBVIEW_COUNT=$(unzip -l "$VSIX_FILE" 2>/dev/null | grep "dist/webview" | wc -l | tr -d ' ')
echo "   Found $WEBVIEW_COUNT files in dist/webview/"

echo ""
echo "Sample webview files:"
unzip -l "$VSIX_FILE" 2>/dev/null | grep "dist/webview/build/assets" | head -5

echo ""
echo "Checking source files:"
if [ -f "src/dist/webview/build/assets/index.js" ]; then
    echo "✅ Source: src/dist/webview/build/assets/index.js exists"
    SOURCE_SIZE=$(ls -lh "src/dist/webview/build/assets/index.js" | awk '{print $5}')
    echo "   Size: $SOURCE_SIZE"
else
    echo "❌ Source: src/dist/webview/build/assets/index.js NOT FOUND"
    echo "   Run: cd src && pnpm bundle"
fi

if [ -f "src/dist/webview/build/assets/index.css" ]; then
    echo "✅ Source: src/dist/webview/build/assets/index.css exists"
else
    echo "❌ Source: src/dist/webview/build/assets/index.css NOT FOUND"
fi

