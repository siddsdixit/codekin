# Codekin - Final Implementation Plan (With RAG)
**Version:** 3.1 - Simplified Architecture + Semantic Search
**Date:** 2025-11-18
**Strategy:** Best of Roo/Kilo/Cline + Web UI + RAG (Qdrant)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [What We're Building](#what-were-building)
3. [Source Attribution](#source-attribution)
4. [Architecture Overview](#architecture-overview)
5. [Phase 1: MVP (Months 1-8)](#phase-1-mvp-months-1-8)
6. [Phase 2: Polish (Months 9-12)](#phase-2-polish-months-9-12)
7. [Phase 3: Advanced (Months 13-18)](#phase-3-advanced-months-13-18)
8. [Developer Experience](#developer-experience)
9. [Competitive Analysis](#competitive-analysis)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem
- **Cline**: Only 1 agent, no specialization
- **Kilo Code**: Mode switching is sequential (parent waits for child)
- **Roo Code**: Single agent, no role specialization
- **All**: No visual interface for managing agent prompts/configs

### Our Solution: Codekin
**6 specialized AI agents with RAG code indexing and visual prompt management - zero Docker complexity**

**Key Innovation:**
1. ✅ **6 Specialized Agents** (PM, Architect, Dev FE/BE, QA, DevOps)
2. ✅ **RAG Code Indexing** (Qdrant in-memory, semantic search)
3. ✅ **Web UI for "Super Prompts"** (Visual editor, templates, marketplace)
4. ✅ **Smart Coordination** (Dependency-aware, no forced parallelism)
5. ✅ **NO Docker Required** (SQLite + Qdrant in-memory)
6. ✅ **3-minute setup** (vs 30 min with Docker)

### Timeline
- **MVP**: 8 months (6 agents + web UI + orchestration)
- **Polish**: 12 months (templates, marketplace, analytics)
- **Advanced**: 18 months (team features, no-code agent builder)

---

## What We're Building

### Core Features

#### 1. Six Specialized Agents
Each agent has its own expertise, tools, and file access:

```
📋 PM Agent
   ├── Role: Requirements, specs, user stories
   ├── Tools: read, analyze, document
   └── Files: docs/**/*.md, specs/**/*.md

🏗️ Architect Agent
   ├── Role: System design, API contracts
   ├── Tools: read, analyze, design, diagram
   └── Files: docs/architecture/**/*

🎨 Dev Frontend Agent
   ├── Role: UI components, client-side logic
   ├── Tools: read, edit, test, browser
   └── Files: src/frontend/**/*

⚙️ Dev Backend Agent
   ├── Role: APIs, business logic, databases
   ├── Tools: read, edit, test, command
   └── Files: src/backend/**/*

🧪 QA Agent
   ├── Role: Test plans, test automation
   ├── Tools: read, edit-tests, test, analyze
   └── Files: tests/**/*

🚀 DevOps Agent
   ├── Role: CI/CD, deployment, monitoring
   ├── Tools: read, edit-configs, command, deploy
   └── Files: .github/workflows/**/*
```

#### 2. Web Dashboard for Prompt Management

**Visual Editor:**
- Edit system prompts for each agent
- Add few-shot examples
- Configure tools and file access
- Test prompts in real-time
- Export/import configurations

**Template Marketplace:**
- Enterprise Coding Standards
- Startup Fast Iteration
- Open Source Best Practices
- Custom templates (user-created)

**Task Dashboard:**
- Real-time agent status
- Task history and analytics
- Conversation logs
- Performance metrics

#### 3. Smart Orchestration

**Dependency-Aware Routing:**
```typescript
// Analyzes task dependencies
User: "Design and implement authentication"

Orchestrator Analysis:
  Task 1: Design auth (Architect)
  Task 2: Implement API (Dev Backend) - depends on Task 1
  Task 3: Build login UI (Dev Frontend) - depends on Task 2
  Task 4: Write tests (QA) - depends on Task 2 & 3

Execution Plan:
  Phase 1: Architect designs (20 min)
  Phase 2: Dev Backend implements (40 min)
  Phase 3: Dev Frontend builds UI (30 min)
  Phase 4: QA tests (20 min)

  Total: 110 min (sequential, respects dependencies)
```

**Smart Parallelism (When Possible):**
```typescript
User: "Design authentication AND design payment integration"

Orchestrator Analysis:
  Task 1: Design auth (Architect) - independent
  Task 2: Design payment (Architect) - independent

Execution Plan:
  Phase 1: Both designs in parallel (20 min)

  Total: 20 min (vs 40 min sequential) → 2x speedup!
```

---

## Source Attribution

### What We Take From Each Project

#### 🟢 From Roo Code (60% of codebase)

**Keep 100% (No Changes):**
```
packages/core/
├── src/providers/           # 40+ AI providers ✅
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── openrouter.ts
│   └── ollama.ts
├── src/tools/               # 22 developer tools ✅
│   ├── read.ts
│   ├── edit.ts
│   ├── grep.ts
│   ├── bash.ts
│   ├── git.ts
│   └── browser.ts
└── src/fs/                  # File operations ✅
```

**Keep 90% (Minor Modifications):**
```
packages/web/                # Web UI framework ✅
├── src/app/                 # Next.js structure (keep)
├── src/components/          # Redesign for agent management
└── src/api/                 # Extend for orchestrator
```

**Keep 80% (Extend):**
```
packages/vscode/             # VS Code extension ✅
└── src/                     # Add agent management UI
```

**Keep 80% (Adapt):**
```
packages/rag/                # ✅ Keep Qdrant for code indexing
├── src/indexer.ts           # Code indexing pipeline
├── src/search.ts            # Semantic search
└── src/embeddings.ts        # Embedding generation
```

**Remove:**
```
docker-compose.yml           # ❌ Use Qdrant in-memory mode instead
```

---

#### 🟡 From Kilo Code (Configuration Patterns)

**Adopt Pattern:**
```json
// Kilo's agent config structure
{
  "slug": "architect",
  "roleDefinition": "You are an expert architect...",
  "whenToUse": "When you need to design system architecture...",
  "tools": ["read", "write"]
}
```

**Enhance to:**
```json
// Codekin's enhanced config
{
  "slug": "architect",
  "name": "Architect Agent",
  "roleDefinition": "You are Codekin's Architect Agent...",
  "whenToUse": "Design architecture, create API contracts, review code...",
  "allowedToolGroups": ["read", "analyze", "design", "diagram"],
  "fileRestrictions": {
    "allowedPatterns": ["docs/architecture/**/*", "docs/api/**/*"],
    "deniedPatterns": ["src/**/*.ts"]
  },
  "model": "claude-opus-4",
  "examples": [
    {
      "input": "Design a REST API for user management",
      "output": "..."
    }
  ]
}
```

**Don't Copy:**
```typescript
// Kilo's sequential blocking (we avoid this)
task.pausedModeSlug = currentMode  // ❌
await provider.handleModeSwitch(newMode)  // ❌
```

---

#### 🔵 From Cline (Simplicity)

**Learn From:**
- ✅ Lightweight architecture (no external services)
- ✅ Embedded state management
- ✅ Instant startup
- ✅ Low resource usage

**Apply:**
- Use SQLite instead of PostgreSQL
- In-memory orchestration instead of Redis
- Direct file operations (no Docker sandboxing)

---

## Architecture Overview

### System Architecture (No Docker)

```
┌─────────────────────────────────────────────────────────────┐
│  Developer's Machine                                        │
│                                                             │
│  ┌────────────────┐         ┌──────────────────────────┐  │
│  │  VS Code       │◄───────►│  Codekin Backend         │  │
│  │  + Extension   │  HTTP   │  (Node.js)               │  │
│  └────────────────┘         │  localhost:3000          │  │
│                             │                          │  │
│  ┌────────────────┐         │  ┌──────────────────┐   │  │
│  │  Web Browser   │◄───────►│  │  Orchestrator    │   │  │
│  │  Dashboard     │  HTTP   │  │  ├─ Task Analyzer│   │  │
│  │  localhost:3001│         │  │  ├─ Dep Builder  │   │  │
│  └────────────────┘         │  │  └─ Scheduler    │   │  │
│                             │  └──────────────────┘   │  │
│                             │                          │  │
│                             │  ┌──────────────────┐   │  │
│                             │  │  6 Agents        │   │  │
│                             │  │  ├─ PM           │   │  │
│                             │  │  ├─ Architect    │   │  │
│                             │  │  ├─ Dev Frontend │   │  │
│                             │  │  ├─ Dev Backend  │   │  │
│                             │  │  ├─ QA           │   │  │
│                             │  │  └─ DevOps       │   │  │
│                             │  └──────────────────┘   │  │
│                             │                          │  │
│                             │  ┌──────────────────┐   │  │
│                             │  │  Tool Registry   │   │  │
│                             │  │  (22 Roo tools)  │   │  │
│                             │  └──────────────────┘   │  │
│                             │                          │  │
│                             │  ┌──────────────────┐   │  │
│                             │  │  SQLite DB       │   │  │
│                             │  │  ~/.codekin/     │   │  │
│                             │  │  codekin.db      │   │  │
│                             │  └──────────────────┘   │  │
│                             │                          │  │
│                             │  ┌──────────────────┐   │  │
│                             │  │  Qdrant          │   │  │
│                             │  │  (In-Memory)     │   │  │
│                             │  │  Code Indexing   │   │  │
│                             │  └──────────────────┘   │  │
│                             └──────────────────────────┘  │
│                                     ▲                     │
│                                     │                     │
│                                     ▼                     │
│                             ┌──────────────────────────┐  │
│                             │  External LLM APIs       │  │
│                             │  ├─ OpenAI (GPT-4)       │  │
│                             │  ├─ Anthropic (Claude)   │  │
│                             │  └─ Ollama (optional)    │  │
│                             └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Request (VS Code or Web)
    ↓
Orchestrator receives request
    ↓
Task Analyzer: Parse into tasks
    ↓
Dependency Builder: Build task graph
    ↓
Scheduler: Assign tasks to agents
    ↓
Agents execute tasks (using Roo tools)
    ↓
Results saved to SQLite
    ↓
Real-time updates to UI (WebSocket)
    ↓
User sees progress in VS Code/Web
```

---

## Phase 1: MVP (Months 1-8)

### Month 1: Foundation & Setup

#### Week 1-2: Repository Setup

**Fork Roo Code:**
```bash
# Day 1: Clone and fork
git clone https://github.com/roocode/roo-code.git codekin
cd codekin
git remote rename origin roo-upstream
git remote add origin https://github.com/codekin-ai/codekin.git

# Day 2-3: Remove Docker dependencies
rm -rf docker-compose.yml
rm -rf packages/rag  # Remove Qdrant

# Day 4-5: Add SQLite
pnpm add better-sqlite3
pnpm add @types/better-sqlite3 -D

# Day 6-10: Create new packages
mkdir -p packages/orchestrator/src
mkdir -p packages/agents/src
mkdir -p config/agents
mkdir -p config/prompt-templates
```

**Verify Roo Code works:**
```bash
pnpm install
pnpm dev
# Should start on localhost:3000
```

**Deliverables:**
- [ ] Roo Code forked and running
- [ ] Docker removed
- [ ] New package structure created
- [ ] SQLite dependency added

---

#### Week 3-4: SQLite Database Setup

**File:** `packages/db/src/schema.ts`

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Database location: ~/.codekin/codekin.db
const dbDir = path.join(os.homedir(), '.codekin')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'codekin.db')
export const db = new Database(dbPath)

// Create tables
db.exec(`
  -- Agent configurations
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role_definition TEXT NOT NULL,
    allowed_tools TEXT NOT NULL,
    file_restrictions TEXT,
    model TEXT NOT NULL,
    examples TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Prompt templates
  CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    active_template_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_template_id) REFERENCES prompt_templates(id)
  );

  -- Tasks
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    assigned_agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    dependencies TEXT,
    files_affected TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
  );

  -- Messages (conversation history)
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );

  -- Settings
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
  CREATE INDEX IF NOT EXISTS idx_templates_builtin ON prompt_templates(is_builtin);
`)

console.log('✅ Database initialized:', dbPath)
```

**Seed Data:**
```typescript
// packages/db/src/seed.ts
import { db } from './schema'

// Insert default agents
const defaultAgents = [
  {
    id: 'pm-default',
    type: 'pm',
    name: 'PM Agent',
    roleDefinition: `You are Codekin's Product Manager Agent...`,
    allowedTools: JSON.stringify(['read', 'analyze', 'document']),
    fileRestrictions: JSON.stringify({
      allowedPatterns: ['docs/**/*.md', 'specs/**/*.md'],
      deniedPatterns: ['src/**/*']
    }),
    model: 'gpt-4'
  },
  // ... other 5 agents
]

const insertAgent = db.prepare(`
  INSERT INTO agents (id, type, name, role_definition, allowed_tools, file_restrictions, model)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

for (const agent of defaultAgents) {
  insertAgent.run(
    agent.id,
    agent.type,
    agent.name,
    agent.roleDefinition,
    agent.allowedTools,
    agent.fileRestrictions,
    agent.model
  )
}

console.log('✅ Seeded 6 default agents')
```

**Deliverables:**
- [ ] SQLite database created at `~/.codekin/codekin.db`
- [ ] All tables created
- [ ] 6 default agents seeded
- [ ] Database helper functions created

---

### Month 2: Agent Base Implementation

#### Week 5-6: Base Agent Class

**File:** `packages/agents/src/base-agent.ts`

```typescript
import { db } from '@codekin/db'
import { RooCodeProvider } from '@codekin/core'
import { ToolRegistry } from '@codekin/core/tools'
import EventEmitter from 'events'

export interface AgentConfig {
  id: string
  type: string
  name: string
  roleDefinition: string
  allowedTools: string[]
  fileRestrictions?: {
    allowedPatterns: string[]
    deniedPatterns: string[]
  }
  model: string
  examples?: Array<{ input: string; output: string }>
}

export interface Task {
  id: string
  title: string
  description: string
  type: string
  dependencies: string[]
  filesAffected?: string[]
}

export interface TaskResult {
  success: boolean
  output: any
  filesChanged: string[]
  error?: string
}

export class BaseAgent extends EventEmitter {
  protected config: AgentConfig
  protected aiProvider: RooCodeProvider
  protected toolRegistry: ToolRegistry
  protected currentTask?: Task

  constructor(config: AgentConfig) {
    super()
    this.config = config
    this.aiProvider = new RooCodeProvider(config.model)
    this.toolRegistry = new ToolRegistry()

    // Load only allowed tools
    this.loadTools()
  }

  /**
   * Load tools based on agent's allowedTools config
   */
  private loadTools(): void {
    const allTools = this.toolRegistry.getAllTools()

    for (const tool of allTools) {
      if (this.config.allowedTools.includes(tool.name)) {
        // Tool is allowed, keep it
      } else {
        // Remove tool from registry
        this.toolRegistry.removeTool(tool.name)
      }
    }
  }

  /**
   * Main entry point: Handle a task
   */
  async handle(task: Task): Promise<TaskResult> {
    this.currentTask = task
    this.emit('task:started', { agentId: this.config.id, taskId: task.id })

    try {
      // Update database
      db.prepare('UPDATE tasks SET status = ?, started_at = ? WHERE id = ?')
        .run('active', new Date().toISOString(), task.id)

      // Execute task (implemented by child classes)
      const result = await this.executeTask(task)

      // Update database
      db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?')
        .run('completed', new Date().toISOString(), task.id)

      this.emit('task:completed', { agentId: this.config.id, taskId: task.id, result })

      return result
    } catch (error) {
      // Update database
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?')
        .run('failed', task.id)

      this.emit('task:failed', { agentId: this.config.id, taskId: task.id, error: (error as Error).message })

      return {
        success: false,
        output: null,
        filesChanged: [],
        error: (error as Error).message
      }
    } finally {
      this.currentTask = undefined
    }
  }

  /**
   * Abstract method: Each agent implements its own task execution
   */
  protected async executeTask(task: Task): Promise<TaskResult> {
    throw new Error('executeTask must be implemented by child class')
  }

  /**
   * Call LLM with agent's role and examples
   */
  protected async callLLM(userMessage: string): Promise<any> {
    const messages: any[] = [
      { role: 'system', content: this.config.roleDefinition }
    ]

    // Add few-shot examples if available
    if (this.config.examples && this.config.examples.length > 0) {
      for (const example of this.config.examples) {
        messages.push(
          { role: 'user', content: example.input },
          { role: 'assistant', content: example.output }
        )
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage })

    // Call LLM with available tools
    const response = await this.aiProvider.chat({
      model: this.config.model,
      messages,
      tools: this.getToolDefinitions()
    })

    return response
  }

  /**
   * Get tool definitions for LLM
   */
  protected getToolDefinitions(): any[] {
    return this.toolRegistry.getToolDefinitions()
  }

  /**
   * Execute tool calls returned by LLM
   */
  protected async executeTools(toolCalls: any[]): Promise<any[]> {
    const results = []

    for (const toolCall of toolCalls) {
      const tool = this.toolRegistry.getTool(toolCall.name)

      if (!tool) {
        results.push({ error: `Tool ${toolCall.name} not found` })
        continue
      }

      // Check file restrictions
      if (toolCall.name === 'edit' || toolCall.name === 'write') {
        const filePath = toolCall.arguments.path
        if (!this.canEditFile(filePath)) {
          results.push({ error: `Access denied: ${filePath}` })
          continue
        }
      }

      // Execute tool
      const result = await tool.execute(toolCall.arguments)
      results.push(result)
    }

    return results
  }

  /**
   * Check if agent can edit a file
   */
  protected canEditFile(filePath: string): boolean {
    if (!this.config.fileRestrictions) return true

    const { allowedPatterns, deniedPatterns } = this.config.fileRestrictions

    // Check denied patterns first
    if (deniedPatterns) {
      for (const pattern of deniedPatterns) {
        if (this.matchGlob(filePath, pattern)) {
          return false
        }
      }
    }

    // Check allowed patterns
    if (allowedPatterns) {
      for (const pattern of allowedPatterns) {
        if (this.matchGlob(filePath, pattern)) {
          return true
        }
      }
      return false // No pattern matched
    }

    return true // No restrictions
  }

  /**
   * Simple glob matching
   */
  private matchGlob(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
    return new RegExp(`^${regexPattern}$`).test(path)
  }

  /**
   * Save conversation to database
   */
  protected saveMessage(role: string, content: string): void {
    if (!this.currentTask) return

    db.prepare(`
      INSERT INTO messages (id, task_id, agent_id, role, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      this.currentTask.id,
      this.config.id,
      role,
      content
    )
  }
}
```

**Deliverables:**
- [ ] BaseAgent class implemented
- [ ] Tool loading based on config
- [ ] File restriction enforcement
- [ ] LLM integration with few-shot examples
- [ ] Database integration

---

#### Week 7-8: Implement 6 Agents

**File:** `packages/agents/src/architect-agent.ts`

```typescript
import { BaseAgent, Task, TaskResult } from './base-agent'
import type { AgentConfig } from './base-agent'

export class ArchitectAgent extends BaseAgent {
  constructor() {
    // Load config from database
    const config = db.prepare('SELECT * FROM agents WHERE type = ?').get('architect') as AgentConfig
    super(config)
  }

  protected async executeTask(task: Task): Promise<TaskResult> {
    // 1. Build prompt with task context
    const prompt = this.buildPrompt(task)

    // 2. Call LLM
    const response = await this.callLLM(prompt)

    // 3. Execute tool calls
    const toolResults = await this.executeTools(response.toolCalls || [])

    // 4. Extract files changed
    const filesChanged = this.extractFilesChanged(toolResults)

    return {
      success: true,
      output: response.content,
      filesChanged
    }
  }

  private buildPrompt(task: Task): string {
    return `
You are assigned the following task:

**Title:** ${task.title}
**Description:** ${task.description}
**Type:** ${task.type}

Please analyze this requirement and create the necessary architectural design.
Consider:
- System architecture and design patterns
- API contracts (REST, GraphQL, gRPC)
- Database schema design
- Technology stack decisions
- Scalability and performance

Create design documents in the docs/ directory.
`
  }

  private extractFilesChanged(toolResults: any[]): string[] {
    const files: string[] = []
    for (const result of toolResults) {
      if (result.filePath) {
        files.push(result.filePath)
      }
    }
    return files
  }
}
```

**Similarly implement:**
- `pm-agent.ts` - Product Manager
- `dev-frontend-agent.ts` - Frontend Developer
- `dev-backend-agent.ts` - Backend Developer
- `qa-agent.ts` - QA Engineer
- `devops-agent.ts` - DevOps Engineer

**Agent Configuration Files:**
```json
// config/agents/architect.json
{
  "slug": "architect",
  "name": "Architect Agent",
  "role": "architect",
  "roleDefinition": "You are Codekin's Architect Agent, responsible for system design, technology decisions, and ensuring code follows architectural patterns. You think long-term about scalability, maintainability, and technical debt.\n\nYour expertise includes:\n- System architecture and design patterns\n- API contract design (REST, GraphQL, gRPC)\n- Database schema design\n- Technology stack selection\n- Code review for architectural compliance\n- Performance and scalability considerations",
  "whenToUse": "Use when: designing system architecture, creating API contracts, making technology decisions, reviewing code for architectural compliance, addressing performance or scalability concerns",
  "allowedToolGroups": ["read", "analyze", "edit-docs", "diagram"],
  "fileRestrictions": {
    "allowedPatterns": [
      "docs/architecture/**/*",
      "docs/api/**/*",
      "docs/design/**/*",
      "**/*.md"
    ],
    "deniedPatterns": [
      "src/**/*.ts",
      "src/**/*.tsx",
      "src/**/*.js"
    ]
  },
  "model": "claude-opus-4",
  "examples": [
    {
      "input": "Design a REST API for user management with CRUD operations",
      "output": "# User Management API Design\n\n## Endpoints\n\n### Create User\n- **POST** `/api/users`\n- Request body: `{ name: string, email: string }`\n- Response: `{ id: string, name: string, email: string, createdAt: string }`\n\n### Get User\n- **GET** `/api/users/:id`\n- Response: `{ id: string, name: string, email: string, createdAt: string }`\n\n..."
    }
  ]
}
```

**Deliverables:**
- [ ] All 6 agent classes implemented
- [ ] Agent configs in `config/agents/*.json`
- [ ] Each agent has proper tool restrictions
- [ ] Each agent has file access restrictions
- [ ] Few-shot examples for each agent

---

#### Week 8 (continued): Code Indexing with Qdrant

**File:** `packages/rag/src/indexer.ts`

```typescript
import { Qdrant } from '@qdrant/qdrant-js'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

export class CodeIndexer {
  private qdrant: Qdrant
  private embeddings: OpenAIEmbeddings
  private collectionName: string

  constructor(collectionName: string = 'codebase') {
    // Use Qdrant in-memory mode (no Docker required)
    this.qdrant = new Qdrant({
      url: 'memory://',  // In-memory mode
      timeout: 30000
    })

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',  // Cheaper, faster
      batchSize: 512
    })

    this.collectionName = collectionName
  }

  /**
   * Initialize collection
   */
  async init(): Promise<void> {
    try {
      await this.qdrant.getCollection(this.collectionName)
      console.log('✅ Collection exists')
    } catch {
      // Create collection
      await this.qdrant.createCollection(this.collectionName, {
        vectors: {
          size: 1536,  // text-embedding-3-small dimension
          distance: 'Cosine'
        }
      })
      console.log('✅ Created collection:', this.collectionName)
    }
  }

  /**
   * Index entire codebase
   */
  async indexCodebase(projectPath: string): Promise<void> {
    console.log('📦 Indexing codebase:', projectPath)

    // Find all code files
    const files = await glob('**/*.{ts,tsx,js,jsx,py,java,go,rs,cpp,c,h}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
    })

    console.log(`📄 Found ${files.length} files`)

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\nclass ', '\n\nfunction ', '\n\nexport ', '\n\n', '\n', ' ']
    })

    let totalChunks = 0

    for (const file of files) {
      const filePath = path.join(projectPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Skip empty files
      if (content.trim().length === 0) continue

      // Split into chunks
      const chunks = await textSplitter.splitText(content)

      // Generate embeddings
      const embeddings = await this.embeddings.embedDocuments(chunks)

      // Prepare points
      const points = chunks.map((chunk, i) => ({
        id: `${file}-${i}`,
        vector: embeddings[i],
        payload: {
          file: file,
          chunk: chunk,
          chunkIndex: i,
          language: this.detectLanguage(file)
        }
      }))

      // Upload to Qdrant
      await this.qdrant.upsert(this.collectionName, {
        points
      })

      totalChunks += chunks.length
      console.log(`  ✓ Indexed ${file} (${chunks.length} chunks)`)
    }

    console.log(`✅ Indexed ${totalChunks} total chunks`)
  }

  /**
   * Search for relevant code
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddings.embedQuery(query)

    // Search Qdrant
    const results = await this.qdrant.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true
    })

    return results.map(r => ({
      file: r.payload.file as string,
      chunk: r.payload.chunk as string,
      score: r.score,
      language: r.payload.language as string
    }))
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(file: string): string {
    const ext = path.extname(file)
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c'
    }
    return langMap[ext] || 'unknown'
  }
}

export interface SearchResult {
  file: string
  chunk: string
  score: number
  language: string
}
```

**Integration with Agents:**

```typescript
// packages/agents/src/base-agent.ts (enhanced)

import { CodeIndexer } from '@codekin/rag'

export class BaseAgent extends EventEmitter {
  protected config: AgentConfig
  protected aiProvider: RooCodeProvider
  protected toolRegistry: ToolRegistry
  protected codeIndexer: CodeIndexer  // NEW
  protected currentTask?: Task

  constructor(config: AgentConfig) {
    super()
    this.config = config
    this.aiProvider = new RooCodeProvider(config.model)
    this.toolRegistry = new ToolRegistry()
    this.codeIndexer = new CodeIndexer()  // NEW

    this.loadTools()
  }

  /**
   * Enhanced: Include relevant code context from RAG
   */
  protected async callLLM(userMessage: string): Promise<any> {
    // NEW: Search for relevant code
    const relevantCode = await this.codeIndexer.search(userMessage, 3)

    const contextPrompt = relevantCode.length > 0
      ? `\n\nRelevant code context:\n${relevantCode.map((r, i) =>
          `\n[${i + 1}] ${r.file} (score: ${r.score.toFixed(2)})\n\`\`\`${r.language}\n${r.chunk}\n\`\`\``
        ).join('\n')}`
      : ''

    const messages: any[] = [
      { role: 'system', content: this.config.roleDefinition + contextPrompt }
    ]

    // Add few-shot examples
    if (this.config.examples && this.config.examples.length > 0) {
      for (const example of this.config.examples) {
        messages.push(
          { role: 'user', content: example.input },
          { role: 'assistant', content: example.output }
        )
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage })

    // Call LLM with RAG context
    const response = await this.aiProvider.chat({
      model: this.config.model,
      messages,
      tools: this.getToolDefinitions()
    })

    return response
  }
}
```

**Setup Script:**

```typescript
// packages/rag/src/setup.ts

import { CodeIndexer } from './indexer'

export async function setupCodeIndexing(projectPath: string): Promise<void> {
  console.log('🚀 Setting up code indexing...')

  const indexer = new CodeIndexer()

  // Initialize Qdrant collection
  await indexer.init()

  // Index the codebase
  await indexer.indexCodebase(projectPath)

  console.log('✅ Code indexing complete!')
  console.log('💡 Agents can now search your codebase semantically')
}
```

**Installation:**

```bash
# Add Qdrant dependency
pnpm add @qdrant/qdrant-js

# Add LangChain for text splitting and embeddings
pnpm add langchain @langchain/openai

# No Docker required - uses in-memory mode!
```

**Usage:**

```typescript
// On project initialization
import { setupCodeIndexing } from '@codekin/rag'

// Index codebase once
await setupCodeIndexing('/path/to/project')

// Agents automatically use RAG for context
// No additional configuration needed!
```

**Benefits:**

1. **Semantic Code Search**: Agents can find relevant code based on meaning, not just keywords
2. **Better Context**: LLM gets relevant code examples automatically
3. **No Docker**: Qdrant in-memory mode = zero setup complexity
4. **Fast**: text-embedding-3-small is 10x cheaper and 5x faster than ada-002
5. **Low Memory**: In-memory Qdrant uses ~100MB for typical projects

**Deliverables:**
- [ ] Qdrant integration with in-memory mode
- [ ] Code indexing pipeline
- [ ] Semantic search functionality
- [ ] Integration with BaseAgent class
- [ ] Setup script for initial indexing
- [ ] Auto-reindexing on file changes (watch mode)

---

### Month 3-4: Orchestrator Implementation

#### Week 9-10: Task Analyzer & Dependency Builder

**File:** `packages/orchestrator/src/task-analyzer.ts`

```typescript
import { RooCodeProvider } from '@codekin/core'

export interface Task {
  id: string
  title: string
  description: string
  type: string
  agentType: string
  estimatedDuration: number
  dependencies: string[]
  filesAffected?: string[]
}

export class TaskAnalyzer {
  private llm: RooCodeProvider

  constructor() {
    this.llm = new RooCodeProvider('gpt-4-turbo')
  }

  /**
   * Parse user requirement into discrete tasks
   */
  async analyze(requirement: string): Promise<Task[]> {
    const prompt = `You are a project manager breaking down a software development requirement into discrete tasks.

Requirement: "${requirement}"

Break this down into tasks for the following agent types:
- pm: Product Manager (write specs, clarify requirements)
- architect: Technical Architect (design system, API contracts)
- dev-frontend: Frontend Developer (implement UI)
- dev-backend: Backend Developer (implement API, business logic)
- qa: QA Engineer (write tests, run tests)
- devops: DevOps Engineer (CI/CD, deployment)

For each task, provide:
1. title (brief, action-oriented)
2. description (detailed)
3. agentType (who does this task)
4. type (design, implement, test, deploy, document)
5. estimatedDuration (in minutes)

Output as JSON array of tasks.`

    const response = await this.llm.chat({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(response.content)

    return parsed.tasks.map((t: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      title: t.title,
      description: t.description,
      type: t.type,
      agentType: t.agentType,
      estimatedDuration: t.estimatedDuration || 30,
      dependencies: [],
      filesAffected: []
    }))
  }
}
```

**File:** `packages/orchestrator/src/dependency-builder.ts`

```typescript
import { RooCodeProvider } from '@codekin/core'
import type { Task } from './task-analyzer'

export interface DependencyGraph {
  tasks: Task[]
  edges: Map<string, string[]> // taskId → [dependsOnTaskIds]
}

export class DependencyBuilder {
  private llm: RooCodeProvider

  constructor() {
    this.llm = new RooCodeProvider('gpt-4-turbo')
  }

  /**
   * Build dependency graph for tasks
   */
  async build(tasks: Task[]): Promise<DependencyGraph> {
    const edges = new Map<string, string[]>()

    for (const task of tasks) {
      const dependencies = await this.analyzeDependencies(task, tasks)
      edges.set(task.id, dependencies)
      task.dependencies = dependencies
    }

    return { tasks, edges }
  }

  /**
   * Analyze dependencies for a single task
   */
  private async analyzeDependencies(task: Task, allTasks: Task[]): Promise<string[]> {
    const prompt = `Given these tasks:

${allTasks.map((t, i) => `${i + 1}. [${t.agentType}] ${t.title}\n   Description: ${t.description}`).join('\n\n')}

Which tasks must complete BEFORE task "${task.title}" (a ${task.agentType} task) can start?

Consider:
- Design must happen before implementation
- Backend API must exist before frontend can integrate
- Implementation must complete before testing
- Tests must pass before deployment
- Requirements must be clear before design

Output: JSON object with "dependencies" field containing array of task numbers (1-based index).
If no dependencies, output {"dependencies": []}`

    const response = await this.llm.chat({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(response.content)
    const dependencyIndices = parsed.dependencies || []

    // Convert indices to task IDs
    return dependencyIndices
      .map((idx: number) => allTasks[idx - 1]?.id)
      .filter(Boolean)
  }

  /**
   * Find tasks that can run in parallel
   */
  findParallelGroups(graph: DependencyGraph): Task[][] {
    const groups: Task[][] = []
    const completed = new Set<string>()

    while (completed.size < graph.tasks.length) {
      // Find tasks ready to execute (all dependencies met)
      const ready = graph.tasks.filter(task => {
        if (completed.has(task.id)) return false
        const deps = graph.edges.get(task.id) || []
        return deps.every(depId => completed.has(depId))
      })

      if (ready.length === 0) {
        console.error('❌ Circular dependency detected!')
        break
      }

      // Check for file conflicts
      const conflictFree = this.removeFileConflicts(ready)

      groups.push(conflictFree)
      conflictFree.forEach(task => completed.add(task.id))
    }

    return groups
  }

  /**
   * Remove tasks that would conflict on same files
   */
  private removeFileConflicts(tasks: Task[]): Task[] {
    const result: Task[] = []
    const usedFiles = new Set<string>()

    for (const task of tasks) {
      const taskFiles = task.filesAffected || []
      const hasConflict = taskFiles.some(file => usedFiles.has(file))

      if (!hasConflict) {
        result.push(task)
        taskFiles.forEach(file => usedFiles.add(file))
      }
    }

    return result
  }
}
```

**Deliverables:**
- [ ] TaskAnalyzer can parse requirements into tasks
- [ ] DependencyBuilder can build dependency graph
- [ ] Can identify parallel execution opportunities
- [ ] Can detect and avoid file conflicts

---

#### Week 11-12: Orchestrator

**File:** `packages/orchestrator/src/orchestrator.ts`

```typescript
import EventEmitter from 'events'
import { db } from '@codekin/db'
import { TaskAnalyzer, Task } from './task-analyzer'
import { DependencyBuilder, DependencyGraph } from './dependency-builder'
import { BaseAgent } from '@codekin/agents'
import {
  PMAgent,
  ArchitectAgent,
  DevFrontendAgent,
  DevBackendAgent,
  QAAgent,
  DevOpsAgent
} from '@codekin/agents'

export class Orchestrator extends EventEmitter {
  private taskAnalyzer: TaskAnalyzer
  private dependencyBuilder: DependencyBuilder
  private agents: Map<string, BaseAgent>

  constructor() {
    super()
    this.taskAnalyzer = new TaskAnalyzer()
    this.dependencyBuilder = new DependencyBuilder()
    this.agents = new Map()

    // Initialize all 6 agents
    this.initializeAgents()
  }

  private initializeAgents(): void {
    const agents = [
      new PMAgent(),
      new ArchitectAgent(),
      new DevFrontendAgent(),
      new DevBackendAgent(),
      new QAAgent(),
      new DevOpsAgent()
    ]

    for (const agent of agents) {
      this.agents.set(agent.config.type, agent)

      // Listen to agent events
      agent.on('task:started', (data) => this.emit('task:started', data))
      agent.on('task:completed', (data) => this.emit('task:completed', data))
      agent.on('task:failed', (data) => this.emit('task:failed', data))
    }

    console.log(`✅ Initialized ${agents.length} agents`)
  }

  /**
   * Main entry point: Execute user requirement
   */
  async execute(requirement: string, projectId: string): Promise<void> {
    console.log('🚀 Orchestrator starting execution')
    this.emit('execution:started', { requirement, projectId })

    try {
      // 1. Analyze requirement into tasks
      console.log('📋 Analyzing requirement...')
      const tasks = await this.taskAnalyzer.analyze(requirement)
      console.log(`✅ Parsed into ${tasks.length} tasks`)

      // 2. Build dependency graph
      console.log('🔗 Building dependency graph...')
      const graph = await this.dependencyBuilder.build(tasks)
      console.log(`✅ Dependency graph built`)

      // 3. Find parallel execution groups
      const parallelGroups = this.dependencyBuilder.findParallelGroups(graph)
      console.log(`✅ Found ${parallelGroups.length} execution phases`)

      // 4. Save execution plan to database
      await this.saveExecutionPlan(projectId, graph, parallelGroups)

      // 5. Execute phase by phase
      for (let i = 0; i < parallelGroups.length; i++) {
        const group = parallelGroups[i]
        console.log(`\n🔄 Phase ${i + 1}/${parallelGroups.length}: ${group.length} task(s)`)

        this.emit('phase:started', { phase: i + 1, total: parallelGroups.length, tasks: group })

        // Execute all tasks in this group (can be parallel if multiple)
        await Promise.all(
          group.map(task => this.executeTask(task, projectId))
        )

        console.log(`✅ Phase ${i + 1} completed`)
        this.emit('phase:completed', { phase: i + 1 })
      }

      console.log('\n🎉 Execution complete!')
      this.emit('execution:completed', { projectId })

    } catch (error) {
      console.error('❌ Execution failed:', error)
      this.emit('execution:failed', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task, projectId: string): Promise<void> {
    // 1. Select agent
    const agent = this.agents.get(task.agentType)
    if (!agent) {
      throw new Error(`No agent found for type: ${task.agentType}`)
    }

    console.log(`  → [${agent.config.name}] ${task.title}`)

    // 2. Save task to database
    db.prepare(`
      INSERT INTO tasks (id, project_id, title, description, type, assigned_agent_id, status, dependencies, files_affected)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      task.id,
      projectId,
      task.title,
      task.description,
      task.type,
      agent.config.id,
      JSON.stringify(task.dependencies),
      JSON.stringify(task.filesAffected || [])
    )

    // 3. Execute task with agent
    await agent.handle(task)

    console.log(`  ✓ [${agent.config.name}] Completed`)
  }

  /**
   * Save execution plan to database
   */
  private async saveExecutionPlan(
    projectId: string,
    graph: DependencyGraph,
    parallelGroups: Task[][]
  ): Promise<void> {
    // Store execution plan metadata
    const planData = {
      totalTasks: graph.tasks.length,
      totalPhases: parallelGroups.length,
      estimatedTime: this.calculateEstimatedTime(parallelGroups),
      tasks: graph.tasks.map(t => ({
        id: t.id,
        title: t.title,
        agentType: t.agentType,
        dependencies: t.dependencies
      }))
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `).run(`execution_plan_${projectId}`, JSON.stringify(planData))
  }

  /**
   * Calculate estimated execution time
   */
  private calculateEstimatedTime(parallelGroups: Task[][]): number {
    return parallelGroups.reduce((sum, group) => {
      const maxDuration = Math.max(...group.map(t => t.estimatedDuration))
      return sum + maxDuration
    }, 0)
  }
}
```

**Deliverables:**
- [ ] Orchestrator implemented
- [ ] Can execute requirements end-to-end
- [ ] Respects task dependencies
- [ ] Executes independent tasks in parallel
- [ ] Real-time progress events emitted

---

### Month 5-6: Web UI for Agent Management

#### Week 13-16: Prompt Editor Interface

**File:** `packages/web/src/app/agents/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { AgentCard } from '@/components/AgentCard'
import { PromptEditor } from '@/components/PromptEditor'
import { PromptTemplateLibrary } from '@/components/PromptTemplateLibrary'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [activeTab, setActiveTab] = useState<'library' | 'templates'>('library')

  useEffect(() => {
    fetchAgents()
  }, [])

  async function fetchAgents() {
    const response = await fetch('/api/agents')
    const data = await response.json()
    setAgents(data.agents)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Agent Configuration</h1>
        <p className="text-gray-600 mt-1">
          Customize agent prompts, tools, and behaviors
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex px-6">
          <button
            className={`px-4 py-3 border-b-2 font-medium ${
              activeTab === 'library'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('library')}
          >
            Agent Library
          </button>
          <button
            className={`px-4 py-3 border-b-2 font-medium ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            Prompt Templates
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {activeTab === 'library' ? (
          <>
            {/* Left: Agent List */}
            <div className="col-span-4 overflow-y-auto">
              <div className="space-y-4">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onClick={() => setSelectedAgent(agent)}
                  />
                ))}

                <button
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  onClick={() => {/* Create custom agent */}}
                >
                  + Create Custom Agent
                </button>
              </div>
            </div>

            {/* Right: Prompt Editor */}
            <div className="col-span-8 overflow-y-auto">
              {selectedAgent ? (
                <PromptEditor
                  agent={selectedAgent}
                  onSave={async (updated) => {
                    await fetch(`/api/agents/${updated.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updated)
                    })
                    await fetchAgents()
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Select an agent to edit
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="col-span-12">
            <PromptTemplateLibrary
              onApply={async (templateId) => {
                await fetch('/api/templates/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ templateId })
                })
                await fetchAgents()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

**File:** `packages/web/src/components/PromptEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { ToolSelector } from './ToolSelector'
import { FilePatternEditor } from './FilePatternEditor'
import { ExampleEditor } from './ExampleEditor'

export function PromptEditor({ agent, onSave }) {
  const [prompt, setPrompt] = useState(agent.roleDefinition)
  const [tools, setTools] = useState(agent.allowedTools)
  const [fileRestrictions, setFileRestrictions] = useState(agent.fileRestrictions)
  const [examples, setExamples] = useState(agent.examples || [])
  const [model, setModel] = useState(agent.model)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  async function handleSave() {
    await onSave({
      ...agent,
      roleDefinition: prompt,
      allowedTools: tools,
      fileRestrictions,
      examples,
      model
    })
  }

  async function handleTest() {
    setIsTesting(true)
    try {
      const response = await fetch('/api/agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          testPrompt: 'Design a simple REST API for a todo app'
        })
      })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error.message })
    } finally {
      setIsTesting(false)
    }
  }

  async function handleExport() {
    const config = {
      ...agent,
      roleDefinition: prompt,
      allowedTools: tools,
      fileRestrictions,
      examples,
      model
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.type}-agent-config.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {agent.icon} {agent.name}
          </h2>
          <p className="text-gray-600 mt-1">{agent.type} agent</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {isTesting ? 'Testing...' : 'Test Prompt'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Export
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="block font-semibold mb-2">System Prompt</label>
        <p className="text-sm text-gray-600 mb-2">
          This is the core instruction that defines the agent's role and behavior
        </p>
        <div className="border rounded-lg overflow-hidden">
          <Editor
            height="300px"
            language="markdown"
            value={prompt}
            onChange={(value) => setPrompt(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on'
            }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Tip: Use variables like {'{project_name}'}, {'{language}'}, {'{framework}'}
        </div>
      </div>

      {/* AI Model Selection */}
      <div>
        <label className="block font-semibold mb-2">AI Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <optgroup label="OpenAI">
            <option value="gpt-4">GPT-4 (Best quality)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & cheap)</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-opus-4">Claude Opus (Reasoning)</option>
            <option value="claude-sonnet-4">Claude Sonnet (Balanced)</option>
            <option value="claude-haiku">Claude Haiku (Fast)</option>
          </optgroup>
          <optgroup label="Local">
            <option value="ollama:codellama">Ollama CodeLlama (Local)</option>
            <option value="ollama:mistral">Ollama Mistral (Local)</option>
          </optgroup>
        </select>
      </div>

      {/* Tools */}
      <div>
        <label className="block font-semibold mb-2">Allowed Tools</label>
        <p className="text-sm text-gray-600 mb-2">
          Control which tools this agent can use
        </p>
        <ToolSelector
          selectedTools={tools}
          onChange={setTools}
        />
      </div>

      {/* File Restrictions */}
      <div>
        <label className="block font-semibold mb-2">File Access Rules</label>
        <p className="text-sm text-gray-600 mb-2">
          Define which files this agent can read/edit using glob patterns
        </p>
        <FilePatternEditor
          restrictions={fileRestrictions}
          onChange={setFileRestrictions}
        />
      </div>

      {/* Examples (Few-shot Learning) */}
      <div>
        <label className="block font-semibold mb-2">Examples (Few-shot Learning)</label>
        <p className="text-sm text-gray-600 mb-2">
          Provide examples to guide the agent's behavior
        </p>
        <ExampleEditor
          examples={examples}
          onChange={setExamples}
        />
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Test Result</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
```

**Deliverables:**
- [ ] Agent management UI implemented
- [ ] Visual prompt editor with Monaco Editor
- [ ] Tool selector component
- [ ] File pattern editor
- [ ] Few-shot example editor
- [ ] AI model selector
- [ ] Export/import agent configs
- [ ] Test prompt functionality

---

### Month 7-8: Task Dashboard & Analytics

#### Week 17-20: Dashboard Implementation

**File:** `packages/web/src/app/dashboard/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { AgentStatusBoard } from '@/components/AgentStatusBoard'
import { TaskTimeline } from '@/components/TaskTimeline'
import { ConversationFeed } from '@/components/ConversationFeed'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function DashboardPage() {
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])

  const ws = useWebSocket('ws://localhost:3000/ws')

  useEffect(() => {
    // Fetch initial data
    fetchAgents()
    fetchTasks()
    fetchMessages()

    // Subscribe to real-time updates
    if (ws) {
      ws.on('agent:status_changed', handleAgentUpdate)
      ws.on('task:started', handleTaskUpdate)
      ws.on('task:completed', handleTaskUpdate)
      ws.on('agent:message', handleNewMessage)
    }

    return () => {
      if (ws) {
        ws.off('agent:status_changed', handleAgentUpdate)
        ws.off('task:started', handleTaskUpdate)
        ws.off('task:completed', handleTaskUpdate)
        ws.off('agent:message', handleNewMessage)
      }
    }
  }, [ws])

  async function fetchAgents() {
    const response = await fetch('/api/agents')
    const data = await response.json()
    setAgents(data.agents)
  }

  async function fetchTasks() {
    const response = await fetch('/api/tasks')
    const data = await response.json()
    setTasks(data.tasks)
  }

  async function fetchMessages() {
    const response = await fetch('/api/messages')
    const data = await response.json()
    setMessages(data.messages)
  }

  function handleAgentUpdate(data) {
    setAgents(prev => prev.map(a =>
      a.id === data.agentId ? { ...a, status: data.status } : a
    ))
  }

  function handleTaskUpdate(data) {
    fetchTasks() // Refresh task list
  }

  function handleNewMessage(data) {
    setMessages(prev => [...prev, data])
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Codekin Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time agent coordination</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left: Agent Status */}
        <div className="col-span-3 overflow-y-auto">
          <AgentStatusBoard agents={agents} />
        </div>

        {/* Center: Task Timeline */}
        <div className="col-span-6 overflow-y-auto">
          <TaskTimeline tasks={tasks} />
        </div>

        {/* Right: Conversations */}
        <div className="col-span-3 overflow-y-auto">
          <ConversationFeed messages={messages} />
        </div>
      </div>
    </div>
  )
}
```

**Components:**

```typescript
// Agent Status Board
export function AgentStatusBoard({ agents }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">Agents</h2>
      {agents.map(agent => (
        <div key={agent.id} className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{agent.icon}</span>
              <span className="font-medium">{agent.name}</span>
            </div>
            <StatusBadge status={agent.status} />
          </div>
          {agent.currentTask && (
            <div className="text-sm text-gray-600">
              Working on: {agent.currentTask.title}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Task Timeline
export function TaskTimeline({ tasks }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">Task Timeline</h2>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{task.title}</span>
              <StatusBadge status={task.status} />
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Agent: {task.assignedAgent?.name}
            </div>
            {task.status === 'active' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${task.progress || 0}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Conversation Feed
export function ConversationFeed({ messages }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">Conversations</h2>
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="bg-white rounded-lg border p-3">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
            <div className="flex items-start gap-2">
              <span>{msg.agent?.icon}</span>
              <div>
                <div className="font-medium text-sm">{msg.agent?.name}</div>
                <div className="text-sm text-gray-700">{msg.content}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Task dashboard implemented
- [ ] Real-time agent status display
- [ ] Task timeline visualization
- [ ] Conversation feed
- [ ] WebSocket integration for live updates

---

## Phase 2: Polish (Months 9-12)

### Month 9-10: Prompt Template Marketplace

**Built-in Templates:**

```typescript
// config/prompt-templates/enterprise.json
{
  "id": "template-enterprise",
  "name": "Enterprise Coding Standards",
  "description": "Strict standards for enterprise projects with compliance requirements",
  "category": "enterprise",
  "rating": 4.8,
  "downloads": 1243,
  "agents": {
    "architect": {
      "roleDefinition": "...",
      "examples": [...]
    },
    "dev-backend": {
      "roleDefinition": "...",
      "examples": [...]
    }
    // All 6 agents configured
  }
}

// config/prompt-templates/startup.json
{
  "id": "template-startup",
  "name": "Startup Fast Iteration",
  "description": "Move fast, ship MVPs, iterate based on feedback",
  "category": "startup",
  "rating": 4.6,
  "downloads": 892,
  "agents": { ... }
}

// config/prompt-templates/open-source.json
{
  "id": "template-oss",
  "name": "Open Source Best Practices",
  "description": "Focus on documentation, contributor-friendly code, community building",
  "category": "open-source",
  "rating": 4.9,
  "downloads": 567,
  "agents": { ... }
}
```

**Template Editor UI:**
```typescript
export function PromptTemplateLibrary({ onApply }) {
  const [templates, setTemplates] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const response = await fetch('/api/templates')
    const data = await response.json()
    setTemplates(data.templates)
  }

  const filtered = templates.filter(t =>
    filter === 'all' || t.category === filter
  )

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'enterprise', 'startup', 'open-source', 'custom'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-3 gap-6">
        {filtered.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onApply={() => onApply(template.id)}
            onCustomize={() => customizeTemplate(template)}
          />
        ))}

        {/* Create Custom Template */}
        <button
          onClick={() => createCustomTemplate()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">+</div>
            <div className="font-medium">Create Custom Template</div>
          </div>
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template, onApply, onCustomize }) {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
      <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{template.description}</p>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>{template.rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📥</span>
          <span>{template.downloads}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={onCustomize}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Customize
        </button>
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Template marketplace UI
- [ ] Built-in templates (Enterprise, Startup, OSS)
- [ ] Apply template functionality
- [ ] Customize template functionality
- [ ] Create custom template wizard
- [ ] Template rating system
- [ ] Export/import templates

---

### Month 11-12: Analytics & Performance Tracking

**Analytics Dashboard:**
```typescript
export function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {
    const response = await fetch('/api/analytics')
    const data = await response.json()
    setMetrics(data)
  }

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks Completed"
          value={metrics.totalTasks}
          change="+12% from last week"
        />
        <MetricCard
          title="Average Task Time"
          value={`${metrics.avgTaskTime}min`}
          change="-5% from last week"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          change="+2% from last week"
        />
        <MetricCard
          title="Token Cost"
          value={`$${metrics.totalCost}`}
          change="+$15 from last week"
        />
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Agent Performance</h2>
        <AgentPerformanceChart data={metrics.agentPerformance} />
      </div>

      {/* Task Timeline */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Tasks Over Time</h2>
        <TaskTimelineChart data={metrics.taskTimeline} />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
        <CostBreakdownChart data={metrics.costByAgent} />
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Analytics dashboard
- [ ] KPI tracking (tasks, time, cost)
- [ ] Agent performance metrics
- [ ] Task timeline visualization
- [ ] Cost breakdown by agent
- [ ] Export analytics data

---

## Phase 3: Advanced (Months 13-18)

### Month 13-15: Agent Learning from Feedback

**Feedback System:**
```typescript
// User can rate agent responses
export function TaskResultCard({ task, result }) {
  const [rating, setRating] = useState(null)
  const [feedback, setFeedback] = useState('')

  async function submitFeedback() {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: task.id,
        agentId: task.assignedAgentId,
        rating,
        feedback
      })
    })
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold mb-2">{task.title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        Completed by {task.assignedAgent.name}
      </p>

      {/* Result */}
      <div className="bg-gray-50 rounded p-4 mb-4">
        <pre className="text-sm">{result.output}</pre>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-4 mb-4">
        <span className="font-medium">How was this result?</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <textarea
        placeholder="Optional: Provide feedback to improve this agent..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-3 border rounded-lg mb-4"
        rows={3}
      />

      <button
        onClick={submitFeedback}
        disabled={!rating}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        Submit Feedback
      </button>
    </div>
  )
}
```

**Learning System:**
- Collect feedback on agent responses
- Automatically add high-rated responses as examples
- Fine-tune agent prompts based on feedback patterns

---

### Month 16-18: No-Code Agent Builder & Team Features

**No-Code Agent Builder:**
- Visual interface to create custom agents
- Drag-and-drop tool selection
- Template-based prompt generation
- Pre-built agent personalities

**Team Collaboration:**
- Shared agent configurations
- Team workspaces
- Agent marketplace (share custom agents)
- Usage analytics per team member

---

## Developer Experience

### Installation (3-4 Minutes)

```bash
# Step 1: Install VS Code Extension (1 minute)
1. Open VS Code
2. Search "Codekin"
3. Click Install

