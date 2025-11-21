# Codekin Implementation Plan - Simplified
**Version:** 1.0
**Date:** 2025-11-18
**Strategy:** Maximum reuse, minimum risk, focus on parallel execution

---

## Executive Summary

**Goal:** Build Codekin by forking Roo Code and integrating patterns from OpenHands, Kilo Code, and Cline - maximizing code reuse while achieving true parallel multi-agent execution.

**Core Strategy:**
1. **Fork Roo Code** (60-70% of final codebase) - Get monorepo, tools, RAG, Web UI for free
2. **Adopt OpenHands patterns** (EventStream architecture) - Enable agent coordination
3. **Adopt Kilo Code patterns** (agent configuration) - Define agent roles and permissions
4. **Reference Cline** (tool patterns) - Validate tool abstractions

**Timeline:** 24 months (realistic for distributed systems)
**Risk Mitigation:** Start with 2 agents, validate parallelism works, then scale to 6

---

## Part 1: What to Take From Each Project

### 🟢 From Roo Code (PRIMARY FOUNDATION - 60-70% reuse)

#### ✅ Take 100% As-Is (No Changes)
| Component | Location | Why Take | License |
|-----------|----------|----------|---------|
| **Monorepo Structure** | Root `/` | Turborepo + pnpm setup works perfectly | Apache 2.0 |
| **40+ AI Providers** | `packages/core/src/providers/` | OpenAI, Anthropic, OpenRouter, Ollama, etc. | Apache 2.0 |
| **22 Developer Tools** | `packages/core/src/tools/` | read, edit, grep, bash, browser, git, etc. | Apache 2.0 |
| **Tool Abstractions** | `packages/core/src/tools/base/` | BaseTool, ToolExecutor, ToolRegistry | Apache 2.0 |
| **File System Operations** | `packages/core/src/fs/` | Safe file read/write with sandboxing | Apache 2.0 |
| **Git Integration** | `packages/core/src/git/` | Git commands, branch management, commits | Apache 2.0 |

**Action:** `git clone` and keep 100%

---

#### ✅ Take 90% (Minor Modifications)
| Component | Location | Changes Needed | Why |
|-----------|----------|----------------|-----|
| **RAG System (Qdrant)** | `packages/rag/` | Add 6 collections instead of 1 | Multi-agent specialization |
| **Embedding Pipeline** | `packages/rag/src/embeddings/` | Add collection routing logic | Route frontend code → frontend collection |
| **Vector Search** | `packages/rag/src/search/` | Add per-agent search scoping | Each agent queries its specialized index |

**Changes:**
```typescript
// BEFORE (Roo Code - Single collection)
const collection = 'codebase'
await qdrant.search(collection, query)

// AFTER (Codekin - Per-agent collections)
const collection = getCollectionForAgent(agentType)
// pm/architect → 'codebase_docs'
// dev-frontend → 'codebase_frontend'
// dev-backend → 'codebase_backend'
// qa → 'codebase_tests'
// devops → 'codebase_infra'
await qdrant.search(collection, query)
```

---

#### ✅ Take 70% (Significant Redesign)
| Component | Location | Changes Needed | Why |
|-----------|----------|----------------|-----|
| **Web UI** | `packages/web/` | Redesign for multi-agent view | Show 6 agents, task flow, conversations |
| **State Management** | `packages/web/src/store/` | Add agent state, task state, orchestration state | Track multiple agents simultaneously |
| **WebSocket Layer** | `packages/web/src/api/websocket.ts` | Adapt for EventStream messages | Multi-agent event broadcasting |

**UI Changes:**
```
BEFORE (Roo Code):
┌─────────────────────────┐
│ Single Agent Chat       │
│ [User message]          │
│ [Agent response]        │
│ [Code changes]          │
└─────────────────────────┘

AFTER (Codekin):
┌────────────────────────────────────────┐
│ Agent Status Board                     │
│ PM: Active  │ Arch: Waiting │ Dev: Idle│
├────────────────────────────────────────┤
│ Task Flow Visualization (Gantt chart) │
├────────────────────────────────────────┤
│ Agent Conversations (Feed)            │
│ [PM → Arch] "Requirements ready"      │
│ [Arch → Dev] "API design complete"    │
└────────────────────────────────────────┘
```

---

