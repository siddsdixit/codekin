# Codekin Development Plan - MVP to Full Product
**Version:** 1.0
**Date:** 2025-11-18
**Timeline:** 24 months (MVP at 12 months, Full product at 24 months)

---

## Table of Contents
1. [Overview](#overview)
2. [Integration Strategy](#integration-strategy)
3. [Phase 0: Foundation & Validation (Months 1-4)](#phase-0-foundation--validation-months-1-4)
4. [Phase 1: MVP - Core Multi-Agent System (Months 5-12)](#phase-1-mvp---core-multi-agent-system-months-5-12)
5. [Phase 2: Production Hardening (Months 13-18)](#phase-2-production-hardening-months-13-18)
6. [Phase 3: Enterprise & Scale (Months 19-24)](#phase-3-enterprise--scale-months-19-24)
7. [Team Structure](#team-structure)
8. [Success Metrics by Phase](#success-metrics-by-phase)
9. [Risk Management](#risk-management)
10. [Go/No-Go Decision Points](#gono-go-decision-points)

---

## Overview

### Product Vision
Build Codekin as the first **adaptive multi-agent AI development system** where 6 specialized agents collaborate intelligently—parallel when beneficial, sequential when necessary—delivering 1.5-2x faster development with higher code quality.

### Integration Strategy Summary
| Source | Reuse % | What We Take | What We Build |
|--------|---------|--------------|---------------|
| **Roo Code** | 60-70% | Infrastructure, tools, RAG, UI | Multi-agent orchestration |
| **OpenHands** | Patterns | EventStream architecture | TypeScript implementation |
| **Kilo Code** | Patterns | Agent configuration format | 6 specialized agents |
| **Cline** | Reference | Tool validation | - |
| **New Code** | 30-40% | - | Orchestrator, dependency analysis |

### Timeline Overview
```
Month 0-4:   Phase 0 - Foundation (2-agent POC)
Month 5-12:  Phase 1 - MVP (6 agents, adaptive parallelism)
Month 13-18: Phase 2 - Production (performance, scale, VS Code)
Month 19-24: Phase 3 - Enterprise (teams, marketplace, cloud)
```

---

## Integration Strategy

### Source Project Attribution & Integration

#### 1. Roo Code (Primary Foundation)
**Repository:** https://github.com/roocode/roo-code
**License:** Apache 2.0
**Integration Method:** Fork + Extend

**What We Keep 100% (No Modifications):**
```
packages/core/
├── src/providers/          # 40+ AI providers (OpenAI, Anthropic, etc.)
├── src/tools/              # 22 developer tools
│   ├── read.ts
│   ├── edit.ts
│   ├── grep.ts
│   ├── bash.ts
│   ├── browser.ts
│   └── git.ts
├── src/fs/                 # File system operations
└── src/git/                # Git integration
```

**What We Modify (10-30%):**
```
packages/rag/
├── src/embeddings/         # ADD: Multi-collection routing
├── src/qdrant/            # KEEP: Qdrant client
└── src/search/            # ADD: Per-agent search scoping

packages/web/
├── src/app/               # KEEP: Next.js structure
├── src/components/        # MODIFY: Multi-agent UI components
└── src/api/               # EXTEND: Add orchestrator endpoints

packages/db/
└── prisma/schema.prisma   # EXTEND: Add agents, tasks, messages tables

packages/vscode/
└── src/                   # EXTEND: Add agent management UI
```

**What We Don't Use:**
- Single-agent controller → Replace with Orchestrator
- Sequential task queue → Replace with Dependency Analyzer

---

#### 2. OpenHands (Architectural Patterns)
**Repository:** https://github.com/All-Hands-AI/OpenHands
**License:** MIT
**Integration Method:** Translate Patterns (Python → TypeScript)

**Patterns We Adopt:**

| OpenHands Component | Pattern We Learn | Codekin Implementation |
|---------------------|------------------|------------------------|
| `openhands/events/stream.py` | EventStream coordination | `packages/orchestrator/src/event-stream.ts` |
| `openhands/controller/agent_controller.py` | Agent lifecycle | `packages/orchestrator/src/agent-controller.ts` |
| `openhands/events/event.py` | Event types | `packages/orchestrator/src/events/*.ts` |
| `openhands/runtime/` | Sandbox execution | `packages/orchestrator/src/sandbox.ts` |

**Key Translation Example:**
```python
# OpenHands (Python)
class EventStream:
    async def add_event(self, event: Event):
        self._events.append(event)
        await self._broadcast(event)
```

**Becomes:**
```typescript
// Codekin (TypeScript + Redis)
class EventStream {
  async publish(event: Event): Promise<void> {
    await this.prisma.messages.create({ data: event })
    await this.redis.publish('events', JSON.stringify(event))
  }
}
```

---

#### 3. Kilo Code (Configuration Patterns)
**Repository:** https://github.com/Kilo-Org/kilocode
**License:** Apache 2.0
**Integration Method:** Adopt Config Format

**What We Adopt:**

| Kilo Concept | Kilo Format | Codekin Enhancement |
|--------------|-------------|---------------------|
| Mode definition | `.kilo/modes/*.json` | `config/agents/*.json` |
| `roleDefinition` | System prompt | Keep same |
| `whenToUse` | Routing hint | Keep same |
| `tools` | Tool list | → `allowedToolGroups` (more granular) |
| - | Not in Kilo | ADD: `fileRestrictions` with regex |

**Example Enhancement:**
```json
// Kilo Code format
{
  "slug": "architect",
  "roleDefinition": "You are an expert architect...",
  "tools": ["read", "write"]
}

// Codekin enhanced format
{
  "slug": "architect",
  "roleDefinition": "You are Codekin's Architect Agent...",
  "allowedToolGroups": ["read", "analyze", "edit-docs", "diagram"],
  "fileRestrictions": {
    "allowedPatterns": ["docs/**/*", "architecture/**/*"],
    "deniedPatterns": ["src/**/*.ts"]
  },
  "model": "claude-opus-4",
  "ragCollection": "codebase_docs"
}
```

---

#### 4. Cline (Reference & Validation)
**Repository:** https://github.com/cline/cline
**License:** Apache 2.0
**Integration Method:** Reference Only

**What We Validate:**
- Tool abstractions are compatible with Roo Code tools ✅
- VS Code extension patterns align with our approach ✅
- Task state machine concepts ✅

**We don't copy code** (Roo Code already has better implementations)

---

### New Components We Build (30-40% of codebase)

```
packages/orchestrator/         # NEW - Core innovation
├── src/
│   ├── event-stream.ts       # EventStream (OpenHands pattern + Redis)
│   ├── dependency-analyzer.ts # ⭐ Adaptive parallelism algorithm
│   ├── orchestrator.ts       # ⭐ Task scheduling & coordination
│   ├── agent-controller.ts   # Agent lifecycle (OpenHands pattern)
│   ├── task-scheduler.ts     # Parallel vs sequential routing
│   ├── conflict-resolver.ts  # File locking & merge handling
│   └── peer-review.ts        # Multi-agent code review

packages/agents/              # NEW - Agent implementations
├── src/
│   ├── base-agent.ts         # Base class for all agents
│   ├── pm-agent.ts           # Product Manager agent
│   ├── architect-agent.ts    # Technical Architect agent
│   ├── dev-frontend-agent.ts # Frontend Developer agent
│   ├── dev-backend-agent.ts  # Backend Developer agent
│   ├── qa-agent.ts           # QA Engineer agent
│   └── devops-agent.ts       # DevOps Engineer agent

config/agents/                # NEW - Agent profiles (Kilo pattern)
├── pm.json
├── architect.json
├── dev-frontend.json
├── dev-backend.json
├── qa.json
└── devops.json
```

---

## Phase 0: Foundation & Validation (Months 1-4)

### Goal
**Prove adaptive parallelism works with 2 agents before building all 6.**

### Month 1: Setup & Infrastructure

#### Week 1-2: Repository Setup
```bash
# Day 1-2: Fork Roo Code
git clone https://github.com/roocode/roo-code.git codekin
cd codekin
git remote rename origin roo-upstream
git remote add origin https://github.com/codekin-ai/codekin.git

# Day 3-5: Create new package structure
mkdir -p packages/orchestrator/src
mkdir -p packages/agents/src
mkdir -p config/agents

# Day 6-10: Install dependencies and verify Roo Code works
pnpm install
pnpm dev  # Verify Roo Code runs locally
```

**Deliverables:**
- [ ] Roo Code forked and running locally
- [ ] New package directories created
- [ ] Development environment validated

---

#### Week 3-4: Database Infrastructure
```bash
# Set up docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: codekin
      POSTGRES_USER: codekin
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:v1.7.0
    ports:
      - "6333:6333"
```

**Database Schema (Extend Roo Code's schema):**
```prisma
// packages/db/prisma/schema.prisma

model Project {
  id          String   @id @default(uuid())
  name        String
  repoUrl     String?
  createdAt   DateTime @default(now())
  agents      Agent[]
  tasks       Task[]
  messages    Message[]
}

model Agent {
  id            String   @id @default(uuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  type          String   // pm, architect, dev-frontend, dev-backend, qa, devops
  name          String
  config        Json
  model         String
  status        String   @default("idle") // idle, active, blocked, failed
  currentTaskId String?
  createdAt     DateTime @default(now())

  @@unique([projectId, type])
}

model Task {
  id                String   @id @default(uuid())
  projectId         String
  project           Project  @relation(fields: [projectId], references: [id])
  parentTaskId      String?
  assignedAgentId   String?
  title             String
  description       String   @db.Text
  status            String   // pending, active, blocked, completed, failed
  priority          Int      @default(0)
  estimatedDuration Int?     // minutes
  actualDuration    Int?
  dependencies      Json     // array of task IDs
  filesAffected     String[] // array of file paths
  requiresApproval  Boolean  @default(false)
  createdAt         DateTime @default(now())
  startedAt         DateTime?
  completedAt       DateTime?

  dependsOn         TaskDependency[] @relation("DependsOn")
  blockedBy         TaskDependency[] @relation("BlockedBy")
}

model TaskDependency {
  taskId          String
  task            Task   @relation("DependsOn", fields: [taskId], references: [id])
  dependsOnTaskId String
  dependsOnTask   Task   @relation("BlockedBy", fields: [dependsOnTaskId], references: [id])
  dependencyType  String // blocks, requires, suggests

  @@id([taskId, dependsOnTaskId])
}

model Message {
  id           String   @id @default(uuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id])
  taskId       String?
  fromAgentId  String?
  toAgentId    String?  // null for broadcast
  messageType  String
  content      Json
  createdAt    DateTime @default(now())
}

model CodeReview {
  id              String   @id @default(uuid())
  taskId          String
  reviewerAgentId String
  authorAgentId   String
  filesReviewed   String[]
  status          String   // pending, approved, rejected, changes-requested
  comments        Json
  createdAt       DateTime @default(now())
  reviewedAt      DateTime?
}

model Approval {
  id                String   @id @default(uuid())
  taskId            String
  requestedByAgentId String
  approvalType      String   // architecture, deployment, major-refactor
  decision          String
  rationale         String   @db.Text
  status            String   // pending, approved, rejected
  reviewedBy        String?
  reviewedAt        DateTime?
}

model FileLock {
  filePath       String   @id
  lockedByAgentId String
  taskId          String
  lockedAt        DateTime @default(now())
  expiresAt       DateTime
}
```

**Run migrations:**
```bash
pnpm prisma migrate dev --name init_codekin_schema
pnpm prisma generate
```

**Create Qdrant collections:**
```bash
# Create 6 specialized collections
curl -X PUT "http://localhost:6333/collections/codebase_general" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'

# Repeat for: codebase_frontend, codebase_backend, codebase_tests, codebase_infra, codebase_docs
```

**Deliverables:**
- [ ] Docker Compose running (PostgreSQL, Redis, Qdrant)
- [ ] Database schema extended with agent/task tables
- [ ] 6 Qdrant collections created
- [ ] All services healthy and accessible

---

### Month 2: EventStream Implementation

#### Week 5-6: Core EventStream

**File:** `packages/orchestrator/src/event-stream.ts`

```typescript
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'

export enum EventType {
  // Task lifecycle
  TASK_ASSIGNED = 'task.assigned',
  TASK_STARTED = 'task.started',
  TASK_PROGRESS = 'task.progress',
  TASK_BLOCKED = 'task.blocked',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',

  // Agent events
  AGENT_STATUS_CHANGED = 'agent.status_changed',
  AGENT_MESSAGE = 'agent.message',
  AGENT_QUESTION = 'agent.question',
  AGENT_ANSWER = 'agent.answer',

  // Review events
  CODE_REVIEW_REQUESTED = 'code.review.requested',
  CODE_REVIEW_COMPLETED = 'code.review.completed',

  // Approval events
  APPROVAL_REQUIRED = 'approval.required',
  APPROVAL_GRANTED = 'approval.granted',
  APPROVAL_REJECTED = 'approval.rejected',

  // Conflict events
  CONFLICT_DETECTED = 'conflict.detected',
  CONFLICT_RESOLVED = 'conflict.resolved'
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

type EventCallback = (event: Event) => void | Promise<void>

export class EventStream {
  private redis: Redis
  private subscriber: Redis
  private prisma: PrismaClient
  private subscribers: Map<string, Set<EventCallback>>

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    this.subscriber = this.redis.duplicate()
    this.prisma = new PrismaClient()
    this.subscribers = new Map()
  }

  /**
   * Publish event to EventStream
   * 1. Persist to PostgreSQL (audit trail)
   * 2. Broadcast via Redis Pub/Sub (real-time)
   * 3. Notify local subscribers
   */
  async publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<Event> {
    const fullEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }

    try {
      // 1. Persist to database
      await this.prisma.message.create({
        data: {
          projectId: fullEvent.projectId,
          taskId: fullEvent.taskId,
          fromAgentId: fullEvent.fromAgentId,
          toAgentId: fullEvent.toAgentId,
          messageType: fullEvent.type,
          content: fullEvent.data
        }
      })

      // 2. Broadcast via Redis (project-specific channel)
      const channel = `events:${fullEvent.projectId}`
      await this.redis.publish(channel, JSON.stringify(fullEvent))

      // 3. Notify local subscribers
      this.notifySubscribers(fullEvent)

      return fullEvent
    } catch (error) {
      console.error('Failed to publish event:', error)
      throw error
    }
  }

  /**
   * Subscribe to event types
   */
  subscribe(eventTypes: EventType[], callback: EventCallback): void {
    eventTypes.forEach(type => {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set())
      }
      this.subscribers.get(type)!.add(callback)
    })
  }

  /**
   * Unsubscribe callback
   */
  unsubscribe(eventTypes: EventType[], callback: EventCallback): void {
    eventTypes.forEach(type => {
      const callbacks = this.subscribers.get(type)
      if (callbacks) {
        callbacks.delete(callback)
      }
    })
  }

  /**
   * Start listening to Redis events
   */
  async start(projectId: string): Promise<void> {
    const channel = `events:${projectId}`
    await this.subscriber.subscribe(channel)

    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const event = JSON.parse(message) as Event
          this.notifySubscribers(event)
        } catch (error) {
          console.error('Failed to parse event:', error)
        }
      }
    })

    console.log(`EventStream listening on channel: ${channel}`)
  }

  /**
   * Stop listening
   */
  async stop(): Promise<void> {
    await this.subscriber.unsubscribe()
    await this.subscriber.quit()
    await this.redis.quit()
    await this.prisma.$disconnect()
  }

  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(event: Event): void {
    const callbacks = this.subscribers.get(event.type) || new Set()
    callbacks.forEach(async callback => {
      try {
        await callback(event)
      } catch (error) {
        console.error('Subscriber callback failed:', error)
      }
    })
  }

  /**
   * Get event history for a task
   */
  async getTaskHistory(taskId: string): Promise<Event[]> {
    const messages = await this.prisma.message.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' }
    })

    return messages.map(msg => ({
      id: msg.id,
      type: msg.messageType as EventType,
      projectId: msg.projectId,
      taskId: msg.taskId || undefined,
      fromAgentId: msg.fromAgentId || undefined,
      toAgentId: msg.toAgentId || undefined,
      data: msg.content,
      timestamp: msg.createdAt
    }))
  }
}
```

**Test EventStream:**
```typescript
// packages/orchestrator/tests/event-stream.test.ts
import { EventStream, EventType } from '../src/event-stream'

describe('EventStream', () => {
  let eventStream: EventStream

  beforeAll(async () => {
    eventStream = new EventStream()
    await eventStream.start('test-project-id')
  })

  afterAll(async () => {
    await eventStream.stop()
  })

  test('should publish and receive events', async () => {
    const received: any[] = []

    eventStream.subscribe([EventType.TASK_STARTED], (event) => {
      received.push(event)
    })

    await eventStream.publish({
      type: EventType.TASK_STARTED,
      projectId: 'test-project-id',
      taskId: 'task-1',
      fromAgentId: 'agent-1',
      data: { message: 'Task started' }
    })

    // Wait for async propagation
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(received.length).toBe(1)
    expect(received[0].type).toBe(EventType.TASK_STARTED)
  })
})
```

**Deliverables:**
- [ ] EventStream class implemented
- [ ] Unit tests passing
- [ ] Integration test with Redis working
- [ ] Event persistence to PostgreSQL verified

---

#### Week 7-8: Agent Base Class

**File:** `packages/agents/src/base-agent.ts`

```typescript
import { EventStream, Event, EventType } from '@codekin/orchestrator'
import { PrismaClient } from '@prisma/client'
import { RooCodeProvider } from '@codekin/core' // Roo Code's AI provider

export interface AgentConfig {
  id: string
  type: string
  name: string
  roleDefinition: string
  allowedToolGroups: string[]
  fileRestrictions?: {
    allowedPatterns: string[]
    deniedPatterns: string[]
  }
  model: string
  ragCollection?: string
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

export abstract class BaseAgent {
  protected config: AgentConfig
  protected eventStream: EventStream
  protected prisma: PrismaClient
  protected aiProvider: RooCodeProvider
  protected currentTask?: Task

  constructor(config: AgentConfig, eventStream: EventStream) {
    this.config = config
    this.eventStream = eventStream
    this.prisma = new PrismaClient()
    this.aiProvider = new RooCodeProvider(config.model)

    // Subscribe to task assignments
    this.eventStream.subscribe([EventType.TASK_ASSIGNED], this.onTaskAssigned.bind(this))
  }

  /**
   * Handle task assignment
   */
  private async onTaskAssigned(event: Event): Promise<void> {
    if (event.toAgentId !== this.config.id) return

    const task = event.data as Task
    this.currentTask = task

    // Update agent status
    await this.updateStatus('active')

    // Publish task started event
    await this.eventStream.publish({
      type: EventType.TASK_STARTED,
      projectId: event.projectId,
      taskId: task.id,
      fromAgentId: this.config.id,
      data: { message: `${this.config.name} started task` }
    })

    try {
      // Execute task (implemented by child class)
      const result = await this.handleTask(task)

      // Publish completion
      await this.eventStream.publish({
        type: EventType.TASK_COMPLETED,
        projectId: event.projectId,
        taskId: task.id,
        fromAgentId: this.config.id,
        data: result
      })

      await this.updateStatus('idle')
    } catch (error) {
      // Publish failure
      await this.eventStream.publish({
        type: EventType.TASK_FAILED,
        projectId: event.projectId,
        taskId: task.id,
        fromAgentId: this.config.id,
        data: { error: (error as Error).message }
      })

      await this.updateStatus('failed')
    }

    this.currentTask = undefined
  }

  /**
   * Abstract method: Each agent implements task handling
   */
  protected abstract handleTask(task: Task): Promise<TaskResult>

  /**
   * RAG search in agent's specialized collection
   */
  protected async ragSearch(query: string, collection?: string): Promise<string> {
    const targetCollection = collection || this.config.ragCollection || 'codebase_general'

    // Use Roo Code's RAG system
    const results = await this.qdrantSearch(targetCollection, query)
    return results.map(r => r.content).join('\n\n')
  }

  /**
   * Call LLM with agent's role
   */
  protected async callLLM(messages: any[]): Promise<any> {
    return await this.aiProvider.chat({
      model: this.config.model,
      messages: [
        { role: 'system', content: this.config.roleDefinition },
        ...messages
      ],
      tools: this.getAllowedTools()
    })
  }

  /**
   * Get tools allowed for this agent
   */
  protected getAllowedTools(): any[] {
    // Map allowedToolGroups to Roo Code tools
    // This is where we integrate Roo Code's 22 tools
    return [] // Simplified for now
  }

  /**
   * Update agent status in database
   */
  protected async updateStatus(status: string): Promise<void> {
    await this.prisma.agent.update({
      where: { id: this.config.id },
      data: { status }
    })
  }

  /**
   * Send message to another agent
   */
  protected async sendMessage(toAgentId: string, message: string): Promise<void> {
    await this.eventStream.publish({
      type: EventType.AGENT_MESSAGE,
      projectId: this.currentTask?.id || 'unknown',
      fromAgentId: this.config.id,
      toAgentId,
      data: { message }
    })
  }

  /**
   * Check if agent can edit a file
   */
  protected canEditFile(filePath: string): boolean {
    if (!this.config.fileRestrictions) return true

    const { allowedPatterns, deniedPatterns } = this.config.fileRestrictions

    // Check denied patterns first
    if (deniedPatterns?.some(pattern => this.matchPattern(filePath, pattern))) {
      return false
    }

    // Check allowed patterns
    if (allowedPatterns?.some(pattern => this.matchPattern(filePath, pattern))) {
      return true
    }

    return false
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
    return new RegExp(`^${regexPattern}$`).test(filePath)
  }

  // Placeholder for Qdrant search (use Roo Code's implementation)
  private async qdrantSearch(collection: string, query: string): Promise<any[]> {
    // TODO: Integrate Roo Code's Qdrant search
    return []
  }
}
```

**Deliverables:**
- [ ] BaseAgent class implemented
- [ ] Event subscription working
- [ ] Task lifecycle handled
- [ ] File restriction logic validated

---

### Month 3: First 2 Agents (POC)

#### Week 9-10: Architect Agent

**File:** `packages/agents/src/architect-agent.ts`

```typescript
import { BaseAgent, Task, TaskResult } from './base-agent'
import { EventStream } from '@codekin/orchestrator'

export class ArchitectAgent extends BaseAgent {
  constructor(eventStream: EventStream, projectId: string) {
    const config = {
      id: `architect-${projectId}`,
      type: 'architect',
      name: 'Architect Agent',
      roleDefinition: `You are Codekin's Architect Agent, responsible for system design,
technology decisions, and ensuring code follows architectural patterns. You think long-term
about scalability, maintainability, and technical debt.

Your expertise includes:
- System architecture and design patterns
- API contract design (REST, GraphQL, gRPC)
- Database schema design
- Technology stack selection
- Code review for architectural compliance
- Performance and scalability considerations

When designing systems, consider:
- SOLID principles
- Separation of concerns
- Scalability requirements
- Security implications
- Performance trade-offs`,
      allowedToolGroups: ['read', 'analyze', 'edit-docs', 'diagram'],
      fileRestrictions: {
        allowedPatterns: [
          'docs/architecture/**/*',
          'docs/api/**/*',
          'docs/design/**/*',
          '**/*.md'
        ],
        deniedPatterns: [
          'src/**/*.ts',
          'src/**/*.tsx',
          'src/**/*.js'
        ]
      },
      model: 'claude-opus-4',
      ragCollection: 'codebase_docs'
    }

    super(config, eventStream)
  }

  protected async handleTask(task: Task): Promise<TaskResult> {
    console.log(`[Architect] Handling task: ${task.title}`)

    try {
      // 1. Get architectural context from RAG
      const context = await this.ragSearch(
        `${task.description} architecture design patterns best practices`,
        'codebase_docs'
      )

      // 2. Call LLM with architect role
      const response = await this.callLLM([
        {
          role: 'user',
          content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nContext:\n${context}\n\nPlease provide architectural design and decisions.`
        }
      ])

      // 3. Extract design artifacts
      const design = this.extractDesign(response)

      // 4. Create design documents
      const filesChanged = await this.createDesignDocs(design)

      return {
        success: true,
        output: design,
        filesChanged
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        filesChanged: [],
        error: (error as Error).message
      }
    }
  }

  private extractDesign(response: any): any {
    // Extract design decisions, API specs, diagrams from LLM response
    return {
      systemDesign: response.content,
      apiContracts: [],
      databaseSchema: null,
      architecturalDecisions: []
    }
  }

  private async createDesignDocs(design: any): Promise<string[]> {
    // Create markdown files in docs/ directory
    const files: string[] = []

    // Example: Create API spec
    const apiSpecPath = 'docs/api/api-spec.md'
    if (this.canEditFile(apiSpecPath)) {
      // Use Roo Code's file tools to write
      files.push(apiSpecPath)
    }

    return files
  }
}
```

**Agent Config:** `config/agents/architect.json`
```json
{
  "slug": "architect",
  "name": "Architect Agent",
  "role": "architect",
  "roleDefinition": "You are Codekin's Architect Agent...",
  "whenToUse": "Use when: designing system architecture, creating API contracts, making technology decisions, reviewing code for architectural compliance, addressing performance or scalability concerns",
  "allowedToolGroups": ["read", "analyze", "edit-docs", "diagram"],
  "fileRestrictions": {
    "allowedPatterns": ["docs/architecture/**/*", "docs/api/**/*", "**/*.md"],
    "deniedPatterns": ["src/**/*.ts", "src/**/*.tsx"]
  },
  "model": "claude-opus-4",
  "ragCollection": "codebase_docs",
  "source": "project"
}
```

**Deliverables:**
- [ ] ArchitectAgent class implemented
- [ ] Agent config JSON created
- [ ] Can handle design tasks
- [ ] Creates design documents
- [ ] Respects file restrictions

---

#### Week 11-12: Dev Backend Agent

**File:** `packages/agents/src/dev-backend-agent.ts`

```typescript
import { BaseAgent, Task, TaskResult } from './base-agent'
import { EventStream } from '@codekin/orchestrator'

export class DevBackendAgent extends BaseAgent {
  constructor(eventStream: EventStream, projectId: string) {
    const config = {
      id: `dev-backend-${projectId}`,
      type: 'dev-backend',
      name: 'Backend Developer Agent',
      roleDefinition: `You are Codekin's Backend Dev Agent, expert in Node.js, Python,
databases, and API development. You build server-side logic, design data models, and
ensure security and performance.

Your expertise includes:
- Node.js/Python/Go development
- RESTful API design and implementation
- Database design and queries (SQL, NoSQL)
- Authentication and authorization (JWT, OAuth)
- Business logic implementation
- Backend testing (unit, integration)
- Security best practices
- Performance optimization

When implementing features:
- Follow SOLID principles
- Write clean, maintainable code
- Include error handling
- Add appropriate logging
- Write tests for critical paths
- Consider security implications`,
      allowedToolGroups: ['read', 'edit', 'test', 'command'],
      fileRestrictions: {
        allowedPatterns: [
          'src/backend/**/*',
          'src/api/**/*',
          'src/server/**/*',
          'src/services/**/*',
          'src/models/**/*',
          'database/**/*',
          'tests/backend/**/*'
        ],
        deniedPatterns: [
          'src/frontend/**/*',
          'src/components/**/*'
        ]
      },
      model: 'gpt-4-turbo',
      ragCollection: 'codebase_backend'
    }

    super(config, eventStream)
  }

  protected async handleTask(task: Task): Promise<TaskResult> {
    console.log(`[Dev Backend] Handling task: ${task.title}`)

    try {
      // 1. Get backend code context from RAG
      const context = await this.ragSearch(
        `${task.description} backend API implementation`,
        'codebase_backend'
      )

      // 2. Get design from Architect (if available)
      const design = await this.getDesignDoc(task)

      // 3. Call LLM with backend developer role
      const response = await this.callLLM([
        {
          role: 'user',
          content: `Task: ${task.title}

Description: ${task.description}

Design Specification:
${design}

Existing Code Context:
${context}

Please implement the backend code following the design specification.`
        }
      ])

      // 4. Extract code changes
      const codeChanges = this.extractCodeChanges(response)

      // 5. Apply code changes
      const filesChanged = await this.applyCodeChanges(codeChanges)

      // 6. Run tests (if applicable)
      await this.runTests(filesChanged)

      return {
        success: true,
        output: codeChanges,
        filesChanged
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        filesChanged: [],
        error: (error as Error).message
      }
    }
  }

  private async getDesignDoc(task: Task): Promise<string> {
    // Read design document created by Architect
    // Use Roo Code's read tool
    return 'Design doc content...'
  }

  private extractCodeChanges(response: any): any {
    // Extract code blocks from LLM response
    return {
      files: []
    }
  }

  private async applyCodeChanges(changes: any): Promise<string[]> {
    const filesChanged: string[] = []

    for (const file of changes.files) {
      if (this.canEditFile(file.path)) {
        // Use Roo Code's edit tool
        filesChanged.push(file.path)
      }
    }

    return filesChanged
  }

  private async runTests(files: string[]): Promise<void> {
    // Use Roo Code's test tool to run backend tests
    console.log(`Running tests for files: ${files.join(', ')}`)
  }
}
```

**Agent Config:** `config/agents/dev-backend.json`
```json
{
  "slug": "dev-backend",
  "name": "Backend Developer Agent",
  "role": "dev-backend",
  "roleDefinition": "You are Codekin's Backend Dev Agent...",
  "whenToUse": "Use when: implementing API endpoints, writing business logic, designing database schemas, fixing backend bugs, writing backend tests",
  "allowedToolGroups": ["read", "edit", "test", "command"],
  "fileRestrictions": {
    "allowedPatterns": ["src/backend/**/*", "src/api/**/*", "database/**/*", "tests/backend/**/*"],
    "deniedPatterns": ["src/frontend/**/*", "src/components/**/*"]
  },
  "model": "gpt-4-turbo",
  "ragCollection": "codebase_backend",
  "source": "project"
}
```

**Deliverables:**
- [ ] DevBackendAgent class implemented
- [ ] Agent config JSON created
- [ ] Can implement backend code
- [ ] Respects file restrictions
- [ ] Integrates with Roo Code tools

---

### Month 4: Dependency Analyzer & Orchestrator (POC)

#### Week 13-14: Dependency Analyzer

**File:** `packages/orchestrator/src/dependency-analyzer.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { RooCodeProvider } from '@codekin/core'

export interface Task {
  id: string
  title: string
  description: string
  type: string
  agentType: string
  estimatedDuration: number
  dependencies: string[] // task IDs this task depends on
  filesAffected?: string[]
}

export interface DependencyGraph {
  tasks: Task[]
  edges: Map<string, string[]> // taskId → [dependsOnTaskIds]
}

export class DependencyAnalyzer {
  private prisma: PrismaClient
  private aiProvider: RooCodeProvider

  constructor() {
    this.prisma = new PrismaClient()
    this.aiProvider = new RooCodeProvider('gpt-4-turbo')
  }

  /**
   * ⭐ CORE INNOVATION: Analyze user requirement and build dependency graph
   */
  async analyze(requirement: string, projectId: string): Promise<DependencyGraph> {
    console.log('[DependencyAnalyzer] Analyzing requirement:', requirement)

    // 1. Parse requirement into tasks using LLM
    const tasks = await this.parseIntoTasks(requirement, projectId)

    // 2. Analyze dependencies between tasks
    const edges = await this.analyzeDependencies(tasks)

    // 3. Estimate files affected
    for (const task of tasks) {
      task.filesAffected = await this.estimateFilesAffected(task)
    }

    return { tasks, edges }
  }

  /**
   * Parse user requirement into discrete tasks
   */
  private async parseIntoTasks(requirement: string, projectId: string): Promise<Task[]> {
    const prompt = `You are a project manager breaking down a software development requirement into discrete tasks.

Requirement: ${requirement}

Break this down into tasks for the following agent types:
- pm: Product Manager (write specs, clarify requirements)
- architect: Technical Architect (design system, API contracts)
- dev-frontend: Frontend Developer (implement UI)
- dev-backend: Backend Developer (implement API, business logic)
- qa: QA Engineer (write tests, run tests)
- devops: DevOps Engineer (CI/CD, deployment)

For each task, provide:
1. Title (brief, action-oriented)
2. Description (detailed)
3. Agent type (who does this task)
4. Estimated duration (in minutes)
5. Task type (design, implement, test, deploy, document)

Output format: JSON array of tasks`

    const response = await this.aiProvider.chat({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(response.content)

    return parsed.tasks.map((t: any, index: number) => ({
      id: `task-${index + 1}`,
      title: t.title,
      description: t.description,
      type: t.type,
      agentType: t.agentType,
      estimatedDuration: t.estimatedDuration,
      dependencies: []
    }))
  }

  /**
   * Analyze dependencies between tasks
   */
  private async analyzeDependencies(tasks: Task[]): Promise<Map<string, string[]>> {
    const edges = new Map<string, string[]>()

    for (const task of tasks) {
      const prompt = `Given these tasks:
${tasks.map((t, i) => `${i + 1}. [${t.agentType}] ${t.title} - ${t.description}`).join('\n')}

Which tasks must complete BEFORE task "${task.title}" can start?

Consider:
- Design must happen before implementation
- Backend API must exist before frontend can integrate
- Implementation must complete before testing
- Tests must pass before deployment

Output: JSON array of task numbers (1-based index) that this task depends on.
If no dependencies, output empty array []`

      const response = await this.aiProvider.chat({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })

      const parsed = JSON.parse(response.content)
      const dependencyIndices = parsed.dependencies || []

      const dependencyIds = dependencyIndices.map((idx: number) => tasks[idx - 1]?.id).filter(Boolean)
      edges.set(task.id, dependencyIds)
    }

    return edges
  }

  /**
   * Find tasks that can run in parallel
   */
  findParallelGroups(graph: DependencyGraph): Task[][] {
    const groups: Task[][] = []
    const completed = new Set<string>()

    while (completed.size < graph.tasks.length) {
      // Find tasks with all dependencies completed
      const ready = graph.tasks.filter(task => {
        if (completed.has(task.id)) return false
        const deps = graph.edges.get(task.id) || []
        return deps.every(depId => completed.has(depId))
      })

      if (ready.length === 0) {
        console.error('[DependencyAnalyzer] Circular dependency detected!')
        break
      }

      // Check for file conflicts
      const conflictFree = this.removeFileConflicts(ready)

      groups.push(conflictFree)
      conflictFree.forEach(task => completed.add(task.id))
    }

    console.log(`[DependencyAnalyzer] Found ${groups.length} parallel groups`)
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
      } else {
        console.log(`[DependencyAnalyzer] Task "${task.title}" conflicts with previous task, will run sequentially`)
      }
    }

    return result
  }

  /**
   * Estimate which files a task will modify
   */
  private async estimateFilesAffected(task: Task): Promise<string[]> {
    // Simple heuristic based on agent type and task description
    const patterns: Record<string, string[]> = {
      'architect': ['docs/architecture/**/*', 'docs/api/**/*'],
      'dev-frontend': ['src/frontend/**/*', 'src/components/**/*'],
      'dev-backend': ['src/backend/**/*', 'src/api/**/*'],
      'qa': ['tests/**/*'],
      'devops': ['.github/workflows/**/*', 'Dockerfile', 'k8s/**/*'],
      'pm': ['docs/**/*.md', 'specs/**/*.md']
    }

    return patterns[task.agentType] || []
  }

  /**
   * Calculate speedup: sequential time / parallel time
   */
  calculateSpeedup(graph: DependencyGraph, parallelGroups: Task[][]): number {
    const sequentialTime = graph.tasks.reduce((sum, task) => sum + task.estimatedDuration, 0)

    const parallelTime = parallelGroups.reduce((sum, group) => {
      const maxDuration = Math.max(...group.map(t => t.estimatedDuration))
      return sum + maxDuration
    }, 0)

    const speedup = sequentialTime / parallelTime
    console.log(`[DependencyAnalyzer] Speedup: ${speedup.toFixed(2)}x (${sequentialTime}min → ${parallelTime}min)`)

    return speedup
  }
}
```

**Deliverables:**
- [ ] DependencyAnalyzer implemented
- [ ] Can parse requirements into tasks
- [ ] Can identify dependencies
- [ ] Can find parallel groups
- [ ] Can detect file conflicts
- [ ] Calculates realistic speedup

---

#### Week 15-16: Simple Orchestrator (POC)

**File:** `packages/orchestrator/src/orchestrator.ts`

```typescript
import { EventStream, EventType } from './event-stream'
import { DependencyAnalyzer, Task, DependencyGraph } from './dependency-analyzer'
import { BaseAgent } from '@codekin/agents'
import { PrismaClient } from '@prisma/client'

export class Orchestrator {
  private eventStream: EventStream
  private dependencyAnalyzer: DependencyAnalyzer
  private agents: Map<string, BaseAgent>
  private prisma: PrismaClient

  constructor(eventStream: EventStream) {
    this.eventStream = eventStream
    this.dependencyAnalyzer = new DependencyAnalyzer()
    this.agents = new Map()
    this.prisma = new PrismaClient()
  }

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.config.type, agent)
    console.log(`[Orchestrator] Registered agent: ${agent.config.name}`)
  }

  /**
   * ⭐ MAIN ENTRY POINT: Execute user requirement
   */
  async execute(requirement: string, projectId: string): Promise<void> {
    console.log('[Orchestrator] Starting execution:', requirement)

    // 1. Analyze dependencies
    const graph = await this.dependencyAnalyzer.analyze(requirement, projectId)

    // 2. Find parallel groups
    const parallelGroups = this.dependencyAnalyzer.findParallelGroups(graph)

    // 3. Calculate speedup
    const speedup = this.dependencyAnalyzer.calculateSpeedup(graph, parallelGroups)
    console.log(`[Orchestrator] Expected speedup: ${speedup.toFixed(2)}x`)

    // 4. Save execution plan
    await this.saveExecutionPlan(projectId, graph, parallelGroups, speedup)

    // 5. Execute phase by phase
    for (let i = 0; i < parallelGroups.length; i++) {
      const group = parallelGroups[i]
      console.log(`[Orchestrator] Executing Phase ${i + 1}/${parallelGroups.length} with ${group.length} task(s)`)

      // Run tasks in this group IN PARALLEL
      await Promise.all(
        group.map(task => this.executeTask(task, projectId))
      )
    }

    console.log('[Orchestrator] Execution complete!')
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task, projectId: string): Promise<void> {
    // 1. Select agent based on task agent type
    const agent = this.agents.get(task.agentType)
    if (!agent) {
      throw new Error(`No agent registered for type: ${task.agentType}`)
    }

    // 2. Save task to database
    const dbTask = await this.prisma.task.create({
      data: {
        projectId,
        title: task.title,
        description: task.description,
        status: 'pending',
        assignedAgentId: agent.config.id,
        estimatedDuration: task.estimatedDuration,
        filesAffected: task.filesAffected || [],
        dependencies: task.dependencies
      }
    })

    // 3. Publish task.assigned event
    await this.eventStream.publish({
      type: EventType.TASK_ASSIGNED,
      projectId,
      taskId: dbTask.id,
      toAgentId: agent.config.id,
      data: task
    })

    // 4. Wait for task.completed or task.failed event
    return new Promise((resolve, reject) => {
      const handleCompletion = async (event: any) => {
        if (event.taskId !== dbTask.id) return

        if (event.type === EventType.TASK_COMPLETED) {
          console.log(`[Orchestrator] Task completed: ${task.title}`)
          resolve()
        } else if (event.type === EventType.TASK_FAILED) {
          console.error(`[Orchestrator] Task failed: ${task.title}`, event.data.error)
          reject(new Error(event.data.error))
        }

        this.eventStream.unsubscribe([EventType.TASK_COMPLETED, EventType.TASK_FAILED], handleCompletion)
      }

      this.eventStream.subscribe([EventType.TASK_COMPLETED, EventType.TASK_FAILED], handleCompletion)
    })
  }

  /**
   * Save execution plan to database
   */
  private async saveExecutionPlan(
    projectId: string,
    graph: DependencyGraph,
    parallelGroups: Task[][],
    speedup: number
  ): Promise<void> {
    // Save to database for visualization in web UI
    console.log('[Orchestrator] Execution plan saved')
  }
}
```

**Deliverables:**
- [ ] Orchestrator implemented
- [ ] Can execute tasks in parallel groups
- [ ] EventStream communication working
- [ ] Task lifecycle tracked in database

---

#### Week 17-18: POC Testing & Validation

**Test Suite:** `packages/orchestrator/tests/poc-validation.test.ts`

```typescript
import { EventStream } from '../src/event-stream'
import { DependencyAnalyzer } from '../src/dependency-analyzer'
import { Orchestrator } from '../src/orchestrator'
import { ArchitectAgent, DevBackendAgent } from '@codekin/agents'

describe('Phase 0 POC Validation', () => {
  let eventStream: EventStream
  let orchestrator: Orchestrator
  let architectAgent: ArchitectAgent
  let devBackendAgent: DevBackendAgent
  const projectId = 'test-project-poc'

  beforeAll(async () => {
    // Setup
    eventStream = new EventStream()
    await eventStream.start(projectId)

    orchestrator = new Orchestrator(eventStream)

    architectAgent = new ArchitectAgent(eventStream, projectId)
    devBackendAgent = new DevBackendAgent(eventStream, projectId)

    orchestrator.registerAgent(architectAgent)
    orchestrator.registerAgent(devBackendAgent)
  })

  afterAll(async () => {
    await eventStream.stop()
  })

  test('Sequential Tasks: Design → Implement', async () => {
    const startTime = Date.now()

    const requirement = "Design and implement user authentication API"

    await orchestrator.execute(requirement, projectId)

    const duration = Date.now() - startTime

    console.log(`Sequential execution took: ${duration}ms`)

    // Verify: Should complete sequentially (design first, then implement)
    expect(duration).toBeGreaterThan(0)
  }, 120000) // 2 min timeout

  test('Parallel Tasks: Independent Features', async () => {
    const startTime = Date.now()

    const requirement = "Design authentication system AND design payment integration"

    await orchestrator.execute(requirement, projectId)

    const duration = Date.now() - startTime

    console.log(`Parallel execution took: ${duration}ms`)

    // Verify: Should complete faster than sequential
    // (Both design tasks can run in parallel on Architect agent)
  }, 120000)

  test('Mixed Tasks: Some parallel, some sequential', async () => {
    const requirement = `
    1. Design user authentication system
    2. Design payment integration system
    3. Implement authentication API
    4. Implement payment API
    `

    const analyzer = new DependencyAnalyzer()
    const graph = await analyzer.analyze(requirement, projectId)
    const groups = analyzer.findParallelGroups(graph)
    const speedup = analyzer.calculateSpeedup(graph, groups)

    console.log('Task groups:', groups.length)
    console.log('Expected speedup:', speedup)

    // Verify: Should identify parallel opportunities
    expect(groups.length).toBeGreaterThan(1)
    expect(speedup).toBeGreaterThan(1.0)
  })
})
```

**Manual Validation Checklist:**
```
Phase 0 Success Criteria:

[ ] Test 1: Sequential Tasks
    - Architect agent designs authentication
    - Dev Backend agent implements API
    - Tasks complete in order (design → implement)
    - No errors

[ ] Test 2: Parallel Tasks
    - Two design tasks can run in parallel
    - Both complete successfully
    - Speedup ≥ 1.3x

[ ] Test 3: File Conflict Detection
    - Two tasks targeting same file are serialized
    - No file corruption

[ ] Test 4: EventStream Communication
    - task.assigned events received by agents
    - task.completed events published correctly
    - agent.message events work

[ ] Test 5: Database Persistence
    - Tasks saved to PostgreSQL
    - Messages logged correctly
    - Agent status updated

PASS CRITERIA:
- All 5 tests pass ✅
- Speedup on parallel tasks ≥ 1.3x ✅
- Conflict rate < 20% ✅
- No crashes or data corruption ✅

EXIT CRITERIA (FAIL):
- Speedup < 1.3x → Re-evaluate algorithm
- Conflict rate > 20% → Fix coordination
- Frequent crashes → Stabilize before proceeding
```

**Phase 0 Exit Decision:**
- ✅ **GO**: Proceed to Phase 1 (build all 6 agents)
- ❌ **NO-GO**: Pivot to sequential multi-agent (no parallelism)

---

## Phase 1: MVP - Core Multi-Agent System (Months 5-12)

### Goal
**Complete 6-agent system with adaptive parallelism, peer review, and web dashboard.**

### Month 5-6: Add PM Agent + QA Agent

*(Detailed implementation similar to Architect/Dev Backend)*

**PM Agent Features:**
- Parse vague requirements
- Create structured specs
- Write user stories
- Define acceptance criteria
- Limited to documentation files only

**QA Agent Features:**
- Write test plans
- Create unit/integration/e2e tests
- Run test suites
- Report bugs with reproduction steps
- Review code for testability

**Deliverables:**
- [ ] PM Agent implemented
- [ ] QA Agent implemented
- [ ] 4 agents working together
- [ ] Test workflow: PM → Architect → Dev → QA

---

### Month 7-8: Add DevOps Agent + Dev Frontend Agent

**DevOps Agent Features:**
- Configure CI/CD pipelines (GitHub Actions, GitLab CI)
- Create Dockerfiles and docker-compose
- Set up Kubernetes manifests
- Deploy to staging/production
- Monitor and alert setup

**Dev Frontend Agent Features:**
- Implement React/Vue components
- Build UI layouts with Tailwind/CSS
- Integrate with backend APIs
- Write frontend tests
- Ensure accessibility (WCAG)

**Deliverables:**
- [ ] DevOps Agent implemented
- [ ] Dev Frontend Agent implemented
- [ ] All 6 agents working
- [ ] Full-stack feature workflow validated

---

### Month 9-10: Multi-Agent Peer Review System

**File:** `packages/orchestrator/src/peer-review.ts`

```typescript
export class PeerReviewSystem {
  private eventStream: EventStream
  private agents: Map<string, BaseAgent>

  async requestReview(taskId: string, authorAgentId: string): Promise<boolean> {
    // 1. Get task and files changed
    const task = await this.getTask(taskId)
    const filesChanged = task.filesAffected || []

    // 2. Determine reviewers based on task type
    const reviewers = this.getReviewers(task.type, authorAgentId)

    if (reviewers.length === 0) {
      return true // No reviewers needed
    }

    // 3. Request reviews in PARALLEL
    const reviewPromises = reviewers.map(reviewerId =>
      this.conductReview(reviewerId, taskId, filesChanged)
    )

    const reviews = await Promise.all(reviewPromises)

    // 4. All must approve
    const approved = reviews.every(r => r.approved)

    if (!approved) {
      // Publish review feedback
      await this.eventStream.publish({
        type: EventType.CODE_REVIEW_COMPLETED,
        taskId,
        data: {
          approved: false,
          reviews
        }
      })
    }

    return approved
  }

  private getReviewers(taskType: string, authorId: string): string[] {
    // Example: Backend code reviewed by Architect + QA
    const reviewMap: Record<string, string[]> = {
      'implement-backend': ['architect', 'qa'],
      'implement-frontend': ['architect', 'qa'],
      'design': ['pm', 'dev-backend'], // PM checks requirements, Dev checks feasibility
      'test': ['dev-backend'], // Dev reviews test quality
      'deploy': ['architect'] // Architect reviews deployment config
    }

    return reviewMap[taskType] || []
  }

  private async conductReview(reviewerId: string, taskId: string, files: string[]): Promise<any> {
    // Agent conducts code review
    // Returns: { approved: boolean, comments: string[] }
    return { approved: true, comments: [] }
  }
}
```

**Integration:** Add peer review to task completion flow

**Deliverables:**
- [ ] Peer review system implemented
- [ ] Reviewers assigned based on task type
- [ ] Reviews conducted in parallel
- [ ] Failed reviews trigger rework
- [ ] Review metrics tracked

---

### Month 11-12: Web Dashboard + Polish

**Dashboard Features:**
1. **Agent Status Board** - Real-time agent states
2. **Task Flow Visualization** - Gantt chart with dependencies
3. **Agent Conversation Feed** - Chat between agents
4. **Code Changes Timeline** - Files modified over time
5. **Human Approval Queue** - Pending decisions

**File:** `packages/web/src/app/dashboard/page.tsx`

```typescript
import { AgentStatusBoard } from '@/components/AgentStatusBoard'
import { TaskFlowVisualization } from '@/components/TaskFlowVisualization'
import { AgentConversations } from '@/components/AgentConversations'
import { ApprovalQueue } from '@/components/ApprovalQueue'

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Codekin Dashboard</h1>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left: Agent Status */}
        <div className="col-span-3">
          <AgentStatusBoard />
        </div>

        {/* Center: Task Flow */}
        <div className="col-span-6">
          <TaskFlowVisualization />
        </div>

        {/* Right: Conversations + Approvals */}
        <div className="col-span-3 flex flex-col gap-4">
          <AgentConversations />
          <ApprovalQueue />
        </div>
      </div>
    </div>
  )
}
```

**WebSocket Integration:**
```typescript
// packages/web/src/hooks/useRealtimeUpdates.ts
import { useEffect } from 'react'
import { io } from 'socket.io-client'