# Step 2: Extension Auto-Setup (2 minutes)
Extension automatically:
- Downloads Codekin backend (~50 MB)
- Creates ~/.codekin/codekin.db
- Starts backend on localhost:3000
- Opens web dashboard on localhost:3001

# Step 3: Quick Configuration (1 minute)
Web dashboard guides you:
1. Add OpenAI/Anthropic API key
2. Choose a prompt template
3. Select which agents to enable
4. Click "Start Coding"

✅ Total: 3-4 minutes
```

### Resource Usage

```
Memory: ~700 MB
  ├── VS Code Extension: 50 MB
  ├── Node.js Backend: 300 MB
  ├── SQLite: 10 MB
  ├── Qdrant (In-Memory): 100 MB
  └── Web UI: 240 MB

Disk: ~500 MB
  ├── Extension: 50 MB
  ├── Backend: 200 MB
  ├── Dependencies: 200 MB
  └── Database: 50 MB

Startup: 7 seconds
  ├── Extension load: 1 sec
  ├── Backend start: 3 sec
  ├── Qdrant init: 2 sec
  └── Web UI: 1 sec
```

---

## Competitive Analysis

| Feature | Cline | Kilo Code | Roo Code | **Codekin** |
|---------|-------|-----------|----------|-------------|
| **Agents** | 1 | 1 (5 modes) | 1 | **6 specialized** |
| **Execution** | Sequential | Sequential | Sequential | **Smart coordination** |
| **Web UI** | ❌ | ❌ | ✅ Basic | ✅ **Advanced (agent config)** |
| **Prompt Editor** | ❌ | ❌ | ❌ | ✅ **Visual editor** |
| **Templates** | ❌ | ❌ | ❌ | ✅ **Marketplace** |
| **Install Time** | 30 sec | 30 sec | 2 min | **3-4 min** |
| **Memory** | 250 MB | 250 MB | 500 MB | **700 MB** |
| **Docker** | ❌ | ❌ | ❌ | ❌ **Not required** |
| **Setup Complexity** | Easy | Easy | Medium | **Easy** |
| **RAG** | ❌ | ❌ | ✅ Qdrant | ✅ **Qdrant (in-memory)** |
| **Tools** | 11 | 11 | 22 | **22 (from Roo)** |
| **AI Providers** | 4 | 5 | 40+ | **40+ (from Roo)** |

---

## Success Metrics

### Phase 1 (Month 8) - MVP Launch
- [ ] All 6 agents working
- [ ] Complete 50 end-to-end tasks
- [ ] Web UI functional
- [ ] Average task completion time < 30 min
- [ ] User satisfaction ≥ 4/5

### Phase 2 (Month 12) - Polished Product
- [ ] 3 built-in prompt templates
- [ ] 100+ GitHub stars
- [ ] 10+ community contributors
- [ ] Analytics dashboard complete
- [ ] Template marketplace live

### Phase 3 (Month 18) - Advanced Features
- [ ] No-code agent builder
- [ ] 500+ GitHub stars
- [ ] 50+ community contributors
- [ ] Agent marketplace with 20+ custom agents
- [ ] Team collaboration features

---

## Conclusion

### What We're Building

**Codekin = Best of Roo Code + Kilo Code + Cline + Visual Prompt Management**

### Key Innovations
1. ✅ **6 Specialized Agents** (vs 1 in competitors)
2. ✅ **Web UI for Prompt Management** (unique differentiator)
3. ✅ **Smart Coordination** (dependency-aware, not forced parallelism)
4. ✅ **NO Docker** (SQLite + Qdrant in-memory, simple setup)
5. ✅ **RAG Code Indexing** (Semantic code search without Docker)
6. ✅ **Template Marketplace** (Enterprise, Startup, OSS templates)

### Why This Will Succeed
- ✅ Solves real pain points (single agent limitations)
- ✅ Easy installation (3-4 minutes, no Docker)
- ✅ Low resource usage (700 MB vs 2.5 GB with Docker)
- ✅ Semantic code search (RAG without complexity)
- ✅ Visual configuration (non-technical users can customize)
- ✅ Built on proven foundations (60-70% from Roo Code)
- ✅ Clear competitive advantages (6 agents, RAG, prompt editor, templates)

### Next Steps
1. **Week 1**: Fork Roo Code, remove Docker
2. **Month 1**: Setup SQLite, create base agent class
3. **Month 2**: Implement 6 agents
4. **Month 3-4**: Build orchestrator
5. **Month 5-6**: Build web UI for prompt management
6. **Month 7-8**: Polish MVP and launch

---

*Ready to build!* 🚀