#### ✅ Take 80% (Extension Needed)
| Component | Location | Extension | Why |
|-----------|----------|-----------|-----|
| **VS Code Extension** | `packages/vscode/` | Add agent management UI | Select which agents to use |
| **Configuration System** | `packages/core/src/config/` | Add agent profiles | PM config, Dev config, QA config, etc. |
| **Database Layer** | `packages/db/` | Add tables for agents, tasks, messages, reviews | Multi-agent state tracking |

---

#### ❌ Don't Take (Replace with New)
| Component | Reason | Replace With |
|-----------|--------|--------------|
| **Single Agent Controller** | Sequential execution only | → **Orchestrator** (new) |
| **Task Queue** | No dependency analysis | → **Dependency Analyzer** (new) |
| **Sequential Task Runner** | Can't run parallel | → **Parallel Task Scheduler** (new) |

---

### 🟡 From OpenHands (ARCHITECTURAL PATTERNS - Translate Python → TypeScript)

#### ✅ Adopt Pattern (Implement in TypeScript)
| Pattern | OpenHands Location | Codekin Implementation | Why Critical |
|---------|-------------------|------------------------|--------------|
| **EventStream** | `openhands/events/stream.py` | `packages/orchestrator/src/event-stream.ts` | Agent coordination backbone |
| **Event Types** | `openhands/events/event.py` | `packages/orchestrator/src/events/` | Standardized message protocol |
| **AgentController** | `openhands/controller/agent_controller.py` | `packages/orchestrator/src/agent-controller.ts` | Agent lifecycle management |
| **Action Space** | `openhands/events/action/` | `packages/core/src/actions/` | Standardized agent actions |
| **Observation Space** | `openhands/events/observation/` | `packages/core/src/observations/` | Standardized agent observations |

**Key Pattern - EventStream:**
```python
# OpenHands (Python)
class EventStream:
    def add_event(self, event: Event, source: str):
        self._events.append(event)
        await self._broadcast(event)

    def subscribe(self, event_type: str, callback):
        self._subscribers[event_type].append(callback)
```

**Translate to:**
```typescript
// Codekin (TypeScript + Redis)
class EventStream {
  private redis: Redis

  async addEvent(event: Event, source: string): Promise<void> {
    // Persist to PostgreSQL
    await db.messages.create({ data: event })

    // Broadcast via Redis Pub/Sub
    await this.redis.publish(`event:${event.type}`, JSON.stringify(event))
  }

  subscribe(eventType: string, callback: (event: Event) => void): void {
    this.redis.subscribe(`event:${eventType}`)
    this.redis.on('message', (channel, message) => {
      if (channel === `event:${eventType}`) {
        callback(JSON.parse(message))
      }
    })
  }
}
```

**Why This Works:**
- OpenHands proves EventStream pattern works for multi-agent coordination
- We translate concept (not code) to TypeScript
- Add Redis Pub/Sub for better scalability
- Add PostgreSQL persistence for audit trail

---

#### ✅ Reference Architecture (Don't Copy Code, Learn Pattern)
| OpenHands Component | What We Learn | How We Apply |
|---------------------|---------------|--------------|
| **Agent State Machine** | `AgentState` enum (INIT, RUNNING, PAUSED, etc.) | Create similar state machine for 6 agents |
| **Micro-agent Pattern** | Small, focused agents with single responsibility | Each of our 6 agents is specialized |
| **Sandbox Execution** | Docker container per agent | Use Docker SDK in Node.js |
| **Message History** | Conversation history tracking | Store in PostgreSQL `messages` table |

---

### 🟠 From Kilo Code (CONFIGURATION PATTERNS - JSON structure)

#### ✅ Adopt Configuration Structure
| Kilo Concept | Location | Codekin Adaptation |
|--------------|----------|-------------------|
| **Mode Definition** | `.kilo/modes/*.json` | → **Agent Profiles** (`config/agents/*.json`) |
| **roleDefinition** | Mode JSON `roleDefinition` field | Copy exact pattern for agent system prompts |
| **whenToUse** | Mode JSON `whenToUse` field | Use for orchestrator routing logic |
| **allowedTools** | Mode JSON `tools` field | → **allowedToolGroups** (more granular) |
| **File Restrictions** | Not in Kilo | Add `fileRestrictions` with regex patterns |

