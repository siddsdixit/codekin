# Roo Code Enhancement Roadmap

> **Generated**: 2025-11-15
> **Status**: Comprehensive codebase indexing completed
> **Purpose**: Strategic enhancement plan across all major systems

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [System Overview](#system-overview)
3. [Enhancement Categories](#enhancement-categories)
4. [Priority Matrix](#priority-matrix)
5. [Detailed Enhancement Plans](#detailed-enhancement-plans)
6. [Implementation Guides](#implementation-guides)
7. [Testing Strategy](#testing-strategy)

---

## Quick Start Guide

### Prerequisites Checklist
- [x] Repository cloned and indexed
- [x] Dependencies installed (pnpm install)
- [x] VSIX built successfully
- [ ] Development environment configured (press F5)
- [ ] Codebase indexing enabled in Roo Code settings
- [ ] Enhancement branch created

### Getting Started
```bash
# Create enhancement branch
git checkout -b enhance/your-enhancement-name

# Run development mode
code .  # Open in VS Code, press F5

# Run tests
pnpm test

# Build and test
pnpm vsix && pnpm install:vsix -y
```

---

## System Overview

### Architecture Layers
```
┌─────────────────────────────────────────────────┐
│             VS Code Extension (src/)            │
│  ┌──────────────┐ ┌──────────────────────────┐  │
│  │  extension.ts│ │  ClineProvider (UI Mgmt) │  │
│  └───────┬──────┘ └───────────┬──────────────┘  │
│          │                    │                  │
│  ┌───────▼──────┐   ┌─────────▼────────────┐   │
│  │   Task.ts    │◄──┤ webviewMessageHandler│   │
│  │ (Agent Loop) │   └──────────────────────┘   │
│  └───────┬──────┘                               │
│          │                                       │
│  ┌───────▼──────────┐  ┌──────────────────┐    │
│  │ buildApiHandler  │  │  Tool System     │    │
│  │ (40+ providers)  │  │  (22 tools)      │    │
│  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Shared Packages │  │   Webview UI     │
│  - types         │  │   (React + TS)   │
│  - cloud         │  │   - ChatView     │
│  - ipc           │  │   - Settings     │
│  - telemetry     │  │   - Components   │
└──────────────────┘  └──────────────────┘
```

### Key Statistics
- **Code Files**: 500+ TypeScript files
- **Providers**: 40+ AI provider integrations
- **Tools**: 22 AI agent tools
- **Packages**: 5 shared workspace packages
- **Custom Modes**: 8+ pre-configured modes
- **Languages Supported**: 5+ (in evals)

---

## Enhancement Categories

### 1. 🐛 Bug Fixes
**Priority**: High
**Effort**: Variable
**Files**: Throughout codebase

**Common Areas**:
- Context window management edge cases
- Tool execution retry logic
- UI state synchronization
- Provider-specific API issues

**Process**:
1. Check [GitHub Issues](https://github.com/RooCodeInc/Roo-Code/issues)
2. Create issue if not exists
3. Comment "Claiming" and get assigned
4. Fix and create PR with tests

### 2. ✨ New Features
**Priority**: High
**Effort**: High
**Alignment**: Must align with roadmap

**Examples**:
- New AI provider integration
- New tool for agent
- Custom mode templates
- Enhanced checkpoint system
- Multi-file diff improvements

### 3. 🎨 UI/UX Improvements
**Priority**: Medium
**Effort**: Medium
**Files**: `webview-ui/src/`

**Opportunities**:
- Message display optimization
- Settings organization
- Keyboard shortcuts
- Accessibility improvements
- Dark/light theme refinements

### 4. 🤖 AI Agent Enhancements
**Priority**: High
**Effort**: Medium-High
**Files**: `src/core/prompts/`, `src/core/task/`

**Focus Areas**:
- Prompt engineering improvements
- Context management optimization
- Tool selection intelligence
- Error recovery strategies
- Multi-step planning

### 5. 📊 Evals & Testing
**Priority**: Medium
**Effort**: Medium
**Files**: `packages/evals/`

**Opportunities**:
- New programming languages
- Additional test exercises
- Metrics improvements
- Performance optimizations
- Coverage expansion

### 6. 🔧 Developer Tooling
**Priority**: Medium
**Effort**: Low-Medium
**Files**: Build scripts, configs

**Focus**:
- Debug utilities
- Testing infrastructure
- Build optimization
- Documentation generation
- Development workflows

---

## Priority Matrix

### High Priority + Low Effort (Quick Wins)
1. **Improve tool descriptions** - Better agent behavior
2. **Add keyboard shortcuts** - Better UX
3. **Optimize bundle size** - Faster loading
4. **Add debug logging** - Easier troubleshooting
5. **Document custom modes** - Better onboarding

### High Priority + High Effort (Strategic)
1. **New provider integration** - Expand model support
2. **Advanced context management** - Better token efficiency
3. **Multi-file refactoring tool** - Major capability
4. **Real-time collaboration** - Cloud feature
5. **Enhanced evals coverage** - Better benchmarking

### Medium Priority + Low Effort (Nice to Have)
1. **UI polish** - Better visual experience
2. **Error messages** - Better clarity
3. **Settings organization** - Easier configuration
4. **Telemetry events** - Better analytics
5. **Type safety** - Fewer bugs

### Low Priority + High Effort (Future)
1. **Architecture refactoring** - Better maintainability
2. **Performance rewrite** - Marginal gains
3. **Alternative UI framework** - Major migration
4. **Complete redesign** - Significant investment

---

## Detailed Enhancement Plans

### Plan 1: Add a New AI Tool

**Goal**: Create a new tool that the AI agent can use
**Effort**: Low-Medium (4-8 hours)
**Impact**: High - Expands agent capabilities
**Priority**: High

#### Example: Create a "analyze_dependencies" Tool

**Step 1: Define Native Schema**
```typescript
// File: src/core/prompts/tools/native-tools/analyze_dependencies.ts
import type OpenAI from "openai"

export const analyze_dependencies = {
  type: "function",
  function: {
    name: "analyze_dependencies",
    description: "Analyze project dependencies and find outdated, unused, or vulnerable packages",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        package_file: {
          type: "string",
          description: "Path to package.json, requirements.txt, Cargo.toml, etc.",
        },
        check_type: {
          type: "string",
          enum: ["outdated", "unused", "vulnerabilities", "all"],
          description: "Type of dependency analysis to perform"
        }
      },
      required: ["package_file"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
```

**Step 2: Create XML Description**
```typescript
// File: src/core/prompts/tools/analyze-dependencies.ts
import { ToolArgs } from "./types"

export function getAnalyzeDependenciesDescription(args: ToolArgs): string {
  return `## analyze_dependencies
Description: Analyze project dependencies to find outdated packages, unused dependencies, or security vulnerabilities.
Parameters:
- package_file: Path to the package manifest (package.json, requirements.txt, etc.)
- check_type: Type of analysis - "outdated", "unused", "vulnerabilities", or "all"

Usage:
<analyze_dependencies>
<args>
  <package_file>package.json</package_file>
  <check_type>all</check_type>
</args>
</analyze_dependencies>

This tool will:
1. Parse the package file
2. Check for outdated versions (using npm outdated, pip list --outdated, etc.)
3. Identify unused dependencies (static analysis)
4. Check for known vulnerabilities (using npm audit, safety, etc.)

Returns a detailed report with recommendations.`
}
```

**Step 3: Implement Tool**
```typescript
// File: src/core/tools/AnalyzeDependenciesTool.ts
import { BaseTool } from "./BaseTool"
import type { ToolName, NativeToolArgs } from "@roo-code/types"
import { Task } from "../task/Task"
import { ToolCallbacks } from "./BaseTool"
import * as vscode from "vscode"
import * as path from "path"

export class AnalyzeDependenciesTool extends BaseTool<"analyze_dependencies"> {
  readonly name: ToolName = "analyze_dependencies"

  parseLegacy(params: Partial<Record<string, string>>): NativeToolArgs["analyze_dependencies"] {
    return {
      package_file: params.package_file || "package.json",
      check_type: (params.check_type as any) || "all",
    }
  }

  async execute(
    params: NativeToolArgs["analyze_dependencies"],
    task: Task,
    callbacks: ToolCallbacks
  ): Promise<void> {
    const { package_file, check_type } = params
    const cwd = task.cwd
    const fullPath = path.resolve(cwd, package_file)

    try {
      // Determine package manager
      const packageManager = this.detectPackageManager(package_file)

      let results: string[] = []

      // Check outdated packages
      if (check_type === "outdated" || check_type === "all") {
        const outdated = await this.checkOutdated(packageManager, cwd)
        results.push(`\n## Outdated Packages\n${outdated}`)
      }

      // Check for vulnerabilities
      if (check_type === "vulnerabilities" || check_type === "all") {
        const vulns = await this.checkVulnerabilities(packageManager, cwd)
        results.push(`\n## Security Vulnerabilities\n${vulns}`)
      }

      // Check for unused dependencies
      if (check_type === "unused" || check_type === "all") {
        const unused = await this.checkUnused(packageManager, cwd)
        results.push(`\n## Unused Dependencies\n${unused}`)
      }

      const output = results.join("\n\n")
      callbacks.pushToolResult(`<analysis>\n${output}\n</analysis>`)

    } catch (error) {
      await callbacks.handleError("analyze_dependencies", error)
      callbacks.pushToolResult(`<error>Failed to analyze dependencies: ${error.message}</error>`)
    }
  }

  private detectPackageManager(packageFile: string): string {
    if (packageFile.includes("package.json")) return "npm"
    if (packageFile.includes("requirements.txt")) return "pip"
    if (packageFile.includes("Cargo.toml")) return "cargo"
    return "unknown"
  }

  private async checkOutdated(pm: string, cwd: string): Promise<string> {
    const commands = {
      npm: "npm outdated --json",
      pip: "pip list --outdated --format json",
      cargo: "cargo outdated --format json"
    }

    // Execute command and parse results
    // ... implementation
    return "Outdated packages: ..."
  }

  private async checkVulnerabilities(pm: string, cwd: string): Promise<string> {
    const commands = {
      npm: "npm audit --json",
      pip: "safety check --json",
      cargo: "cargo audit --json"
    }

    // ... implementation
    return "Vulnerabilities: ..."
  }

  private async checkUnused(pm: string, cwd: string): Promise<string> {
    // Use static analysis or depcheck
    // ... implementation
    return "Unused dependencies: ..."
  }
}
```

**Step 4: Register Tool**
```typescript
// In src/core/prompts/tools/index.ts, add to toolDescriptionMap:
const toolDescriptionMap: Record<string, (args: ToolArgs) => string | undefined> = {
  // ... existing tools
  analyze_dependencies: (args) => getAnalyzeDependenciesDescription(args),
}

// In src/core/prompts/tools/native-tools/index.ts:
import { analyze_dependencies } from "./analyze_dependencies"

export const nativeTools = [
  // ... existing tools
  analyze_dependencies,
] satisfies OpenAI.Chat.ChatCompletionTool[]
```

**Step 5: Add to Tool Groups**
```typescript
// In src/shared/tools.ts:
export const TOOL_GROUPS = {
  // ... existing groups
  code: {
    tools: [
      // ... existing tools
      "analyze_dependencies",
    ]
  }
}
```

**Step 6: Write Tests**
```typescript
// File: src/core/tools/__tests__/AnalyzeDependenciesTool.test.ts
import { AnalyzeDependenciesTool } from "../AnalyzeDependenciesTool"
import { Task } from "../../task/Task"

describe("AnalyzeDependenciesTool", () => {
  it("should detect npm package manager", () => {
    const tool = new AnalyzeDependenciesTool()
    // ... test implementation
  })

  it("should analyze outdated packages", async () => {
    // ... test implementation
  })

  it("should handle errors gracefully", async () => {
    // ... test implementation
  })
})
```

---

### Plan 2: Improve Prompt Engineering

**Goal**: Enhance AI agent behavior through better prompts
**Effort**: Low-Medium (2-6 hours)
**Impact**: High - Better task completion
**Priority**: High

#### Enhancement Areas

**1. Context-Aware Tool Selection**

```typescript
// File: src/core/prompts/sections/tool-use.ts

// Add intelligent tool filtering based on task context
export function getContextualToolGuidance(
  taskDescription?: string,
  fileContext?: string[]
): string {
  const suggestions: string[] = []

  if (taskDescription?.toLowerCase().includes("refactor")) {
    suggestions.push(
      "For refactoring tasks, use this pattern:",
      "1. search_files to find all usages",
      "2. list_code_definition_names to understand structure",
      "3. codebase_search for semantic references",
      "4. apply_diff for systematic changes"
    )
  }

  if (taskDescription?.toLowerCase().includes("debug")) {
    suggestions.push(
      "For debugging tasks:",
      "1. execute_command to run tests/reproduce issue",
      "2. read_file to examine error sources",
      "3. search_files to find related code",
      "4. apply_diff to implement fixes"
    )
  }

  if (fileContext?.some(f => f.endsWith(".test.ts") || f.endsWith(".spec.ts"))) {
    suggestions.push("Test files detected - consider using execute_command to run tests")
  }

  return suggestions.length > 0
    ? `\n## Task-Specific Guidance\n${suggestions.join("\n")}\n`
    : ""
}
```

**2. Enhanced Error Recovery**

```typescript
// File: src/core/prompts/responses.ts

// Add better error handling prompts
export const errorRecoveryPrompt = `
When you encounter an error:

1. **Analyze the Error**:
   - Read the full error message carefully
   - Identify the root cause (syntax, logic, dependency, etc.)
   - Check if it's a transient error or persistent issue

2. **Common Error Patterns**:
   - File not found → Verify path, use list_files to check
   - Permission denied → Explain why, suggest alternatives
   - Command failed → Check exit code, read stderr
   - API rate limit → Acknowledge, suggest retry strategy

3. **Recovery Strategy**:
   - Don't repeat the exact same action
   - If a tool fails 2+ times, try a different approach
   - Ask user for clarification if stuck
   - Use ask_followup_question for ambiguous situations

4. **Progress Preservation**:
   - Save completed work before risky operations
   - Document what worked vs what failed
   - Provide clear status updates to user
`
```

**3. Multi-Step Planning**

```typescript
// File: src/core/prompts/sections/objective.ts

export function getEnhancedObjectiveSection(
  objective: string,
  experiments?: Record<string, boolean>
): string {
  let section = `# OBJECTIVE\n\n${objective}\n\n`

  if (experiments?.enhancedPlanning) {
    section += `
## Planning Guidelines

Before starting implementation:
1. Break down the objective into logical steps
2. Identify dependencies between steps
3. Determine required tools for each step
4. Estimate complexity (simple/medium/complex)

For complex objectives:
- Create a high-level plan first
- Update todo list with steps
- Execute step-by-step
- Verify each step before proceeding

Use new_task for well-defined sub-objectives that can be completed independently.
`
  }

  return section
}
```

---

### Plan 3: UI/UX Enhancement

**Goal**: Improve webview interface usability
**Effort**: Low-Medium (3-8 hours)
**Impact**: Medium - Better user experience
**Priority**: Medium

#### Example: Add Command Palette for Quick Actions

**Step 1: Create Command Palette Component**

```typescript
// File: webview-ui/src/components/CommandPalette.tsx
import React, { useState, useEffect } from "react"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { useExtensionState } from "../context/ExtensionStateContext"

interface CommandAction {
  id: string
  label: string
  description?: string
  shortcut?: string
  action: () => void
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { clineMessages, setMode, mode } = useExtensionState()

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const actions: CommandAction[] = [
    {
      id: "new-task",
      label: "Start New Task",
      description: "Begin a new conversation",
      shortcut: "⌘N",
      action: () => {
        vscode.postMessage({ type: "clearTask" })
        setOpen(false)
      },
      category: "Tasks"
    },
    {
      id: "switch-mode",
      label: "Switch Mode",
      description: "Change the current mode",
      shortcut: "⌘.",
      action: () => {
        // Open mode selector
        setOpen(false)
      },
      category: "Navigation"
    },
    {
      id: "toggle-settings",
      label: "Open Settings",
      description: "Configure Roo Code",
      action: () => {
        vscode.postMessage({ type: "openSettings" })
        setOpen(false)
      },
      category: "Navigation"
    },
    {
      id: "export-chat",
      label: "Export Chat",
      description: "Save conversation to markdown",
      action: () => {
        vscode.postMessage({ type: "exportCurrentChatToMarkdown" })
        setOpen(false)
      },
      category: "File"
    },
    // ... more actions
  ]

  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = []
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, CommandAction[]>)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedActions).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={action.action}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div>{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    )}
                  </div>
                  {action.shortcut && (
                    <kbd className="text-xs">{action.shortcut}</kbd>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
```

**Step 2: Integrate into App**

```typescript
// File: webview-ui/src/App.tsx
import { CommandPalette } from "./components/CommandPalette"

export function App() {
  // ... existing code

  return (
    <div>
      <CommandPalette />
      {/* ... rest of app */}
    </div>
  )
}
```

---

### Plan 4: Evals Enhancement

**Goal**: Add new programming language to evaluation suite
**Effort**: Medium-High (8-16 hours)
**Impact**: High - Better benchmarking coverage
**Priority**: Medium

#### Example: Add TypeScript Support to Evals

**Step 1: Create Exercise Structure**

```bash
mkdir -p exercises/typescript/{basic,intermediate,advanced}
```

**Step 2: Add Test Exercises**

```typescript
// File: exercises/typescript/basic/fizzbuzz/solution.ts
export function fizzbuzz(n: number): string[] {
  const result: string[] = []
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) result.push("FizzBuzz")
    else if (i % 3 === 0) result.push("Fizz")
    else if (i % 5 === 0) result.push("Buzz")
    else result.push(i.toString())
  }
  return result
}
```

```typescript
// File: exercises/typescript/basic/fizzbuzz/test.spec.ts
import { fizzbuzz } from "./solution"

describe("FizzBuzz", () => {
  it("should return correct output for n=15", () => {
    const expected = [
      "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz",
      "11", "Fizz", "13", "14", "FizzBuzz"
    ]
    expect(fizzbuzz(15)).toEqual(expected)
  })

  it("should handle n=1", () => {
    expect(fizzbuzz(1)).toEqual(["1"])
  })

  // ... more tests
})
```

**Step 3: Add Exercise Metadata**

```typescript
// File: packages/evals/src/exercises/typescript.ts
import { Exercise } from "./types"

export const typescriptExercises: Exercise[] = [
  {
    language: "typescript",
    difficulty: "basic",
    name: "fizzbuzz",
    description: "Implement the classic FizzBuzz problem",
    setupInstructions: "npm install --save-dev jest @types/jest ts-jest",
    testCommand: "npm test",
    prompt: `Implement a function 'fizzbuzz(n: number): string[]' that returns an array of strings...`,
  },
  {
    language: "typescript",
    difficulty: "intermediate",
    name: "linked-list",
    description: "Implement a linked list with TypeScript generics",
    // ... more metadata
  },
  // ... more exercises
]
```

**Step 4: Update Database Schema**

```typescript
// File: packages/evals/src/db/schema.ts
// Add TypeScript to language enum if not present
export const tasks = pgTable("tasks", {
  // ... existing fields
  language: text("language").notNull(), // Ensure "typescript" is valid
})
```

**Step 5: Update Runner Container**

```dockerfile
# File: packages/evals/Dockerfile.runner
# Add TypeScript/Node.js runtime
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g typescript ts-node jest
```

**Step 6: Add Exercise Discovery**

```typescript
// File: packages/evals/src/exercises/index.ts
import { typescriptExercises } from "./typescript"

export const allExercises = [
  ...pythonExercises,
  ...goExercises,
  ...typescriptExercises, // Add here
  // ... other languages
]
```

---

### Plan 5: Developer Tooling Enhancement

**Goal**: Improve development experience
**Effort**: Low (2-4 hours per improvement)
**Impact**: Medium - Faster development
**Priority**: Medium

#### Example: Add Debug Logging Utility

**Step 1: Create Logger**

```typescript
// File: src/utils/logger.ts
import * as vscode from "vscode"

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger
  private outputChannel: vscode.OutputChannel
  private level: LogLevel

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Roo Code Debug")
    this.level = process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) return

    const timestamp = new Date().toISOString()
    const levelStr = LogLevel[level]
    const dataStr = data ? ` | ${JSON.stringify(data, null, 2)}` : ""

    this.outputChannel.appendLine(`[${timestamp}] [${levelStr}] ${message}${dataStr}`)
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error
    this.log(LogLevel.ERROR, message, errorData)
  }

  show(): void {
    this.outputChannel.show()
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }
}

