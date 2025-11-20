# Testing Guide for Codekin Extension

## Prerequisites
- VS Code installed
- Terminal access
- Codekin project built

## Step 1: Rebuild the VSIX

```bash
cd /Users/sdixit/Documents/codekin

# Option A: Use the automated script
bash fix-and-rebuild.sh

# Option B: Manual rebuild
bash rebuild-vsix.sh
```

**Expected Output:**
- ✅ Webview UI built
- ✅ Extension bundle built  
- ✅ VSIX package created
- VSIX size should be ~40MB (indicating webview files are included)

## Step 2: Verify VSIX Contents

```bash
# Check if webview files are in VSIX
unzip -l bin/codekin-1.0.0.vsix | grep "dist/webview/build/assets/index.js"
unzip -l bin/codekin-1.0.0.vsix | grep "dist/webview/build/assets/index.css"

# Count webview files (should be hundreds)
unzip -l bin/codekin-1.0.0.vsix | grep "dist/webview" | wc -l
```

**Expected:** Both files should be found, and there should be many webview files.

## Step 3: Clean Installation

### 3a. Uninstall Old Extension
1. Open VS Code
2. Press `Cmd+Shift+X` (Extensions)
3. Search for "Codekin"
4. Click the gear icon ⚙️ next to Codekin
5. Click **"Uninstall"**
6. **Important:** Quit VS Code completely (`Cmd+Q`)

### 3b. Install New VSIX
1. Reopen VS Code
2. Press `Cmd+Shift+X` (Extensions)
3. Click the `...` menu (top right)
4. Select **"Install from VSIX..."**
5. Navigate to: `/Users/sdixit/Documents/codekin/bin/codekin-1.0.0.vsix`
6. Click **"Install"**
7. When prompted, click **"Reload"** or press `Cmd+Shift+P` → "Developer: Reload Window"

## Step 4: Visual Verification

### 4a. Check Activity Bar
1. Look at the left sidebar (Activity Bar)
2. You should see the **Codekin icon** (new digital twin icon)
3. Click on it

### 4b. Check Webview Content
**Expected Result:** You should see:
- ✅ Codekin sidebar panel opens
- ✅ UI elements are visible (not blank)
- ✅ Chat interface or main content area is displayed
- ✅ No blank white screen

**If Blank:**
- Continue to Step 5 (Debugging)

## Step 5: Debugging (If Still Blank)

### 5a. Open Webview Developer Tools
1. Right-click in the blank webview area
2. Select **"Inspect"** or **"Inspect Element"**
3. Developer Tools window opens

### 5b. Check Console Tab
Look for errors:

**Good Signs:**
- No errors or warnings
- Messages like "Codekin initialized" or similar
- React/application logs

**Bad Signs:**
- ❌ `404` errors for `index.js` or `index.css`
- ❌ `Failed to load resource`
- ❌ `Content Security Policy` violations
- ❌ `Uncaught ReferenceError` or `Uncaught TypeError`

### 5c. Check Network Tab
1. Click **"Network"** tab in Developer Tools
2. Refresh the webview (reload VS Code window)
3. Look for:
   - ✅ `index.js` - Status should be `200 OK`
   - ✅ `index.css` - Status should be `200 OK`
   - ✅ Other asset files loading successfully

**If you see 404s:**
- Files are not in VSIX → Rebuild VSIX
- Path is wrong → Check extension paths

### 5d. Check Extension Output
1. In VS Code: `View` → `Output`
2. Select **"Codekin"** from the dropdown
3. Look for:
   - ✅ "Codekin extension activated"
   - ✅ Initialization messages
   - ❌ Error messages

### 5e. Check VS Code Developer Console
1. `Help` → `Toggle Developer Tools`
2. Click **"Console"** tab
3. Look for extension host errors
4. Filter by typing "Codekin" or "webview"

## Step 6: Verify File Paths

If files are loading but webview is still blank, check the actual paths:

### In Webview Console (Step 5b), run:
```javascript
// Check if scripts are loaded
console.log('Scripts:', document.querySelectorAll('script[src]'));

// Check if styles are loaded  
console.log('Styles:', document.querySelectorAll('link[rel="stylesheet"]'));

// Check root element
console.log('Root:', document.getElementById('root'));

// Check for React
console.log('React:', window.React);
```

### Check Extension Installation Path
```bash
# Find where VS Code installed the extension
code --list-extensions --show-versions | grep codekin

# On macOS, extensions are typically in:
# ~/.vscode/extensions/codekin.codekin-1.0.0/

# Verify files exist
ls -la ~/.vscode/extensions/codekin.codekin-1.0.0/dist/webview/build/assets/
```

**Expected:** `index.js` and `index.css` should exist.

## Step 7: Functional Testing

Once webview loads, test basic functionality:

1. **Send a message** - Type something in the chat input
2. **Check response** - Verify AI responds (if configured)
3. **Test commands** - Try extension commands from Command Palette (`Cmd+Shift+P`)
4. **Check settings** - Open extension settings

## Step 8: Quick Test Script

Run this to verify everything is set up:

```bash
cd /Users/sdixit/Documents/codekin

echo "🔍 Quick Verification Test"
echo ""

# Check VSIX exists
if [ -f "bin/codekin-1.0.0.vsix" ]; then
    echo "✅ VSIX exists"
    VSIX_SIZE=$(ls -lh bin/codekin-1.0.0.vsix | awk '{print $5}')
    echo "   Size: $VSIX_SIZE"
else
    echo "❌ VSIX not found - run: bash rebuild-vsix.sh"
    exit 1
fi

# Check source files
if [ -f "src/dist/webview/build/assets/index.js" ]; then
    echo "✅ Source files exist"
else
    echo "❌ Source files missing - run: cd src && pnpm bundle"
fi

# Check VSIX contents
echo ""
echo "Checking VSIX contents..."
if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.js"; then
    echo "✅ index.js in VSIX"
else
    echo "❌ index.js NOT in VSIX"
fi

if unzip -l bin/codekin-1.0.0.vsix 2>/dev/null | grep -q "dist/webview/build/assets/index.css"; then
    echo "✅ index.css in VSIX"
else
    echo "❌ index.css NOT in VSIX"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next: Install VSIX in VS Code and check webview"
```

## Common Issues & Solutions

### Issue: Blank white screen
**Solution:**
1. Check Console for 404 errors
2. Verify VSIX contains webview files
3. Uninstall and reinstall extension
4. Reload VS Code window

### Issue: 404 errors for index.js/css
**Solution:**
1. Rebuild VSIX: `bash rebuild-vsix.sh`
2. Verify files in VSIX: `unzip -l bin/codekin-1.0.0.vsix | grep index`
3. Check `.vscodeignore` includes `!dist`

### Issue: CSP (Content Security Policy) violations
**Solution:**
1. Check `ClineProvider.ts` CSP configuration
2. Verify all resource URIs use `getUri()` helper
3. Check nonce is properly set

### Issue: Extension loads but webview doesn't initialize
**Solution:**
1. Check Extension Output for errors
2. Verify webview message handler is registered
3. Check if state hydration is working

## Success Criteria

✅ Webview panel opens without errors  
✅ UI elements are visible and rendered  
✅ No console errors in webview inspector  
✅ Network requests for assets return 200 OK  
✅ Extension commands work  
✅ Basic functionality (chat, etc.) works  

## Next Steps After Successful Test

1. Test in different VS Code versions
2. Test on different operating systems (if applicable)
3. Test with different workspace configurations
4. Performance testing with large codebases
