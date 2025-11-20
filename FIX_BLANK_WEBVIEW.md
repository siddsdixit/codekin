# Fix for Blank Webview Issue

## Problem
The webview appears blank after installing the VSIX package.

## Root Cause
The webview UI files are now located in `dist/webview/build/assets/` but the extension may be:
1. Using cached old webview content
2. Not finding the files due to path resolution
3. Missing files in the VSIX package

## Solution Steps

### Step 1: Complete Rebuild
```bash
cd /Users/sdixit/Documents/codekin

# Clean everything
rm -rf src/dist
rm -rf webview-ui/build

# Rebuild webview UI
cd webview-ui
pnpm run build

# Rebuild extension bundle
cd ../src
pnpm run bundle

# Verify files exist
ls -la dist/webview/build/assets/index.js
ls -la dist/webview/build/assets/index.css

# Create VSIX
cd ..
bash rebuild-vsix.sh
```

### Step 2: Uninstall Old Extension
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Codekin"
4. Click the gear icon → Uninstall
5. **Restart VS Code completely** (Cmd+Q, then reopen)

### Step 3: Install New VSIX
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Click the "..." menu (top right)
4. Select "Install from VSIX..."
5. Navigate to `/Users/sdixit/Documents/codekin/bin/codekin-1.0.0.vsix`
6. Click Install
7. **Reload VS Code** when prompted (or Cmd+Shift+P → "Developer: Reload Window")

### Step 4: Verify Installation
1. Open the Codekin sidebar
2. Right-click in the webview area → "Inspect"
3. Check the Console tab for errors
4. Check the Network tab to see if `index.js` and `index.css` are loading

### Step 5: If Still Blank - Check Console Errors
In the webview inspector console, look for:
- 404 errors (files not found)
- CSP violations (Content Security Policy)
- JavaScript errors

Common issues:
- **404 on index.js**: Files not in VSIX → Rebuild VSIX
- **CSP violation**: Path resolution issue → Check extensionUri
- **JavaScript error**: Check console for specific error

## Verification Commands

```bash
# Check VSIX contains webview files
cd /Users/sdixit/Documents/codekin
unzip -l bin/codekin-1.0.0.vsix | grep "dist/webview/build/assets"

# Should see:
# dist/webview/build/assets/index.js
# dist/webview/build/assets/index.css
# etc.
```

## Expected File Structure in VSIX
```
codekin-1.0.0.vsix
├── package.json
├── dist/
│   ├── extension.js
│   └── webview/
│       ├── build/
│       │   └── assets/
│       │       ├── index.js
│       │       ├── index.css
│       │       └── ...
│       └── audio/
│           └── ...
└── assets/
    └── ...
```

## If Problem Persists

1. **Check VS Code Developer Tools**:
   - Help → Toggle Developer Tools
   - Console tab → Look for extension errors

2. **Check Extension Output**:
   - View → Output
   - Select "Codekin" from dropdown
   - Look for initialization errors

3. **Verify Extension Path**:
   The extensionUri should point to the extension root (where package.json is).
   In the installed extension, paths like `dist/webview/build/assets/index.js` 
   should resolve correctly.

4. **Clear VS Code Cache** (last resort):
   ```bash
   # Close VS Code first!
   rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage
   rm -rf ~/Library/Application\ Support/Code/CachedExtensions
   ```