// Singleton export
export const logger = Logger.getInstance()
```

**Step 2: Use Throughout Codebase**

```typescript
// Example usage in Task.ts
import { logger } from "../../utils/logger"

class Task {
  async executeStep(): Promise<void> {
    logger.debug("Starting task execution", {
      taskId: this.taskId,
      mode: this.mode
    })

    try {
      // ... execution logic
      logger.info("Task completed successfully", {
        tokensUsed: this.totalTokens
      })
    } catch (error) {
      logger.error("Task execution failed", error)
      throw error
    }
  }
}
```

**Step 3: Add Settings Control**

```typescript
// Add to package.json settings
{
  "rooCode.debug.logLevel": {
    "type": "string",
    "enum": ["debug", "info", "warn", "error"],
    "default": "info",
    "description": "Logging verbosity level"
  }
}
```

---

## Implementation Guides

### Guide 1: Working with the Monorepo

**Turborepo Commands**:
```bash
# Run command in all packages
pnpm turbo run build

# Run in specific package
pnpm --filter @roo-code/types build

# Run with dependencies
pnpm turbo run build --filter=@roo-code/types...

# Clean everything
pnpm clean
```

**Package Dependencies**:
- Always update `package.json` when adding cross-package imports
- Use workspace protocol: `"@roo-code/types": "workspace:^"`
- Run `pnpm install` after dependency changes

### Guide 2: Testing Strategy

**Unit Tests** (`pnpm test`):
- Use Vitest for all tests
- Test files: `__tests__/*.test.ts`
- Mock VS Code API: `src/__mocks__/vscode.ts`

**Integration Tests** (`apps/vscode-e2e/`):
- Uses Mocha + VS Code Test framework
- Run full extension with API
- Test real task flows

**Manual Testing**:
1. Press F5 to launch Extension Development Host
2. Open test workspace
3. Test your feature
4. Check VS Code Debug Console for logs

### Guide 3: Contributing to Upstream

**Required Steps**:
1. Create/find GitHub issue
2. Comment "Claiming" and get assigned by Hannes Rudolph
3. Create branch: `fix/123-description` or `feature/description`
4. Implement with tests
5. Follow PR template
6. Link to issue in PR description

**PR Checklist**:
- [ ] Tests pass (`pnpm test`)
- [ ] Types check (`pnpm check-types`)
- [ ] Linted (`pnpm lint`)
- [ ] Formatted (`pnpm format`)
- [ ] Aligned with roadmap (reliability, UX, or agent performance)
- [ ] Issue linked in PR

---

## Testing Strategy

### Automated Testing

**Unit Test Coverage Areas**:
- Tool parameter parsing
- Prompt section generation
- Context management logic
- Provider API wrappers
- Message formatting
- State management

**Integration Test Scenarios**:
- Complete task flows
- Mode switching
- Tool execution with approval
- API error handling
- Context window overflow
- Multi-step conversations

### Manual Testing Checklist

**Before Release**:
- [ ] Test with at least 3 different providers (Anthropic, OpenAI, other)
- [ ] Verify all modes work correctly
- [ ] Test tool execution with approval settings
- [ ] Verify context window management
- [ ] Test settings import/export
- [ ] Check cloud sync (if applicable)
- [ ] Test on Windows, Mac, Linux (if possible)
- [ ] Verify codebase indexing works
- [ ] Test MCP server integration
- [ ] Check telemetry events

**User Acceptance Testing**:
- [ ] Real coding task completion
- [ ] Refactoring scenario
- [ ] Debugging workflow
- [ ] Documentation generation
- [ ] Multi-file changes

---

## Conclusion

This roadmap provides a comprehensive guide to enhancing Roo Code across all major systems:

1. **Core Extension** - Agent loop, tools, providers
2. **Webview UI** - React components, state management
3. **Prompts & AI** - System prompts, tool descriptions
4. **Evals** - Benchmarking infrastructure
5. **Packages** - Shared utilities and services

**Next Steps**:
1. Choose an enhancement from the priority matrix
2. Create a branch
3. Follow the implementation guide
4. Test thoroughly
5. Submit PR with issue link

**Resources**:
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Docs](packages/evals/ARCHITECTURE.md)
- [GitHub Issues](https://github.com/RooCodeInc/Roo-Code/issues)
- [Discord Community](https://discord.gg/roocode)

Happy coding! 🚀