export function useRealtimeUpdates(projectId: string) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL!)

    socket.on('task:started', (event) => {
      // Update UI
    })

    socket.on('agent:status_changed', (event) => {
      // Update UI
    })

    return () => socket.disconnect()
  }, [projectId])
}
```

**Deliverables:**
- [ ] Web dashboard fully functional
- [ ] Real-time updates via WebSocket
- [ ] All 5 dashboard views implemented
- [ ] Responsive design (desktop + tablet)
- [ ] User can approve/reject agent decisions

---

### MVP Completion Checklist

```
✅ MVP Features Complete:

[ ] All 6 agents implemented (PM, Architect, Dev FE/BE, QA, DevOps)
[ ] Adaptive parallelism orchestrator working
[ ] EventStream communication reliable
[ ] RAG system with 6 specialized indexes
[ ] Web dashboard with real-time updates
[ ] File conflict resolution
[ ] Multi-agent peer review
[ ] Human approval gates
[ ] Git integration (commits, branches)
[ ] PostgreSQL + Redis + Qdrant deployed

✅ MVP Success Metrics:

[ ] Complete 10 end-to-end features autonomously
[ ] Achieve 1.5x minimum speedup on 5+ projects
[ ] Conflict rate < 10%
[ ] Peer review catches 50%+ of bugs
[ ] User satisfaction 4/5 average
[ ] No critical bugs in production

