#!/bin/bash
set -e

LOG_FILE="/tmp/codekin-rebuild.log"
echo "Starting rebuild at $(date)" > "$LOG_FILE"

echo "🔨 Rebuilding Codekin VSIX package..."
echo ""

# Step 1: Build webview UI
echo "Step 1/3: Building webview UI..." | tee -a "$LOG_FILE"
cd webview-ui
pnpm run build 2>&1 | tee -a "$LOG_FILE"
echo "✅ Webview UI built" | tee -a "$LOG_FILE"
echo ""

# Step 2: Build extension bundle
echo "Step 2/3: Building extension bundle..." | tee -a "$LOG_FILE"
cd ../src
pnpm run bundle 2>&1 | tee -a "$LOG_FILE"
echo "✅ Extension bundle built" | tee -a "$LOG_FILE"
echo ""

# Step 3: Create VSIX package
echo "Step 3/3: Creating VSIX package..." | tee -a "$LOG_FILE"
pnpm run vsix 2>&1 | tee -a "$LOG_FILE"
echo "✅ VSIX package created" | tee -a "$LOG_FILE"
echo ""

cd ..
echo "Checking for VSIX files..." | tee -a "$LOG_FILE"
ls -lh bin/*.vsix 2>&1 | tee -a "$LOG_FILE" || echo "No VSIX files found" | tee -a "$LOG_FILE"

echo ""
echo "Build log saved to: $LOG_FILE"
cat "$LOG_FILE"

