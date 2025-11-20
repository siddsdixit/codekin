#!/bin/bash
set -e

echo "🔧 Fixing and Rebuilding Codekin Extension..."
echo ""

# Step 1: Build webview UI
echo "Step 1/4: Building webview UI..."
cd "$(dirname "$0")/webview-ui"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    pnpm install
fi
pnpm run build
if [ ! -f "build/assets/index.js" ]; then
    echo "❌ ERROR: webview-ui/build/assets/index.js not found after build"
    exit 1
fi
echo "✅ Webview UI built successfully"
echo ""

# Step 2: Build extension bundle
echo "Step 2/4: Building extension bundle..."
cd ../src
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    pnpm install
fi
pnpm run bundle
if [ ! -f "dist/webview/build/assets/index.js" ]; then
    echo "❌ ERROR: src/dist/webview/build/assets/index.js not found after bundle"
    echo "   Checking if files were copied..."
    ls -la dist/webview/build/assets/ 2>&1 | head -5
    exit 1
fi
echo "✅ Extension bundle built successfully"
echo ""

# Step 3: Verify file structure
echo "Step 3/4: Verifying file structure..."
if [ -f "dist/webview/build/assets/index.js" ] && [ -f "dist/webview/build/assets/index.css" ]; then
    JS_SIZE=$(ls -lh dist/webview/build/assets/index.js | awk '{print $5}')
    CSS_SIZE=$(ls -lh dist/webview/build/assets/index.css | awk '{print $5}')
    echo "✅ index.js found ($JS_SIZE)"
    echo "✅ index.css found ($CSS_SIZE)"
else
    echo "❌ ERROR: Required webview files missing"
    exit 1
fi
echo ""

# Step 4: Create VSIX
echo "Step 4/4: Creating VSIX package..."
pnpm run vsix
cd ..

if [ -f "bin/codekin-1.0.0.vsix" ]; then
    VSIX_SIZE=$(ls -lh bin/codekin-1.0.0.vsix | awk '{print $5}')
    echo "✅ VSIX package created successfully"
    echo "   Location: $(pwd)/bin/codekin-1.0.0.vsix"
    echo "   Size: $VSIX_SIZE"
    echo ""
    
    # Verify VSIX contents
    echo "Verifying VSIX contents..."
    if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.js"; then
        echo "✅ VSIX contains dist/webview/build/assets/index.js"
    else
        echo "⚠️  WARNING: VSIX may not contain webview files"
    fi
    
    if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.css"; then
        echo "✅ VSIX contains dist/webview/build/assets/index.css"
    else
        echo "⚠️  WARNING: VSIX may not contain webview CSS"
    fi
    
    WEBVIEW_FILES=$(unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep "dist/webview" | wc -l | tr -d ' ')
    echo "   Total webview files in VSIX: $WEBVIEW_FILES"
    echo ""
    echo "✅✅✅ Build complete! Ready to install."
    echo ""
    echo "Next steps:"
    echo "1. Uninstall old Codekin extension from VS Code"
    echo "2. Quit VS Code completely (Cmd+Q)"
    echo "3. Reopen VS Code"
    echo "4. Install from VSIX: Extensions → ... → Install from VSIX"
    echo "5. Select: $(pwd)/bin/codekin-1.0.0.vsix"
    echo "6. Reload VS Code when prompted"
else
    echo "❌ ERROR: VSIX package not created"
    exit 1
fi