**Kilo Code Mode Example:**
```json
{
  "slug": "architect",
  "name": "Architect",
  "roleDefinition": "You are an expert software architect...",
  "whenToUse": "When you need to design system architecture...",
  "tools": ["read", "write", "browser"]
}
```

**Codekin Agent Profile (Enhanced):**
```json
{
  "slug": "architect",
  "name": "Architect Agent",
  "role": "architect",
  "roleDefinition": "You are Codekin's Architect Agent, responsible for system design...",
  "whenToUse": "Use when: designing architecture, creating API contracts, reviewing code for architectural compliance",
  "allowedToolGroups": ["read", "analyze", "edit-docs", "diagram"],
  "fileRestrictions": {
    "allowedPatterns": ["docs/architecture/**/*", "docs/api/**/*"],
    "deniedPatterns": ["src/**/*.ts", "src/**/*.tsx"]
  },
  "model": "claude-opus-4",
  "source": "project"
}
```

**Why This Works:**
- Kilo Code's 200k users prove this config pattern is usable
- We enhance it (add file restrictions, model selection)
- Keep familiar structure for easier migration

---

#### ❌ Don't Copy (It's Sequential)
| Kilo Component | Why Not | What We Do Instead |
|----------------|---------|-------------------|
| **Mode Switching** | `pausedModeSlug` pattern (parent waits) | → Parallel execution (agents don't wait) |
| **Task Subtask** | Blocking parent-child relationship | → Independent tasks in EventStream |
| **Single LLM Context** | One context shared across modes | → Separate contexts per agent |

---

### 🔵 From Cline (REFERENCE ONLY - Validate patterns)

| Concept | Cline Implementation | Our Validation |
|---------|---------------------|----------------|
| **Tool Abstractions** | `src/services/tools/` | ✅ Confirm Roo Code tools are compatible |
| **VS Code Extension Pattern** | `src/extension.ts` | ✅ Use similar activation pattern |
| **Task State Management** | `src/core/TaskState.ts` | ✅ Reference for task lifecycle |
| **MCP Hub** | `src/mcp/` | ❌ Skip (too complex for MVP) |

**Action:** Read Cline code for validation, don't copy directly (Roo Code already has better implementations)

---

## Part 2: Step-by-Step Implementation Plan

### Phase 0: Foundation (Months 1-4) - VALIDATE PARALLELISM

**Goal:** Prove adaptive parallelism works with 2 agents before building all 6

#### Week 1-2: Setup
```bash
# 1. Fork Roo Code
git clone https://github.com/roocode/roo-code.git codekin
cd codekin
git remote rename origin roo-upstream
git remote add origin https://github.com/codekin-ai/codekin.git

# 2. Keep Roo Code intact, create new packages
mkdir -p packages/orchestrator
mkdir -p packages/agents
mkdir -p config/agents

# 3. Install dependencies
pnpm install

# 4. Run Roo Code to validate everything works
pnpm dev
```

**Deliverable:** Roo Code running locally ✅

---

#### Week 3-6: Infrastructure
```bash
# 1. Set up databases
docker-compose up -d postgres redis qdrant

# 2. Create database schema
packages/db/prisma/schema.prisma:
  - Add agents table
  - Add tasks table
  - Add messages table
  - Add task_dependencies table

# 3. Run migrations
pnpm prisma migrate dev

# 4. Create 6 Qdrant collections
curl -X PUT "http://localhost:6333/collections/codebase_general"
curl -X PUT "http://localhost:6333/collections/codebase_frontend"
curl -X PUT "http://localhost:6333/collections/codebase_backend"
curl -X PUT "http://localhost:6333/collections/codebase_tests"
curl -X PUT "http://localhost:6333/collections/codebase_infra"
curl -X PUT "http://localhost:6333/collections/codebase_docs"
```

**Deliverable:** All databases running ✅

---

#### Week 7-10: EventStream Implementation
```typescript
// packages/orchestrator/src/event-stream.ts
// Translate OpenHands EventStream pattern to TypeScript + Redis

import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'

export class EventStream {
  private redis: Redis
  private prisma: PrismaClient
  private subscribers: Map<string, Set<EventCallback>>

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL)
    this.prisma = new PrismaClient()
    this.subscribers = new Map()
  }

  // Publish event (OpenHands pattern)
  async publish(event: Event): Promise<void> {
    // 1. Persist to PostgreSQL (audit trail)
    await this.prisma.messages.create({
      data: {
        projectId: event.projectId,
        taskId: event.taskId,
        fromAgentId: event.fromAgentId,
        toAgentId: event.toAgentId,
        messageType: event.type,
        content: event.data
      }
    })

    // 2. Broadcast via Redis Pub/Sub
    await this.redis.publish(
      `events:${event.projectId}`,
      JSON.stringify(event)
    )

    // 3. Notify local subscribers
    this.notifySubscribers(event)
  }

  // Subscribe to events (OpenHands pattern)
  subscribe(eventTypes: string[], callback: EventCallback): void {
    eventTypes.forEach(type => {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set())
      }
      this.subscribers.get(type)!.add(callback)
    })
  }

  // Listen to Redis
  async start(): Promise<void> {
    const subscriber = this.redis.duplicate()
    await subscriber.subscribe('events:*')

    subscriber.on('message', (channel, message) => {
      const event = JSON.parse(message) as Event
      this.notifySubscribers(event)
    })
  }

  private notifySubscribers(event: Event): void {
    const callbacks = this.subscribers.get(event.type) || new Set()
    callbacks.forEach(callback => callback(event))
  }
}

// Event types (inspired by OpenHands)
export enum EventType {
  TASK_ASSIGNED = 'task.assigned',
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  AGENT_MESSAGE = 'agent.message',
  CODE_REVIEW_REQUESTED = 'code.review.requested',
  APPROVAL_REQUIRED = 'approval.required'
}

export interface Event {
  id: string
  type: EventType
  projectId: string
  taskId?: string
  fromAgentId?: string
  toAgentId?: string
  data: any
  timestamp: Date
}
```

**Deliverable:** EventStream working with Redis ✅

---

#### Week 11-14: Build First 2 Agents (POC)

**Agent 1: Architect Agent**
```typescript
// packages/agents/src/architect-agent.ts
import { Agent } from './base-agent'
import { EventStream } from '@codekin/orchestrator'

export class ArchitectAgent extends Agent {
  constructor(eventStream: EventStream) {
    super({
      id: 'architect-001',
      type: 'architect',
      name: 'Architect Agent',
      config: {
        roleDefinition: `You are Codekin's Architect Agent...`,
        allowedToolGroups: ['read', 'analyze', 'edit-docs'],
        fileRestrictions: {
          allowedPatterns: ['docs/**/*', 'architecture/**/*'],
          deniedPatterns: ['src/**/*']
        },
        model: 'claude-opus-4'
      },
      eventStream
    })
  }

  async handleTask(task: Task): Promise<TaskResult> {
    // 1. Get relevant context from RAG
    const context = await this.ragSearch(task.description, 'codebase_docs')

    // 2. Call LLM with architect role
    const response = await this.callLLM({
      system: this.config.roleDefinition,
      messages: [
        { role: 'user', content: task.description },
        { role: 'assistant', content: `Context: ${context}` }
      ],
      tools: this.getAllowedTools()
    })

    // 3. Execute tool calls
    const result = await this.executeTools(response.toolCalls)

    // 4. Publish completion event
    await this.eventStream.publish({
      type: 'task.completed',
      taskId: task.id,
      fromAgentId: this.id,
      data: result
    })

    return result
  }
}
```

**Agent 2: Dev Backend Agent**
```typescript
// packages/agents/src/dev-backend-agent.ts
export class DevBackendAgent extends Agent {
  constructor(eventStream: EventStream) {
    super({
      id: 'dev-backend-001',
      type: 'dev-backend',
      name: 'Backend Developer Agent',
      config: {
        roleDefinition: `You are Codekin's Backend Dev Agent...`,
        allowedToolGroups: ['read', 'edit', 'test', 'command'],
        fileRestrictions: {
          allowedPatterns: ['src/backend/**/*', 'src/api/**/*', 'tests/backend/**/*'],
          deniedPatterns: ['src/frontend/**/*']
        },
        model: 'gpt-4-turbo'
      },
      eventStream
    })
  }

