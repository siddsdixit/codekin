# Three-Way Architecture Comparison
## Cline vs Roo Code vs OpenHands

**Document Version**: 1.0
**Date**: November 15, 2025
**Purpose**: Comprehensive comparison of three leading AI coding assistant architectures

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quick Comparison Matrix](#quick-comparison-matrix)
3. [Architectural Paradigms](#architectural-paradigms)
4. [Detailed Component Comparison](#detailed-component-comparison)
5. [Technology Stack Comparison](#technology-stack-comparison)
6. [Feature Set Comparison](#feature-set-comparison)
7. [Deployment Models](#deployment-models)
8. [Use Case Analysis](#use-case-analysis)
9. [Strengths & Weaknesses](#strengths--weaknesses)
10. [Decision Framework](#decision-framework)

---

## Executive Summary

### The Three Contenders

| Product | **Cline** | **Roo Code** | **OpenHands** |
|---------|-----------|--------------|---------------|
| **Type** | VS Code Extension + CLI | VS Code Extension (Fork of Cline) | Standalone Web App |
| **Architecture** | Embedded Extension | Embedded Extension + Cloud | Client-Server Web App |
| **Primary Language** | TypeScript | TypeScript | Python (Backend) + TypeScript (Frontend) |
| **Open Source** | ✅ Apache 2.0 | ✅ Apache 2.0 | ✅ MIT License |
| **Company** | Cline Bot Inc. | Roo Veterinary Inc. | All Hands AI |
| **Origin** | Original | Fork of Cline | Independent Project |
| **Year Started** | ~2023 | ~2024 (fork) | 2024 (formerly OpenDevin) |

### Key Differentiator Summary

**Cline**: Simplest, local-first, with standalone CLI
**Roo Code**: Feature-rich fork with cloud integration & RAG
**OpenHands**: Web-based platform with Docker sandboxing

---

## Quick Comparison Matrix

### Architecture Type

| Feature | Cline | Roo Code | OpenHands |
|---------|:-----:|:--------:|:---------:|
| **VS Code Extension** | ✅ | ✅ | ⚠️ (Minimal launcher only) |
| **Standalone CLI** | ✅ Go-based | ❌ | ✅ Python CLI |
| **Web Interface** | ❌ | ✅ | ✅ Primary UI |
| **Embedded in Editor** | ✅ | ✅ | ❌ |
| **Separate Server** | ❌ | ⚠️ (Cloud optional) | ✅ Required |
| **Docker Sandboxing** | ❌ | ❌ | ✅ |

### Core Capabilities

| Feature | Cline | Roo Code | OpenHands |
|---------|:-----:|:--------:|:---------:|
| **File Operations** | ✅ 11 tools | ✅ 22 tools | ✅ Advanced |
| **Terminal Commands** | ✅ | ✅ | ✅ Bash + IPython |
| **Browser Automation** | ✅ Puppeteer | ✅ Puppeteer | ✅ Playwright |
| **Code Intelligence** | ⚠️ AST only | ✅ RAG + Vector DB | ✅ Full codebase context |
| **MCP Support** | ✅ | ✅ | ✅ |
| **Git Integration** | ✅ | ✅ | ✅ |

### Advanced Features

| Feature | Cline | Roo Code | OpenHands |
|---------|:-----:|:--------:|:---------:|
| **Cloud Sync** | ❌ | ✅ | ✅ (via cloud) |
| **Remote Control** | ❌ | ✅ Bridge | ✅ Native web |
| **Multi-User** | ❌ | ❌ | ✅ |
| **Semantic Search** | ❌ | ✅ Qdrant | ✅ Built-in |
| **Eval System** | ⚠️ Basic | ✅ Docker + DB | ✅ SWE-Bench |
| **Subtasks** | ❌ | ✅ | ✅ Delegate agents |
| **Custom Modes** | ⚠️ 2 | ✅ 8+ | ✅ Multiple agents |

### AI Provider Support

| Category | Cline | Roo Code | OpenHands |
|----------|:-----:|:--------:|:---------:|
| **Total Providers** | 40+ | 40+ | 100+ (via LiteLLM) |
| **Anthropic Claude** | ✅ | ✅ | ✅ Recommended |
| **OpenAI GPT** | ✅ | ✅ | ✅ |
| **Google Gemini** | ✅ | ✅ | ✅ |
| **Local Models** | ✅ Ollama/LM Studio | ✅ Ollama/LM Studio | ✅ Ollama |
| **Provider Interface** | Custom handlers | Custom handlers | LiteLLM (universal) |

---

## Architectural Paradigms

### 1. Cline: Embedded Extension with gRPC

```
┌─────────────────────────────────────────┐
│         VS CODE PROCESS                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    EXTENSION HOST               │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Webview (React UI)      │  │   │
│  │  └────────┬─────────────────┘  │   │
│  │           │ gRPC-style          │   │
│  │           │ Protocol Buffers    │   │
│  │  ┌────────▼─────────────────┐  │   │
│  │  │  Controller              │  │   │
│  │  │  (Main Orchestrator)     │  │   │
│  │  └────────┬─────────────────┘  │   │
│  │           │                     │   │
│  │  ┌────────▼─────────────────┐  │   │
│  │  │  Task Executor           │  │   │
│  │  │  - Tools (11)            │  │   │
│  │  │  - API Handlers (40+)    │  │   │
│  │  │  - StateManager          │  │   │
│  │  └──────────────────────────┘  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    VS CODE APIs                 │   │
│  │  - File System                  │   │
│  │  - Terminal                     │   │
│  │  - Editor                       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │                    │
    ┌────▼────┐          ┌───▼────┐
    │ AI APIs │          │  MCP   │
    └─────────┘          └────────┘

STANDALONE CLI (Go):
┌─────────────────────┐
│   Terminal          │
│  ┌──────────────┐   │
│  │  Go Binary   │   │
│  │              │   │
│  │ gRPC Client  │   │
│  └──────┬───────┘   │
└─────────┼───────────┘
          │ gRPC
          ▼
    Extension Core
```

**Key Characteristics**:
- **Single-process** (extension host)
- **Direct API access** (VS Code APIs)
- **Local-first** (no cloud required)
- **Type-safe communication** (Protocol Buffers)
- **Dual interface** (Extension + CLI)

---

### 2. Roo Code: Enhanced Extension with Cloud Layer

```
┌──────────────────────────────────────────────────┐
│         VS CODE PROCESS                          │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │    EXTENSION (ClineProvider)               │ │
│  │                                            │ │
│  │  ┌──────────────┐   ┌──────────────────┐ │ │
│  │  │ React UI     │◄─►│  Controller      │ │ │
│  │  └──────────────┘   └────────┬─────────┘ │ │
│  │                               │           │ │
│  │  ┌────────────────────────────▼────────┐ │ │
│  │  │  Task Executor                      │ │ │
│  │  │  - Tools (22)                       │ │ │
│  │  │  - API Handlers (40+)               │ │ │
│  │  │  - RAG System (Qdrant) ⭐          │ │ │
│  │  │  - ContextProxy                     │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │           │                │              │ │
│  │           │ Cloud Service  │              │ │
│  │           ▼                ▼              │ │
│  │  ┌────────────────┐  ┌────────────────┐ │ │
│  │  │  MCP Hub       │  │  Code Index    │ │ │
│  │  │                │  │  (Vector DB)   │ │ │
│  │  └────────────────┘  └────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
         │                    │
         │                    ▼
         │           ┌─────────────────┐
         │           │  Qdrant Vector  │
         │           │   Database      │
         │           └─────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│      CLOUD INFRASTRUCTURE              │
│      (roocode.com)                     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Web Interface ⭐                │ │
│  │  (Next.js)                       │ │
│  └────────┬─────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  Bridge Server (WebSocket) ⭐    │ │
│  │  - Remote Control                │ │
│  │  - Task Execution                │ │
│  └──────────────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  Cloud Services                  │ │
│  │  - Auth (Clerk OAuth)            │ │
│  │  - Settings Sync                 │ │
│  │  - Conversation Sharing          │ │
│  │  - Telemetry (PostHog)           │ │
│  └──────────────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  PostgreSQL + Redis              │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘

EVAL INFRASTRUCTURE ⭐:
┌────────────────────────────────────────┐
│      Docker Compose                    │
│  ┌──────────────────────────────────┐ │
│  │  Web Dashboard (Next.js)         │ │
│  └────────┬─────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  Controller Container            │ │
│  │  (Task Queue: p-queue)           │ │
│  └────────┬─────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  Runner Containers (1-25)        │ │
│  │  - VS Code instances             │ │
│  │  - Isolated eval environments    │ │
│  └──────────────────────────────────┘ │
│           │                            │
│  ┌────────▼─────────────────────────┐ │
│  │  PostgreSQL + Redis + Qdrant     │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Key Characteristics**:
- **Extension-based** (like Cline)
- **Cloud-enhanced** (optional remote features)
- **RAG system** (semantic code search)
- **Monorepo** (5+ shared packages)
- **Hybrid model** (local + cloud)

---

### 3. OpenHands: Client-Server Web Platform

```
┌─────────────────────────────────────────────────┐
│         BROWSER (Frontend)                      │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  React App (Remix SPA)                    │ │
│  │                                           │ │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │ │
│  │  │  Chat   │  │Terminal │  │  Files   │ │ │
│  │  │Interface│  │  View   │  │ Explorer │ │ │
│  │  └─────────┘  └─────────┘  └──────────┘ │ │
│  │                                           │ │
│  │  ┌──────────────────────────────────────┐│ │
│  │  │  Socket.IO Client (WebSocket)        ││ │
│  │  └────────────┬─────────────────────────┘│ │
│  └───────────────┼──────────────────────────┘ │
└─────────────────┼────────────────────────────┘
                  │ WebSocket
                  │ (oh_event, oh_user_action)
                  ▼
┌─────────────────────────────────────────────────┐
│     BACKEND SERVER (Python)                     │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  FastAPI + Socket.IO (ASGI)               │ │
│  │                                           │ │
│  │  ┌──────────────────────────────────────┐│ │
│  │  │  Session Manager                     ││ │
│  │  │  - WebSocket sessions                ││ │
│  │  │  - Conversation management           ││ │
│  │  │  - Multi-user support                ││ │
│  │  └────────────┬─────────────────────────┘│ │
│  │               │                           │ │
│  │  ┌────────────▼─────────────────────────┐│ │
│  │  │  EventStream (Central Hub)           ││ │
│  │  │  - Actions (agent requests)          ││ │
│  │  │  - Observations (environment)        ││ │
│  │  │  - Event store (persistence)         ││ │
│  │  └────┬────────────────┬────────────────┘│ │
│  │       │                │                  │ │
│  │  ┌────▼────────┐  ┌───▼──────────────┐  │ │
│  │  │ Agent       │  │  Runtime         │  │ │
│  │  │ Controller  │  │  Manager         │  │ │
│  │  │             │  │                  │  │ │
│  │  │ - CodeAct   │  │  - Docker (def)  │  │ │
│  │  │ - Browsing  │  │  - Local         │  │ │
│  │  │ - Visual    │  │  - Remote        │  │ │
│  │  │ - Custom    │  │  - Cloud (Modal) │  │ │
│  │  └─────────────┘  └───┬──────────────┘  │ │
│  └───────────────────────┼──────────────────┘ │
└──────────────────────────┼────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────┐
│     DOCKER SANDBOX (Runtime Container)           │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Action Execution Server                   │ │
│  │                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐ │ │
│  │  │  Bash    │  │ IPython  │  │ Browser │ │ │
│  │  │ Executor │  │ Executor │  │(Playwright)│ │
│  │  └──────────┘  └──────────┘  └─────────┘ │ │
│  │                                            │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │  File System (Mounted Workspace)     │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  │                                            │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │  Plugins                             │ │ │
│  │  │  - Jupyter                           │ │ │
│  │  │  - AgentSkills                       │ │ │
│  │  │  - SWE-agent tools                   │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

VS CODE COMPANION EXTENSION (Minimal):
┌────────────────────────────┐
│  VS Code Extension         │
│  ┌──────────────────────┐  │
│  │  Launch CLI Command  │  │
│  │  - Pass file context │  │
│  │  - Open terminal     │  │
│  └──────────┬───────────┘  │
└─────────────┼──────────────┘
              │
              ▼
       uvx openhands
       (Python CLI in terminal)
```

**Key Characteristics**:
- **Client-server** architecture
- **Web-first** (browser UI)
- **Docker sandboxing** (isolated execution)
- **Multi-user** capable
- **Language-separated** (Python backend, TypeScript frontend)

---

## Detailed Component Comparison

### 1. Main Orchestrator

| Component | Cline | Roo Code | OpenHands |
|-----------|-------|----------|-----------|
| **Name** | Controller | ClineProvider | AgentController |
| **Type** | TypeScript class | TypeScript class (extends EventEmitter) | Python class |
| **Tasks** | Single task | Task stack (multi-task) | Single conversation (multi-agent) |
| **State** | StateManager (SQLite + JSON) | ContextProxy (VS Code API) | EventStream + EventStore |
| **Communication** | gRPC-style (protobuf) | Standard postMessage | WebSocket (Socket.IO) |
| **Services** | MCP, Auth, Workspace | MCP, Cloud, Marketplace, Code Index | Runtime, LLM, SessionManager |

### 2. Task/Agent Execution

| Component | Cline | Roo Code | OpenHands |
|-----------|-------|----------|-----------|
| **Execution Unit** | Task | Task | Agent (CodeActAgent) |
| **Loop Pattern** | recursivelyMakeMessages() | initiateTaskLoop() | step() in controller loop |
| **Tool Count** | 11 | 22 | 6 core + MCP |
| **Tool Protocol** | Custom (gRPC-style) | Dual (XML + Native) | Function calling (LiteLLM) |
| **Error Recovery** | Retry + checkpoints | Mistake tracking + repetition detection | Stuck detection + retry |
| **Concurrency** | Mutex (single-threaded) | EventEmitter | asyncio (concurrent) |
| **Subtasks** | ❌ | ✅ new_task tool | ✅ Delegate agents |

### 3. State Management

| Aspect | Cline | Roo Code | OpenHands |
|--------|-------|----------|-----------|
| **Architecture** | Singleton StateManager | Proxy pattern (ContextProxy) | EventStream + Store |
| **Storage** | SQLite + JSON | VS Code GlobalState + JSON | In-memory + file-based |
| **Caching** | In-memory with debounced writes (500ms) | In-memory (Map) | No explicit cache |
| **Persistence** | `.cline/tasks/` + `.vscode/settings.json` | VS Code storage | `.openhands/conversations/` |
| **Watching** | File watcher for external changes | None | None |
| **Secrets** | VS Code SecretStorage (encrypted) | VS Code SecretStorage (encrypted) | config.toml (not encrypted) |

### 4. Tool/Action System

#### Cline: 11 Tools
```
File Ops: read_file, write_to_file, replace_in_file, search_files, list_files
Code: list_code_definition_names
Execution: execute_command, browser_action
MCP: use_mcp_tool
Interaction: ask_followup_question, attempt_completion
```

#### Roo Code: 22 Tools (Expanded)
```
File Ops: read_file, write_to_file, search_files, list_files, apply_diff, insert_content
Code Intelligence: codebase_search (RAG), list_code_definition_names
Execution: execute_command, browser_action
Task Management: new_task, new_task_bridge, switch_mode
MCP: use_mcp_tool, access_mcp_resource
Interaction: ask_followup_question, attempt_completion, fetch_instructions
Misc: update_todo_list, generate_image, run_slash_command
```

#### OpenHands: 6 Core Tools + MCP
```
Core Tools (CodeActAgent):
- execute_bash(command, background)
- execute_ipython_cell(code)
- str_replace_editor(command, path, ...)
- edit_file(path, start_line, end_line, content)
- web_read(url)
- browser(action, ...)

Meta:
- think(thought)
- finish(output)

Plus: Dynamic MCP tools
```

**Winner by Tool Count**: Roo Code (22)
**Winner by Elegance**: OpenHands (unified code execution)

### 5. AI Provider Integration

| Aspect | Cline | Roo Code | OpenHands |
|--------|-------|----------|-----------|
| **Provider Count** | 40+ | 40+ | 100+ |
| **Architecture** | Factory pattern (buildApiHandler) | Factory pattern | LiteLLM (universal proxy) |
| **Interface** | Custom ApiHandler classes | Custom ApiHandler classes | LiteLLM ChatCompletion |
| **Message Format** | OpenAI + Anthropic conversion | OpenAI + Anthropic conversion | LiteLLM handles conversion |
| **Streaming** | Custom ApiStream | Custom ApiStream | LiteLLM stream |
| **Token Counting** | Per-provider tiktoken | Per-provider tiktoken | LiteLLM builtin |
| **Tool Calling** | Manual parsing | Dual protocol (XML + Native) | LiteLLM function calling |

**Winner**: OpenHands (LiteLLM simplifies integration)

### 6. Code Intelligence

| Feature | Cline | Roo Code | OpenHands |
|---------|-------|----------|-----------|
| **AST Parsing** | ✅ tree-sitter | ✅ tree-sitter | ✅ tree-sitter |
| **Symbol Extraction** | ✅ list_code_definition_names | ✅ list_code_definition_names | ✅ Built into agent context |
| **Semantic Search** | ❌ | ✅ RAG with Qdrant | ✅ Full codebase in context |
| **Vector DB** | ❌ | ✅ Qdrant | ❌ (relies on context) |
| **Embeddings** | ❌ | ✅ OpenAI/Ollama/Gemini | ❌ |
| **Context Strategy** | Token budgets | Token budgets + RAG | EventStream history |

**Winner**: Roo Code (explicit RAG system)

### 7. Web Interface

| Feature | Cline | Roo Code | OpenHands |
|---------|-------|----------|-----------|
| **Has Web UI** | ❌ | ✅ | ✅ Primary UI |
| **Technology** | N/A | Next.js 15 | Remix (React Router v7) |
| **Remote Control** | ❌ | ✅ Bridge system | ✅ Native (client-server) |
| **Mobile Access** | ❌ | ✅ Via web | ✅ Via web |
| **Multi-User** | ❌ | ❌ | ✅ |
| **Authentication** | ❌ | ✅ Clerk OAuth | ✅ Optional |
| **Sharing** | ❌ | ✅ Public URLs | ✅ (via cloud deployment) |

**Winner**: OpenHands (web-first design)

---

## Technology Stack Comparison

### Backend/Core

| Technology | Cline | Roo Code | OpenHands |
|------------|-------|----------|-----------|
| **Primary Language** | TypeScript 5.4 | TypeScript 5.8 | Python 3.12 |
| **Runtime** | Node.js 20 | Node.js 20 | Python asyncio |
| **Web Framework** | N/A (extension) | N/A (extension) | FastAPI + Uvicorn |
| **Communication** | Protocol Buffers | postMessage IPC | Socket.IO (WebSocket) |
| **Build Tool** | esbuild | esbuild | Poetry (deps) + npm (frontend) |
| **Package Manager** | npm | pnpm | Poetry + npm |
| **Monorepo** | ❌ | ✅ Turbo | ❌ |

### Frontend

| Technology | Cline | Roo Code | OpenHands |
|------------|-------|----------|-----------|
| **UI Framework** | React 18 | React 18.3.1 | React 19.1.1 |
| **Meta-Framework** | N/A | N/A | Remix (React Router v7) |
| **Build Tool** | Vite 7 | Vite 6.3 | Vite |
| **Styling** | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 + HeroUI |
| **Components** | Custom | Shadcn UI | HeroUI |
| **State** | Context API | Context API | TanStack Query + Zustand |
| **Code Editor** | Custom | Custom | Monaco Editor |
| **Terminal** | VS Code terminal | VS Code terminal | xterm.js |

### Infrastructure

| Technology | Cline | Roo Code | OpenHands |
|------------|-------|----------|-----------|
| **Storage** | SQLite (better-sqlite3) | VS Code APIs | File-based |
| **Vector DB** | ❌ | Qdrant | ❌ |
| **Database** | ❌ | PostgreSQL (evals) | ❌ (optional for enterprise) |
| **Cache** | In-memory Map | In-memory Map | Redis (evals) |
| **Container** | ❌ | Docker (evals only) | Docker (core) |
| **Orchestration** | ❌ | Docker Compose | Docker Compose / K8s |

### LLM Integration

| Technology | Cline | Roo Code | OpenHands |
|------------|-------|----------|-----------|
| **Provider Interface** | Custom handlers | Custom handlers | LiteLLM |
| **SDKs Used** | 40+ individual SDKs | 40+ individual SDKs | LiteLLM (universal) |
| **Token Counting** | tiktoken | tiktoken | LiteLLM builtin |
| **Streaming** | Custom implementation | Custom implementation | LiteLLM async streams |

---

## Feature Set Comparison

### Core Features (All Three Have)

✅ File CRUD operations
✅ Terminal command execution
✅ Browser automation
✅ Git integration
✅ MCP protocol support
✅ Multiple AI provider support
✅ Conversation history
✅ Context window management
✅ Error recovery

### Distinguishing Features

| Feature | Cline | Roo Code | OpenHands |
|---------|:-----:|:--------:|:---------:|
| **Standalone CLI** | ✅ Go | ❌ | ✅ Python |
| **Web Interface** | ❌ | ✅ | ✅ Primary |
| **Docker Sandboxing** | ❌ | ❌ | ✅ |
| **Semantic Code Search** | ❌ | ✅ RAG | ⚠️ Implicit |
| **Cloud Sync** | ❌ | ✅ | ⚠️ Optional |
| **Remote Control** | ❌ | ✅ Bridge | ✅ Native |
| **Multi-User** | ❌ | ❌ | ✅ |
| **Multi-Task** | ❌ | ✅ Stack | ⚠️ Delegate |
| **Custom Modes** | ⚠️ 2 | ✅ 8+ | ✅ Multiple agents |
| **Eval System** | ⚠️ Basic | ✅ Full infra | ✅ SWE-Bench |
| **Protocol Buffers** | ✅ | ❌ | ❌ |
| **Monorepo** | ❌ | ✅ | ❌ |
| **IPython Support** | ❌ | ❌ | ✅ |
| **Conversation Sharing** | ❌ | ✅ | ⚠️ Optional |
| **Image Generation** | ❌ | ✅ | ❌ |
| **Slash Commands** | ❌ | ✅ | ❌ |

---

## Deployment Models

### Cline

**Deployment Options:**
1. **VS Code Extension** (Primary)
   - Install from marketplace
   - Manual VSIX installation
   - Auto-updates via VS Code

2. **Standalone CLI** (Go Binary)
   - npm: `npm install -g @cline/cli`
   - Homebrew: `brew install cline`
   - Manual download (GitHub releases)
   - Platform-specific binaries (macOS, Linux, Windows)

**Requirements:**
- VS Code 1.84+ (for extension)
- Go runtime (for CLI from source)

**Deployment Complexity**: ⭐ (Simple)

---

### Roo Code

**Deployment Options:**
1. **VS Code Extension** (Primary)
   - Install from marketplace: `RooVeterinaryInc.roo-cline`
   - Manual VSIX installation

2. **Optional Cloud Services** (roocode.com)
   - Sign up for account (OAuth via Clerk)
   - Enable cloud sync
   - Use web interface for remote control
   - Bridge system for web → extension

3. **Eval Infrastructure** (Docker Compose)
   ```bash
   cd packages/evals
   pnpm evals  # Starts full stack
   ```

**Requirements:**
- VS Code 1.84+
- Node.js 20+ (for development)
- pnpm (for development)
- Docker (for evals)
- Optional: Qdrant (for code indexing)

**Deployment Complexity**: ⭐⭐ (Moderate - optional services)

---

### OpenHands

**Deployment Options:**
1. **CLI Launcher** (Recommended)
   ```bash
   uvx --python 3.12 openhands serve  # Web UI
   uvx --python 3.12 openhands         # Terminal UI
   ```

2. **Docker**
   ```bash
   docker run -it --rm \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -p 3000:3000 \
     docker.openhands.dev/openhands/openhands:0.61
   ```

3. **Docker Compose** (Full Stack)
   ```bash
   docker-compose up
   ```

4. **Cloud Platforms**
   - **OpenHands Cloud**: app.all-hands.dev (SaaS)
   - **Modal**: Serverless containers
   - **E2B**: Cloud sandbox
   - **Kubernetes**: Enterprise deployment

5. **VS Code Extension** (Minimal Launcher)
   - Only launches CLI in terminal
   - Does NOT run agent in extension

**Requirements:**
- Python 3.12+
- Docker (for sandboxing)
- uv (recommended package manager)
- Node.js 20+ (for frontend development)

**Deployment Complexity**: ⭐⭐⭐ (Complex - multiple components)

---

## Use Case Analysis

### When to Use Cline ✅

**Best For:**
1. **Privacy-Conscious Users**
   - All data stays local
   - No cloud dependencies
   - No telemetry (optional)

2. **CLI-Only Environments**
   - SSH sessions
   - Remote servers
   - Headless systems
   - CI/CD pipelines

3. **Simplicity Lovers**
   - Minimal setup
   - Single VS Code extension
   - No infrastructure to manage

4. **Enterprise/Air-Gapped**
   - No internet required (except AI API)
   - Local-only operation
   - Self-contained deployment

5. **Type Safety Advocates**
   - Protocol Buffers for communication
   - Strong typing across CLI + Extension

**Example Scenarios:**
- Developer working on confidential code
- Server administration via SSH + CLI
- Quick prototyping without setup
- Corporate environment with strict security

---

### When to Use Roo Code ✅

**Best For:**
1. **Large Codebase Developers**
   - Semantic code search (RAG)
   - Vector database for fast lookup
   - Handle 100K+ line projects

2. **Multi-Device Users**
   - Cloud sync across machines
   - Work from desktop + laptop
   - Settings follow you

3. **Team Collaboration**
   - Share conversations publicly
   - Cloud-based features
   - Remote pair programming (bridge)

4. **AI Researchers**
   - Comprehensive eval system
   - Docker-based benchmarking
   - PostgreSQL + Redis infrastructure
   - Multi-language eval support

5. **Remote Workers**
   - Control extension from browser
   - Work from anywhere
   - Mobile monitoring

6. **Feature Maximalists**
   - Want all tools (22 vs 11)
   - Custom modes (8+)
   - Image generation
   - Slash commands

**Example Scenarios:**
- Startup with distributed team
- AI/ML research lab
- Large enterprise codebase navigation
- Remote-first developer
- Benchmarking AI coding models

---

### When to Use OpenHands ✅

**Best For:**
1. **Safety-Critical Work**
   - Docker sandboxing prevents system damage
   - Isolated execution environment
   - No risk to host system

2. **Web-First Users**
   - Prefer browser interface
   - Don't want VS Code
   - Lightweight clients

3. **Team/Multi-User**
   - Multiple users on shared server
   - Collaborative sessions
   - Conversation management

4. **Cloud Deployment**
   - Deploy to cloud providers
   - Scale with Kubernetes
   - SaaS model (OpenHands Cloud)

5. **Python Developers**
   - Backend is Python
   - Easy to extend agents
   - Familiar ecosystem

6. **Complex Workflows**
   - IPython for data science
   - Jupyter integration
   - Multi-agent delegation

7. **Enterprise Production**
   - Managed deployment
   - Authentication/authorization
   - Audit logging
   - Multi-tenancy

**Example Scenarios:**
- Data science team (Jupyter/IPython)
- SaaS platform provider
- Educational institution (multi-user)
- Production environment (safety-first)
- Cloud-native organization

---

## Strengths & Weaknesses

### Cline

#### Strengths ✅
1. **Simplest architecture** - easiest to understand
2. **Standalone CLI** - works without VS Code
3. **Protocol Buffers** - type-safe, versioned
4. **Local-first** - privacy & offline capable
5. **Efficient I/O** - debounced writes
6. **Platform abstraction** - HostProvider pattern
7. **Production-ready** - mature, well-tested
8. **Canonical version** - official, not a fork

#### Weaknesses ❌
1. **No semantic search** - limited for huge codebases
2. **No cloud sync** - settings don't sync
3. **Single task** - serial workflows only
4. **Basic eval system** - minimal testing infra
5. **Fewer tools** - 11 vs 22 (Roo) or many (OpenHands)
6. **No web interface** - local only
7. **No remote control** - can't code from browser

#### Best Use Cases 🎯
- Individual developers
- Privacy-focused users
- CLI-only environments
- Simple, focused workflows

---

### Roo Code

#### Strengths ✅
1. **Most features** - 22 tools, modes, etc.
2. **RAG system** - semantic code search (Qdrant)
3. **Cloud integration** - sync, share, remote control
4. **Bridge system** - control from browser/mobile
5. **Eval infrastructure** - Docker + PostgreSQL + Redis
6. **Monorepo** - well-organized codebase
7. **Rich UI** - Shadcn, Mermaid, KaTeX
8. **Multi-task** - task stack for parallel work
9. **Custom modes** - 8+ pre-configured
10. **Open source web UI** - fully transparent

#### Weaknesses ❌
1. **No standalone CLI** - requires VS Code
2. **Fork complexity** - must track Cline upstream
3. **More dependencies** - Qdrant, optional cloud services
4. **Vendor lock-in** - cloud features tied to roocode.com
5. **Larger bundle** - more code = bigger extension
6. **Setup complexity** - optional services require config

#### Best Use Cases 🎯
- Large codebases (RAG)
- Team collaboration
- Multi-device workflows
- AI researchers (eval system)
- Feature maximalists
- Remote/distributed teams

---

### OpenHands

#### Strengths ✅
1. **Docker sandboxing** - safest execution
2. **Web-first** - no IDE required
3. **Multi-user** - conversation management
4. **Scalable** - cloud deployment ready
5. **LiteLLM** - simplest AI integration (100+ providers)
6. **IPython support** - data science workflows
7. **Multiple agents** - delegate/specialize
8. **Production-ready** - enterprise features
9. **Cloud platforms** - Modal, E2B, etc.
10. **SWE-Bench** - standardized benchmarking

#### Weaknesses ❌
1. **Complex setup** - Docker + Python + Node
2. **Resource heavy** - separate server + container
3. **Language boundary** - Python/TypeScript split
4. **Less editor integration** - not embedded
5. **WebSocket latency** - not as fast as in-process
6. **No VS Code extension** - just a launcher
7. **Configuration complexity** - multiple components

#### Best Use Cases 🎯
- Safety-critical work
- Web-first users
- Multi-user/team deployment
- Cloud-native orgs
- Data science (Jupyter)
- Enterprise production
- SaaS providers

---

## Decision Framework

### Decision Tree

```
START: Which AI coding assistant should I choose?
│
├─ Do you NEED a standalone CLI? (no VS Code)
│  ├─ YES → Cline or OpenHands CLI
│  │  ├─ Want Go binary? → Cline
│  │  └─ Want Python + web UI? → OpenHands
│  │
│  └─ NO → Continue
│
├─ Do you NEED web interface / remote access?
│  ├─ YES → Roo Code or OpenHands
│  │  ├─ Want VS Code extension + cloud? → Roo Code
│  │  └─ Want pure web app? → OpenHands
│  │
│  └─ NO → Continue
│
├─ Do you NEED Docker sandboxing (safety)?
│  ├─ YES → OpenHands (only option)
│  └─ NO → Continue
│
├─ Do you work with LARGE codebases (100K+ lines)?
│  ├─ YES → Roo Code (RAG) or OpenHands (full context)
│  └─ NO → Continue
│
├─ Do you NEED multi-user / team features?
│  ├─ YES → OpenHands (only option)
│  └─ NO → Continue
│
├─ Do you want the SIMPLEST setup?
│  ├─ YES → Cline (install extension, done)
│  └─ NO → Continue
│
├─ Do you NEED comprehensive eval system?
│  ├─ YES → Roo Code or OpenHands
│  │  ├─ Want Docker + DB infra? → Roo Code
│  │  └─ Want SWE-Bench standard? → OpenHands
│  │
│  └─ NO → Continue
│
├─ Do you value MOST features (tools, modes, etc.)?
│  ├─ YES → Roo Code (22 tools, 8+ modes)
│  └─ NO → Continue
│
├─ Do you prioritize PRIVACY / local-only?
│  ├─ YES → Cline (no cloud)
│  └─ NO → Roo Code or OpenHands (cloud-enabled)
│
└─ DEFAULT → All three are excellent, try based on preference:
   ├─ Extension user? → Cline or Roo Code
   ├─ Web user? → OpenHands
   └─ Feature seeker? → Roo Code
```

---

### Comparison Matrix for Common Scenarios

| Scenario | Cline | Roo Code | OpenHands |
|----------|:-----:|:--------:|:---------:|
| Individual dev, small projects | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Individual dev, large codebases | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Team collaboration | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Remote/distributed work | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| CLI-only (SSH, servers) | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| Web-first (no IDE) | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Privacy/air-gapped | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Safety-critical work | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| AI research / evals | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Data science / Jupyter | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Enterprise deployment | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Simplicity / quick start | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## Conclusion

### The Verdict by Category

| Category | Winner | Reason |
|----------|--------|--------|
| **Simplest** | **Cline** | Single extension, no setup |
| **Most Features** | **Roo Code** | 22 tools, RAG, cloud, evals |
| **Safest** | **OpenHands** | Docker sandboxing |
| **Web-First** | **OpenHands** | Native client-server |
| **CLI** | **Cline** | Go binary (fastest) |
| **Team Use** | **OpenHands** | Multi-user architecture |
| **Large Codebases** | **Roo Code** | RAG with Qdrant |
| **Privacy** | **Cline** | Local-only, no cloud |
| **AI Research** | **Tie: Roo Code / OpenHands** | Both have eval systems |
| **Best Architecture** | **Tie** | All three are well-designed |

### Overall Assessment

**There is no single "best" option** - each excels in different scenarios:

1. **Cline**: Best for **individual developers** who want **simplicity** and **privacy**
2. **Roo Code**: Best for **teams** and **large codebases** needing **maximum features**
3. **OpenHands**: Best for **web-first** users and **safety-critical** or **multi-user** scenarios

### Recommendation Strategy

**Try multiple!** Since all three are open source:
- Use **Cline** for personal projects
- Use **Roo Code** for team projects with large codebases
- Use **OpenHands** for production/safety-critical work

Or choose based on your **primary constraint**:
- **Constraint: Must run without VS Code** → Cline CLI or OpenHands
- **Constraint: Need semantic search** → Roo Code (RAG)
- **Constraint: Must sandbox execution** → OpenHands (Docker)
- **Constraint: Simplest possible** → Cline (install extension)
- **Constraint: Web access required** → Roo Code (bridge) or OpenHands (native)

---

## Appendix: Quick Reference

### Installation Commands

```bash
# Cline (VS Code Extension)
code --install-extension saoudrizwan.claude-dev

# Cline (CLI)
npm install -g @cline/cli
# or
brew install cline

# Roo Code (VS Code Extension)
code --install-extension RooVeterinaryInc.roo-cline

# OpenHands (CLI)
uvx --python 3.12 openhands serve

# OpenHands (Docker)
docker run -it --rm -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  docker.openhands.dev/openhands/openhands:0.61
```

### Repository Links

- **Cline**: https://github.com/cline/cline
- **Roo Code**: (Your local copy at `/Users/sdixit/documents/CROO (Cline+Roo)/Roo-Code/`)
- **OpenHands**: https://github.com/All-Hands-AI/OpenHands

### Key Metrics Summary

| Metric | Cline | Roo Code | OpenHands |
|--------|-------|----------|-----------|
| **Stars (approx)** | 10K+ | Fork of Cline | 40K+ |
| **Lines of Code** | ~150K TS | ~50K TS | ~100K Python + 50K TS |
| **Tools** | 11 | 22 | 6 + MCP |
| **AI Providers** | 40+ | 40+ | 100+ |
| **Extension Size** | Unknown | ~27MB | N/A (web app) |
| **License** | Apache 2.0 | Apache 2.0 | MIT |

---

**Document Version**: 1.0
**Author**: Comprehensive Architecture Analysis
**Date**: November 15, 2025
**Status**: Complete
