#!/bin/bash
set -e

echo "🔨 Rebuilding Codekin VSIX package..."
echo ""

echo "Step 1/3: Building webview UI..."
cd "$(dirname "$0")/webview-ui"
pnpm run build
echo "✅ Webview UI built"
echo ""

echo "Step 2/3: Building extension bundle..."
cd ../src
pnpm run bundle
echo "✅ Extension bundle built"
echo ""

echo "Step 3/3: Creating VSIX package..."
pnpm run vsix
echo "✅ VSIX package created"
echo ""

cd ..
if [ -f "bin/codekin-1.0.1.vsix" ]; then
    echo "✅✅✅ Success! VSIX package ready at:"
    echo "   $(pwd)/bin/codekin-1.0.1.vsix"
    ls -lh bin/codekin-*.vsix
elif [ -f "bin/codekin-1.0.0.vsix" ]; then
    echo "✅✅✅ Success! VSIX package ready at:"
    echo "   $(pwd)/bin/codekin-1.0.0.vsix"
    ls -lh bin/codekin-*.vsix
else
    echo "❌ Error: VSIX package not found"
    echo "Checking bin directory:"
    ls -la bin/ 2>&1 || echo "bin directory doesn't exist"
    exit 1
fi