  async handleTask(task: Task): Promise<TaskResult> {
    // Similar to ArchitectAgent but with backend specialization
    const context = await this.ragSearch(task.description, 'codebase_backend')
    // ... implementation
  }
}
```

**Deliverable:** 2 agents can execute tasks ✅

---

#### Week 15-16: Dependency Analyzer (Core Innovation)

```typescript
// packages/orchestrator/src/dependency-analyzer.ts
export class DependencyAnalyzer {
  /**
   * Analyze user requirement and build dependency graph
   * This is the KEY to adaptive parallelism
   */
  async analyze(requirement: string): Promise<DependencyGraph> {
    // 1. Parse requirement into tasks using LLM
    const tasks = await this.parseIntoTasks(requirement)

    // 2. Build dependency graph
    const graph = new Map<string, Task>()

    for (const task of tasks) {
      // Ask LLM: "Does this task depend on other tasks?"
      const dependencies = await this.analyzeDependencies(task, tasks)

      graph.set(task.id, {
        ...task,
        dependencies: dependencies.map(d => d.id)
      })
    }

    return { tasks: Array.from(graph.values()), graph }
  }

  /**
   * Find tasks that can run in parallel
   */
  findParallelTasks(graph: DependencyGraph): Task[][] {
    const groups: Task[][] = []
    const completed = new Set<string>()

    while (completed.size < graph.tasks.length) {
      // Find tasks with no pending dependencies
      const ready = graph.tasks.filter(task =>
        !completed.has(task.id) &&
        task.dependencies.every(depId => completed.has(depId))
      )

      if (ready.length === 0) break // Circular dependency!

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
      const taskFiles = this.estimateFilesAffected(task)
      const hasConflict = taskFiles.some(file => usedFiles.has(file))

      if (!hasConflict) {
        result.push(task)
        taskFiles.forEach(file => usedFiles.add(file))
      }
    }

    return result
  }