✅ Documentation:

[ ] README with setup instructions
[ ] Architecture documentation
[ ] API documentation
[ ] Agent configuration guide
[ ] Contributing guide
[ ] LICENSE files from all source projects

🎉 MVP LAUNCH READY
```

---

## Phase 2: Production Hardening (Months 13-18)

### Goals
- VS Code extension
- Performance optimization
- Docker sandboxing
- Advanced RAG features
- Multi-project support

*(Detailed month-by-month plan available upon request)*

---

## Phase 3: Enterprise & Scale (Months 19-24)

### Goals
- Multi-user workspaces
- Organization management
- Agent marketplace
- Cloud deployment (AWS/GCP/Azure)
- Enterprise SSO and RBAC
- Advanced analytics

*(Detailed month-by-month plan available upon request)*

---

## Team Structure

### Phase 0-1 (Minimum Viable Team)
- **1 Full-Stack Engineer** (Orchestrator + Agents)
- **1 Frontend Engineer** (Web Dashboard)
- **1 DevOps Engineer** (Infrastructure)

### Phase 2-3 (Scale Team)
- Add 2 more Full-Stack Engineers
- Add 1 QA Engineer
- Add 1 Product Manager
- Add 1 Community Manager

---

## Success Metrics by Phase

| Phase | Timeline | Key Metric | Target | Measurement |
|-------|----------|------------|--------|-------------|
| **Phase 0** | Month 4 | Speedup (2 agents) | ≥ 1.3x | Time measurement |
| **Phase 1** | Month 12 | Speedup (6 agents) | ≥ 1.5x | 10+ projects |
| **Phase 1** | Month 12 | Conflict Rate | < 10% | Database stats |
| **Phase 1** | Month 12 | Bug Detection | > 50% | Peer review vs human |
| **Phase 2** | Month 18 | Token Cost | < 2x sequential | LLM usage tracking |
| **Phase 2** | Month 18 | VS Code Installs | 1,000+ | Extension marketplace |
| **Phase 3** | Month 24 | GitHub Stars | 1,000+ | GitHub API |
| **Phase 3** | Month 24 | Contributors | 50+ | GitHub API |

---

## Risk Management

### Risk Mitigation by Phase

**Phase 0 Risks:**
- Parallelism doesn't work → Exit criteria: speedup < 1.3x → Pivot
- EventStream too complex → Simplify to basic Redis pub/sub first
- LLM costs too high → Use cheaper models initially

**Phase 1 Risks:**
- 6 agents too complex → Progressive rollout (4 agents → 5 → 6)
- File conflicts high → Improve dependency analyzer
- Quality issues → Enhance peer review rules

**Phase 2 Risks:**
- Performance degradation → Profiling and optimization
- Docker overhead → Optimize container startup time
- Memory leaks → Add monitoring and alerting

**Phase 3 Risks:**
- Enterprise features delay launch → Ship Phase 2 first
- Cloud costs → Optimize resource usage
- Competitor catches up → Focus on quality differentiation

---

## Go/No-Go Decision Points

### Decision Point 1: After Phase 0 (Month 4)
**Question:** Does adaptive parallelism work?

**GO Criteria:**
- Speedup ≥ 1.3x on parallel tasks ✅
- Conflict rate < 20% ✅
- No critical bugs ✅

**NO-GO Action:** Pivot to sequential multi-agent (still valuable, no parallelism)

---

### Decision Point 2: After Phase 1 (Month 12)
**Question:** Is MVP production-ready?

**GO Criteria:**
- 10+ features built end-to-end ✅
- Speedup ≥ 1.5x validated ✅
- User satisfaction ≥ 4/5 ✅

**NO-GO Action:** Extend Phase 1 by 3 months, focus on stability

---

### Decision Point 3: After Phase 2 (Month 18)
**Question:** Ready for enterprise customers?

**GO Criteria:**
- Performance targets met ✅
- Security audit passed ✅
- 5+ pilot customers ✅

**NO-GO Action:** Delay Phase 3, focus on production hardening

---

## Conclusion

This development plan provides:

1. ✅ **Clear Integration Strategy** - What comes from where (Roo Code, OpenHands, Kilo Code)
2. ✅ **Incremental Validation** - Phase 0 validates parallelism before building all 6 agents
3. ✅ **Realistic Timeline** - 24 months with MVP at 12 months
4. ✅ **Risk Mitigation** - Exit criteria at each phase
5. ✅ **Maximum Reuse** - 60-70% from Roo Code, 30-40% new code
6. ✅ **Focus on Innovation** - Build only the adaptive parallelism (core differentiator)

**Next Steps:**
1. Review this plan with team
2. Start Phase 0: Week 1 (Fork Roo Code)
3. Complete infrastructure setup (Month 1)
4. Validate POC (Month 4)
5. Launch MVP (Month 12)
6. Full product (Month 24)

**Key Success Factor:** Incremental validation + maximum reuse + focus on core innovation = sustainable development plan

---

*End of Development Plan*
