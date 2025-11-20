# Troubleshooting Blank Screen Issue

## Quick Fixes

### 1. Rebuild the Extension
```bash
cd /Users/sdixit/Documents/codekin
pnpm run build
cd src
pnpm run bundle
```

### 2. Rebuild Webview UI
```bash
cd /Users/sdixit/Documents/codekin/webview-ui
pnpm run build
```

### 3. Reload VS Code Window
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Developer: Reload Window" and press Enter

### 4. Check Extension Output
- Open VS Code Output panel (`View > Output`)
- Select "Codekin" from the dropdown
- Look for any error messages

### 5. Check Developer Console
- Right-click in the blank webview area
- Select "Inspect" or "Inspect Element"
- Check the Console tab for JavaScript errors

## Common Causes

### Issue 1: Webview UI Not Built
**Symptoms:** Blank white screen, no errors in console

**Solution:**
```bash
cd /Users/sdixit/Documents/codekin/webview-ui
pnpm install
pnpm run build
```

### Issue 2: Extension Not Properly Bundled
**Symptoms:** Extension activates but webview doesn't load

**Solution:**
```bash
cd /Users/sdixit/Documents/codekin/src
pnpm run bundle
```

### Issue 3: State Hydration Failed
**Symptoms:** Webview loads but stays blank (waiting for state)

**Check:**
1. Open Developer Tools (right-click webview > Inspect)
2. Check Console for errors
3. Look for "webviewDidLaunch" message in Network tab

**Solution:** Check if `postStateToWebview()` is being called after `webviewDidLaunch`

### Issue 4: Content Security Policy (CSP) Issues
**Symptoms:** Scripts blocked, errors in console about CSP

**Check:** Look for CSP violations in console

**Solution:** Ensure all assets are properly loaded from allowed sources

### Issue 5: Missing Assets
**Symptoms:** 404 errors for CSS/JS files

**Check:**
```bash
# Verify build output exists
ls -la src/webview-ui/build/assets/index.js
ls -la src/webview-ui/build/assets/index.css
```

**Solution:** Rebuild webview UI

## Debugging Steps

### Step 1: Verify Build Output
```bash
# Check if webview is built
ls -la src/webview-ui/build/assets/

# Should see:
# - index.js (large file, ~4MB)
# - index.css (medium file, ~130KB)
# - Various chunk files
```

### Step 2: Check Extension Logs
1. Open Output panel (`View > Output`)
2. Select "Codekin" channel
3. Look for:
   - "Codekin extension activated"
   - Any error messages
   - Webview initialization messages

### Step 3: Check Webview Console
1. Right-click in blank webview area
2. Select "Inspect"
3. Check Console tab for:
   - JavaScript errors
   - Failed network requests
   - CSP violations

### Step 4: Verify Message Passing
In the webview console, check if messages are being received:
```javascript
// In webview console
window.addEventListener('message', (e) => {
  console.log('Received message:', e.data);
});
```

### Step 5: Check Extension State
In VS Code Developer Tools (Help > Toggle Developer Tools), check:
- Extension host logs
- Any errors in the extension

## Manual Fix: Force State Post

If state hydration is stuck, you can manually trigger it:

1. Open VS Code Developer Tools (`Help > Toggle Developer Tools`)
2. Go to Console tab
3. Run:
```javascript
// This should trigger state refresh
vscode.postMessage({ type: 'webviewDidLaunch' });
```

## Complete Rebuild

If nothing works, do a complete rebuild:

```bash
cd /Users/sdixit/Documents/codekin

# Clean everything
pnpm run clean
rm -rf node_modules
rm -rf webview-ui/node_modules
rm -rf src/node_modules

# Reinstall
pnpm install

# Build everything
pnpm run build

# Build extension bundle
cd src
pnpm run bundle
```

## Still Not Working?

1. **Check VS Code Version**: Ensure you're using VS Code 1.84.0 or later
2. **Check Node Version**: Should be Node.js 20.19.2 (check with `node --version`)
3. **Check for Conflicting Extensions**: Disable other extensions temporarily
4. **Check File Permissions**: Ensure you have read/write access to the project directory

## Getting Help

If the issue persists:
1. Collect logs from Output panel
2. Collect console errors from webview
3. Check GitHub issues: https://github.com/codekin/codekin/issues
4. Create a new issue with:
   - VS Code version
   - Node.js version
   - Error logs
   - Steps to reproduce