  /**
   * Estimate which files a task will modify (heuristic)
   */
  private estimateFilesAffected(task: Task): string[] {
    // Use LLM or heuristics to guess file paths
    // Example: "Implement login API" → ["src/api/auth.ts", "tests/auth.test.ts"]
    return [] // Simplified
  }
}
```

**Deliverable:** Dependency analyzer working ✅

---

#### Week 17-18: Orchestrator (Task Scheduler)

```typescript
// packages/orchestrator/src/orchestrator.ts
export class Orchestrator {
  private eventStream: EventStream
  private dependencyAnalyzer: DependencyAnalyzer
  private agents: Map<string, Agent>

  async execute(requirement: string): Promise<void> {
    // 1. Analyze dependencies
    const { tasks, graph } = await this.dependencyAnalyzer.analyze(requirement)

    // 2. Find parallel groups
    const parallelGroups = this.dependencyAnalyzer.findParallelTasks(graph)

    // 3. Execute phase by phase
    for (const group of parallelGroups) {
      // Run tasks in this group IN PARALLEL
      await Promise.all(
        group.map(task => this.executeTask(task))
      )
    }
  }

  private async executeTask(task: Task): Promise<void> {
    // 1. Select agent based on task type
    const agent = this.selectAgent(task)

    // 2. Publish task.assigned event
    await this.eventStream.publish({
      type: 'task.assigned',
      taskId: task.id,
      toAgentId: agent.id,
      data: task
    })

    // 3. Wait for task.completed event
    return new Promise((resolve) => {
      this.eventStream.subscribe(['task.completed'], (event) => {
        if (event.taskId === task.id) {
          resolve()
        }
      })
    })
  }

  private selectAgent(task: Task): Agent {
    // Simple routing for POC
    if (task.type === 'design') return this.agents.get('architect')!
    if (task.type === 'implement') return this.agents.get('dev-backend')!
    throw new Error('Unknown task type')
  }
}
```

**Deliverable:** Orchestrator can run 2 agents in parallel ✅

---

#### Week 19-20: POC Testing & Validation

**Test Case 1: Sequential Tasks (Baseline)**
```typescript
// User requirement: "Design and implement user authentication"
// Expected behavior: Sequential (design → implement)

const requirement = "Design and implement user authentication"
await orchestrator.execute(requirement)

// Expected execution:
// Phase 1: Architect designs (20 min)
// Phase 2: Dev Backend implements (40 min)
// Total: 60 min
```

**Test Case 2: Parallel Tasks**
```typescript
// User requirement: "Design authentication AND implement database migrations"
// Expected behavior: Parallel (independent tasks)

const requirement = "Design authentication system AND implement database migrations"
await orchestrator.execute(requirement)

