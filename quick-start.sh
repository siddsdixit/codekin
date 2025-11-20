#!/bin/bash

# Codekin Quick Start Script
# This script sets up and runs Codekin in 60 seconds

set -e

echo "🚀 Codekin Quick Start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. You have: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Step 2: Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚙️  Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) detected"
echo ""

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm install --silent

# Step 4: Build packages
echo ""
echo "🔨 Building packages..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm build

# Step 5: Initialize database
echo ""
echo "🗄️  Initializing database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm tsx -e "import { seedAgents } from './packages/db/src/index.js'; seedAgents()"

# Step 6: Initialize config
echo ""
echo "⚙️  Creating config file..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p ~/.codekin

# Check if API key is set
API_KEY=""
if [ -n "$ANTHROPIC_API_KEY" ]; then
    API_KEY="$ANTHROPIC_API_KEY"
    PROVIDER="anthropic"
    MODEL="claude-sonnet-4-20250514"
elif [ -n "$OPENAI_API_KEY" ]; then
    API_KEY="$OPENAI_API_KEY"
    PROVIDER="openai"
    MODEL="gpt-4-turbo"
fi

# Create config file
cat > ~/.codekin/config.json <<EOF
{
  "llm": {
    "provider": "${PROVIDER:-anthropic}",
    "model": "${MODEL:-claude-sonnet-4-20250514}"
  },
  "project": {
    "workingDirectory": "$(pwd)"
  },
  "execution": {
    "maxConversationTurns": 20,
    "timeoutSeconds": 300,
    "retryAttempts": 3
  },
  "features": {
    "useRealLLM": ${USE_REAL_LLM:-false},
    "enableCodeIndexing": true,
    "enableParallelExecution": true
  }
}
EOF

echo "✅ Config created at ~/.codekin/config.json"
echo ""

# Step 7: Check API key
echo "🔑 API Key Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$API_KEY" ]; then
    echo "⚠️  No API key found"
    echo ""
    echo "To use real LLM (recommended):"
    echo "  export ANTHROPIC_API_KEY=your-key"
    echo "  export USE_REAL_LLM=true"
    echo "  ./quick-start.sh"
    echo ""
    echo "Or edit: ~/.codekin/config.json"
    echo ""
    echo "For now, running in SIMULATED mode (no API calls)..."
    echo ""
else
    echo "✅ API key detected (${PROVIDER})"
    echo ""
fi

# Step 8: Run test
echo "🧪 Running integration test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$API_KEY" ]; then
    CODEKIN_USE_REAL_LLM=false pnpm tsx packages/test-integration.ts
else
    pnpm tsx packages/test-integration.ts
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Codekin is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. View results above"
echo "2. Check database: sqlite3 ~/.codekin/codekin.db"
echo "3. Read docs: cat README.md"
echo "4. Try custom requirement:"
echo ""
echo '   pnpm tsx -e "'
echo '   import { Orchestrator } from \"./packages/orchestrator/src/index.js\";'
echo '   import { loadConfig } from \"./packages/config.js\";'
echo '   const config = loadConfig();'
echo '   const orch = new Orchestrator({'
echo '     providerSettings: {'
echo '       apiProvider: config.llm.provider,'
echo '       apiKey: config.llm.apiKey,'
echo '       apiModelId: config.llm.model'
echo '     },'
echo '     cwd: process.cwd()'
echo '   });'
echo '   await orch.execute(\"Your requirement here\", \"test-\" + Date.now(), process.cwd());'
echo '   "'
echo ""
echo "Happy coding! 🚀"
