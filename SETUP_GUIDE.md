# 🚀 Codekin Setup Guide

**Complete setup guide for running Codekin with real LLMs**

---

## 📋 Prerequisites

1. **Node.js 20+** installed
2. **pnpm** package manager
3. **API Key** from one of:
   - Anthropic (Claude)
   - OpenAI (GPT)
   - Or any OpenRouter-compatible provider

---

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /Users/sdixit/documents/codekin
pnpm install
```

### 2. Build Packages

```bash
pnpm build
```

This builds all 4 Codekin packages:
- `@codekin/db` - Database layer
- `@codekin/agents` - Multi-agent system
- `@codekin/rag` - Code indexing
- `@codekin/orchestrator` - Task orchestration

### 3. Set API Key

**Option A: Environment Variable (Recommended)**

```bash
# For Anthropic Claude
export ANTHROPIC_API_KEY=your-api-key-here

# For OpenAI GPT
export OPENAI_API_KEY=your-api-key-here
```

**Option B: Config File**

```bash
# Initialize config file
pnpm tsx packages/config.ts init

# Edit the file
nano ~/.codekin/config.json
```

Add your API key:
```json
{
  "llm": {
    "provider": "anthropic",
    "apiKey": "your-api-key-here",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### 4. Initialize Database

```bash
pnpm tsx -e "import { seedAgents } from './packages/db/src'; seedAgents()"
```

This creates `~/.codekin/codekin.db` with 6 default agents.

### 5. Run Test

```bash
# Simulated LLM (no API key needed)
CODEKIN_USE_REAL_LLM=false pnpm tsx packages/test-integration.ts

# Real LLM (requires API key)
pnpm tsx packages/test-integration.ts
```

---

## 🔧 Configuration

### Environment Variables

```bash
# LLM Provider
export CODEKIN_LLM_PROVIDER=anthropic  # anthropic, openai, ollama, openrouter
export CODEKIN_MODEL=claude-sonnet-4-20250514

# API Keys
export ANTHROPIC_API_KEY=your-key
export OPENAI_API_KEY=your-key

# Execution Settings
export CODEKIN_MAX_TURNS=20           # Max conversation turns
export CODEKIN_TIMEOUT=300            # Timeout in seconds
export CODEKIN_RETRY=3                # Retry attempts

# Feature Flags
export CODEKIN_USE_REAL_LLM=true      # Use real API or simulated
export CODEKIN_CODE_INDEXING=true     # Enable semantic search
export CODEKIN_PARALLEL=true          # Enable parallel execution

# Working Directory
export CODEKIN_CWD=/path/to/project
```

### Config File Location

```
~/.codekin/config.json
```

### Check Current Config

```bash
pnpm tsx -e "import { loadConfig, printConfig } from './packages/config'; printConfig(loadConfig())"
```

---

## 🧪 Testing

### 1. Simulated Mode (No API Key Needed)

Perfect for testing the architecture without spending money:

```bash
CODEKIN_USE_REAL_LLM=false pnpm tsx packages/test-integration.ts
```

### 2. Production Mode (Real LLM)

Requires API key:

```bash
export ANTHROPIC_API_KEY=your-key
pnpm tsx packages/test-integration.ts
```

### 3. Custom Requirement

```bash
pnpm tsx -e "
import { Orchestrator } from './packages/orchestrator/src';
import { loadConfig } from './packages/config';

const config = loadConfig();
const orch = new Orchestrator({
  providerSettings: {
    apiProvider: config.llm.provider,
    apiKey: config.llm.apiKey,
    apiModelId: config.llm.model
  },
  cwd: process.cwd()
});

await orch.execute(
  'Build a REST API for managing tasks with CRUD operations',
  'test-' + Date.now(),
  process.cwd()
);
"
```

---

## 📊 Usage Examples

### Example 1: Simple Task

```typescript
import { Orchestrator } from '@codekin/orchestrator'
import { loadConfig } from './packages/config'

const config = loadConfig()

const orchestrator = new Orchestrator({
	providerSettings: {
		apiProvider: config.llm.provider,
		apiKey: config.llm.apiKey,
		apiModelId: config.llm.model,
	},
	cwd: '/path/to/project',
})

const result = await orchestrator.execute(
	'Add user authentication to the app',
	'project-123',
	'/path/to/project'
)

console.log(`✅ Completed ${result.tasksCompleted} tasks`)
```

### Example 2: Complex Multi-Phase Project

```typescript
const requirement = `
Build a complete e-commerce checkout flow:
1. Shopping cart component with add/remove items
2. Checkout form with validation
3. Payment integration (Stripe)
4. Order confirmation page
5. Admin panel to view orders
6. Email notifications
7. Comprehensive tests
8. CI/CD pipeline
`

const result = await orchestrator.execute(requirement, 'ecom-123', '/path/to/project')

// Codekin will:
// - Break into ~15 tasks
// - Assign to appropriate agents (PM, Architect, Devs, QA, DevOps)
// - Execute in 6-8 phases with parallelism
// - Complete in ~2-3 hours vs 6-8 hours sequential
```

### Example 3: Agent-Specific Task

```typescript
import { loadAgentFromDatabase } from '@codekin/agents'

const architect = loadAgentFromDatabase('architect')

architect.setContext({
	projectId: 'proj-123',
	projectPath: '/path/to/project',
	cwd: '/path/to/project',
})

architect.initializeExecutor({
	providerSettings: { /* ... */ },
	cwd: '/path/to/project',
})

const result = await architect.handle({
	id: 'task-1',
	title: 'Design payment system architecture',
	description: 'Design a secure payment processing system with Stripe',
	type: 'design',
	dependencies: [],
})

console.log(result.output) // Architecture document
```

---

## 🎯 Supported LLM Providers

### 1. Anthropic Claude (Recommended)

```bash
export CODEKIN_LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-...
export CODEKIN_MODEL=claude-sonnet-4-20250514
```

**Models:**
- `claude-opus-4` - Most capable, expensive
- `claude-sonnet-4-20250514` - Best balance (recommended)
- `claude-haiku-3-5-20241022` - Fast, cheap

### 2. OpenAI GPT

```bash
export CODEKIN_LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export CODEKIN_MODEL=gpt-4-turbo
```

**Models:**
- `gpt-4-turbo` - Most capable
- `gpt-4` - Reliable
- `gpt-3.5-turbo` - Fast, cheap

### 3. Local Ollama

```bash
export CODEKIN_LLM_PROVIDER=ollama
export CODEKIN_MODEL=codellama:34b
export CODEKIN_BASE_URL=http://localhost:11434
```

### 4. OpenRouter (Access 100+ models)

```bash
export CODEKIN_LLM_PROVIDER=openrouter
export OPENAI_API_KEY=sk-or-...  # OpenRouter key
export CODEKIN_MODEL=anthropic/claude-opus-4
```

---

## 🔍 Monitoring & Debugging

### View Database

```bash
# Install sqlite3 if not already
brew install sqlite3  # macOS
# or: apt-get install sqlite3  # Linux

# Open database
sqlite3 ~/.codekin/codekin.db

# View agents
SELECT type, name FROM agents;

# View recent tasks
SELECT title, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 10;

# View conversation for a task
SELECT role, substr(content, 1, 100) FROM messages WHERE task_id = 'task-id';
```

### Enable Debug Logging

```bash
export DEBUG=codekin:*
pnpm tsx packages/test-integration.ts
```

### Check Agent Restrictions

```bash
pnpm tsx -e "
import { loadAgentFromDatabase } from './packages/agents/src';

const architect = loadAgentFromDatabase('architect');
console.log('Tools:', architect.getAllowedTools());
console.log('Restrictions:', architect.getFileRestrictions());

// Test file access
console.log('Can access src/api.ts?', architect.canAccessFile('src/api.ts'));
console.log('Can access docs/design.md?', architect.canAccessFile('docs/design.md'));
"
```

---

## 🚨 Troubleshooting

### Error: "API key not set"

```bash
# Check if key is set
echo $ANTHROPIC_API_KEY

# Set it
export ANTHROPIC_API_KEY=your-key

# Or use config file
nano ~/.codekin/config.json
```

### Error: "Roo Code infrastructure not available"

This means you're not running from within the Roo Code project. Codekin needs Roo Code's tools and API handlers.

**Solution:** Ensure you're running from `/Users/sdixit/documents/codekin` (the Roo Code fork).

### Error: "Database not initialized"

```bash
# Initialize database
pnpm tsx -e "import { seedAgents } from './packages/db/src'; seedAgents()"
```

### Slow Execution

1. **Use faster model:**
   ```bash
   export CODEKIN_MODEL=claude-sonnet-4-20250514  # Instead of opus
   ```

2. **Reduce max turns:**
   ```bash
   export CODEKIN_MAX_TURNS=10
   ```

3. **Disable parallel execution for debugging:**
   ```bash
   export CODEKIN_PARALLEL=false
   ```

### High API Costs

1. **Use simulated mode for testing:**
   ```bash
   export CODEKIN_USE_REAL_LLM=false
   ```

2. **Use cheaper models:**
   - Anthropic: `claude-haiku-3-5-20241022`
   - OpenAI: `gpt-3.5-turbo`

3. **Reduce conversation turns:**
   ```bash
   export CODEKIN_MAX_TURNS=10
   ```

---

## 📈 Performance Tips

### 1. Enable Parallel Execution

```bash
export CODEKIN_PARALLEL=true
```

This allows independent tasks to run simultaneously (2-3x speedup).

### 2. Use Code Indexing

```bash
export CODEKIN_CODE_INDEXING=true
```

Provides relevant code context to agents (better quality).

### 3. Optimize Models

- **PM/QA/DevOps:** Use cheaper models (Haiku, GPT-3.5)
- **Architect/Devs:** Use capable models (Sonnet, GPT-4)

Edit `~/.codekin/codekin.db`:
```sql
UPDATE agents SET model = 'claude-haiku-3-5-20241022' WHERE type IN ('pm', 'qa', 'devops');
UPDATE agents SET model = 'claude-sonnet-4-20250514' WHERE type IN ('architect', 'dev-frontend', 'dev-backend');
```

---

## 🎓 Next Steps

1. ✅ **Test simulated mode** - Verify architecture works
2. ✅ **Add API key** - Test with real LLM
3. ✅ **Run on real project** - Try on actual codebase
4. ✅ **Customize agents** - Edit prompts in database
5. ✅ **Build Web UI** - Visual dashboard (future)

---

## 📚 Additional Resources

- **Architecture:** See `CODEKIN_COMPLETE.md`
- **LLM Integration:** See `LLM_INTEGRATION_COMPLETE.md`
- **API Docs:** Coming soon
- **Web UI:** Coming soon

---

**Happy Coding with Codekin! 🚀**