// Expected execution:
// Phase 1 (PARALLEL):
//   - Architect designs auth (20 min)
//   - Dev Backend does migrations (20 min)
// Total: 20 min (2x speedup!)
```

**Success Criteria:**
- [ ] Test Case 1 completes sequentially ✅
- [ ] Test Case 2 completes in parallel ✅
- [ ] Speedup ≥ 1.5x on Test Case 2 ✅
- [ ] No file conflicts ✅
- [ ] EventStream shows correct message flow ✅

**Exit Criteria:**
- If speedup < 1.3x → Re-evaluate algorithm
- If conflict rate > 20% → Fix coordination
- If agents fail frequently → Improve error handling

---

### Phase 1: All 6 Agents (Months 5-12)

#### Month 5-6: Add PM Agent + QA Agent
```typescript
// packages/agents/src/pm-agent.ts
export class PMAgent extends Agent {
  config = {
    roleDefinition: "You are a Product Manager...",
    allowedToolGroups: ['read', 'analyze', 'document'],
    fileRestrictions: {
      allowedPatterns: ['docs/**/*.md', 'specs/**/*.md'],
      deniedPatterns: ['src/**/*']
    }
  }
}

// packages/agents/src/qa-agent.ts
export class QAAgent extends Agent {
  config = {
    roleDefinition: "You are a QA Engineer...",
    allowedToolGroups: ['read', 'edit-tests', 'test', 'analyze'],
    fileRestrictions: {
      allowedPatterns: ['tests/**/*', '**/*.test.ts'],
      deniedPatterns: ['src/**/*'] // Can read but not edit
    }
  }
}
```

**Test:** PM writes specs → Architect designs → Dev implements → QA tests

---

#### Month 7-8: Add DevOps Agent + Dev Frontend Agent
```typescript
// packages/agents/src/devops-agent.ts
export class DevOpsAgent extends Agent {
  config = {
    roleDefinition: "You are a DevOps Engineer...",
    allowedToolGroups: ['read', 'edit-configs', 'command', 'deploy'],
    fileRestrictions: {
      allowedPatterns: ['.github/**/*', 'Dockerfile', 'k8s/**/*'],
      deniedPatterns: ['src/**/*']
    }
  }
}

// packages/agents/src/dev-frontend-agent.ts
export class DevFrontendAgent extends Agent {
  config = {
    roleDefinition: "You are a Frontend Developer...",
    allowedToolGroups: ['read', 'edit', 'test', 'browser'],
    fileRestrictions: {
      allowedPatterns: ['src/frontend/**/*', 'src/components/**/*'],
      deniedPatterns: ['src/backend/**/*']
    }
  }
}
```

**Test:** Full-stack feature (Backend + Frontend in parallel)

---

#### Month 9-10: Multi-Agent Peer Review
```typescript
// packages/orchestrator/src/peer-review.ts
export class PeerReviewSystem {
  async requestReview(taskResult: TaskResult, authorAgent: Agent): Promise<ReviewResult> {
    // 1. Determine reviewers based on task type
    const reviewers = this.getReviewers(taskResult.taskType, authorAgent)

    // 2. Request reviews in parallel
    const reviews = await Promise.all(
      reviewers.map(reviewer => this.conductReview(reviewer, taskResult))
    )

    // 3. Aggregate results
    const approved = reviews.every(r => r.decision === 'approved')

    return { approved, reviews }
  }

  private getReviewers(taskType: string, author: Agent): Agent[] {
    // Example: Backend code reviewed by Architect + QA
    if (taskType === 'implementation' && author.type === 'dev-backend') {
      return [this.agents.architect, this.agents.qa]
    }
    return []
  }
}
```

---

#### Month 11-12: Web Dashboard + Polish
```typescript
// packages/web/src/components/AgentStatusBoard.tsx
export function AgentStatusBoard() {
  const agents = useAgents()

  return (
    <div className="grid grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          name={agent.name}
          status={agent.status}
          currentTask={agent.currentTask}
          progress={agent.progress}
        />
      ))}
    </div>
  )
}

// packages/web/src/components/TaskFlowVisualization.tsx
export function TaskFlowVisualization() {
  const tasks = useTasks()
  const dependencies = useDependencies()

  return (
    <ReactFlow
      nodes={tasks.map(t => ({ id: t.id, data: t }))}
      edges={dependencies.map(d => ({
        source: d.fromTaskId,
        target: d.toTaskId
      }))}
    />
  )
}
```

**Deliverable:** Full MVP with all 6 agents ✅

---

## Part 3: Component Reuse Breakdown

### Visual Component Map

```
Codekin Architecture
├── FROM ROO CODE (60-70%)
│   ├── packages/core/ (100% reuse)
│   │   ├── src/providers/ → 40+ AI providers ✅
│   │   ├── src/tools/ → 22 developer tools ✅
│   │   ├── src/fs/ → File system operations ✅
│   │   └── src/git/ → Git integration ✅
│   ├── packages/rag/ (90% reuse)
│   │   ├── src/embeddings/ → Embedding pipeline (modify for multi-index)
│   │   ├── src/qdrant/ → Qdrant client ✅
│   │   └── src/search/ → Vector search (add per-agent routing)
│   ├── packages/web/ (70% reuse)
│   │   ├── src/app/ → Next.js structure ✅
│   │   ├── src/components/ → UI components (redesign for multi-agent)
│   │   └── src/api/ → API routes (extend for orchestrator)
│   ├── packages/vscode/ (80% reuse)
│   │   ├── src/extension.ts → VS Code extension ✅
│   │   └── src/ui/ → Extension UI (add agent management)
│   └── packages/db/ (80% reuse)
│       └── prisma/schema.prisma (extend with agents, tasks, messages)
│
├── FROM OPENHANDS (Translate patterns)
│   ├── EventStream pattern → packages/orchestrator/src/event-stream.ts
│   ├── AgentController → packages/orchestrator/src/agent-controller.ts
│   ├── Event types → packages/orchestrator/src/events/
│   └── Sandbox pattern → packages/orchestrator/src/sandbox.ts
│
├── FROM KILO CODE (Config patterns)
│   ├── Agent config structure → config/agents/*.json
│   ├── roleDefinition → Agent system prompts
│   ├── whenToUse → Orchestrator routing logic
│   └── Tool groups → allowedToolGroups
│
├── FROM CLINE (Reference)
│   └── Tool patterns → Validate Roo Code tools are sufficient
│
└── NEW (Codekin-specific) - 30-40%
    ├── packages/orchestrator/
    │   ├── src/dependency-analyzer.ts ⭐ (Core innovation)
    │   ├── src/orchestrator.ts ⭐
    │   ├── src/task-scheduler.ts ⭐
    │   ├── src/conflict-resolver.ts ⭐
    │   └── src/peer-review.ts
    ├── packages/agents/
    │   ├── src/base-agent.ts
    │   ├── src/pm-agent.ts
    │   ├── src/architect-agent.ts
    │   ├── src/dev-frontend-agent.ts
    │   ├── src/dev-backend-agent.ts
    │   ├── src/qa-agent.ts
    │   └── src/devops-agent.ts
    └── config/agents/ (6 agent profiles)
```

---

## Part 4: Risk Mitigation

### Risk 1: Parallelism Doesn't Work
**Mitigation:** Phase 0 validates with 2 agents before building 6
**Exit Criteria:** If speedup < 1.3x after Phase 0, pivot to sequential multi-agent

### Risk 2: Roo Code Changes Break Our Fork
**Mitigation:**
```bash
# Keep Roo Code as upstream, pull updates carefully
git remote add roo-upstream https://github.com/roocode/roo-code.git
git fetch roo-upstream
git merge roo-upstream/main --no-commit
# Review changes before committing
```

### Risk 3: EventStream is Complex
**Mitigation:** Start simple with Redis Pub/Sub, validate with 2 agents before scaling to 6

### Risk 4: Agent Quality Varies
**Mitigation:** Use GPT-4/Claude Opus for all agents in MVP, optimize costs later

### Risk 5: File Conflicts Despite Planning
**Mitigation:** Coarse-grained tasks (feature-level, not task-level), file locking, human escalation

---

## Part 5: Why This Plan Works

### ✅ Maximum Reuse
- 60-70% from Roo Code → Don't reinvent wheel
- Proven tools, RAG, Web UI, VS Code extension
- Well-tested code with 20k+ users

### ✅ Proven Patterns
- EventStream from OpenHands → Validated by research team
- Agent configs from Kilo Code → Validated by 200k users
- Tool abstractions from Cline → Validated by 50k users

### ✅ Incremental Validation
- Phase 0 (2 agents) → Prove parallelism works
- Phase 1 (6 agents) → Scale up gradually
- Each phase has exit criteria

### ✅ Focus on Core Innovation
- Only build what's new (orchestrator, dependency analyzer)
- 30-40% new code vs 60-70% reuse
- Focus engineering time on parallel coordination

### ✅ Realistic Timeline
- 24 months accounts for distributed systems complexity
- Buffer for unexpected issues
- Market window still viable (Kilo Code won't pivot for 12-18 months)

---

## Part 6: Quick Reference - File Structure

```
codekin/
├── packages/
│   ├── core/                 [FROM ROO CODE - 100%]
│   │   ├── src/providers/    40+ AI providers
│   │   ├── src/tools/        22 developer tools
│   │   ├── src/fs/           File operations
│   │   └── src/git/          Git integration
│   │
│   ├── rag/                  [FROM ROO CODE - 90%]
│   │   ├── src/embeddings/   Modify for multi-index
│   │   └── src/search/       Add per-agent routing
│   │
│   ├── orchestrator/         [NEW - Core innovation]
│   │   ├── src/event-stream.ts       (OpenHands pattern)
│   │   ├── src/dependency-analyzer.ts ⭐
│   │   ├── src/orchestrator.ts       ⭐
│   │   ├── src/agent-controller.ts   (OpenHands pattern)
│   │   └── src/peer-review.ts
│   │
│   ├── agents/               [NEW]
│   │   ├── src/base-agent.ts
│   │   ├── src/pm-agent.ts
│   │   ├── src/architect-agent.ts
│   │   ├── src/dev-frontend-agent.ts
│   │   ├── src/dev-backend-agent.ts
│   │   ├── src/qa-agent.ts
│   │   └── src/devops-agent.ts
│   │
│   ├── web/                  [FROM ROO CODE - 70%]
│   │   ├── src/app/          Next.js (keep)
│   │   ├── src/components/   Redesign for multi-agent
│   │   └── src/api/          Extend for orchestrator
│   │
│   ├── vscode/               [FROM ROO CODE - 80%]
│   │   └── src/              Add agent management
│   │
│   └── db/                   [FROM ROO CODE - 80%]
│       └── prisma/           Extend schema
│
├── config/
│   └── agents/               [FROM KILO PATTERN]
│       ├── pm.json
│       ├── architect.json
│       ├── dev-frontend.json
│       ├── dev-backend.json
│       ├── qa.json
│       └── devops.json
│
└── docker-compose.yml        [NEW]
    PostgreSQL + Redis + Qdrant
```

---

## Part 7: Success Metrics

| Phase | Timeline | Success Criteria | Exit Criteria |
|-------|----------|------------------|---------------|
| **Phase 0** | Months 1-4 | 2 agents work in parallel, speedup ≥ 1.3x | If speedup < 1.3x → re-evaluate |
| **Phase 1** | Months 5-12 | 6 agents complete, speedup ≥ 1.5x on 10+ projects | If conflict rate > 30% → major revision |
| **Phase 2** | Months 13-18 | VS Code extension, Docker sandbox, performance optimization | Token cost within 2x sequential |
| **Phase 3** | Months 19-24 | Enterprise features, 1000+ GitHub stars, 50+ contributors | Community adoption validated |

---

## Conclusion

**This plan minimizes failure risk by:**
1. ✅ Reusing 60-70% proven code from Roo Code
2. ✅ Adopting validated patterns from OpenHands (EventStream) and Kilo Code (configs)
3. ✅ Building only the core innovation (orchestrator, dependency analysis) - 30-40% new code
4. ✅ Validating incrementally (2 agents → 6 agents)
5. ✅ Having clear exit criteria at each phase

**This plan maximizes parallel execution by:**
1. ✅ EventStream enables non-blocking agent communication
2. ✅ Dependency analyzer identifies parallelization opportunities
3. ✅ Smart task assignment avoids file conflicts
4. ✅ Per-agent RAG indexes reduce context duplication
5. ✅ Adaptive routing (parallel OR sequential based on dependencies)

**Next Steps:**
1. Review this plan with team
2. Fork Roo Code (Week 1)
3. Set up infrastructure (Weeks 1-6)
4. Implement EventStream (Weeks 7-10)
5. Build 2-agent POC (Weeks 11-14)
6. Validate parallelism works (Weeks 15-20)
7. If validated → Proceed to Phase 1 (all 6 agents)

---

*End of Implementation Plan*
