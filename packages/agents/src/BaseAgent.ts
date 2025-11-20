import EventEmitter from 'events'
import { db, queries } from '@codekin/db'
import type { AgentConfig, AgentTask, TaskResult, AgentContext } from './types'
import { minimatch } from 'minimatch'
import { AgentExecutor, type AgentExecutorConfig } from './AgentExecutor'

/**
 * BaseAgent - Core agent class for Codekin's multi-agent system
 *
 * This is a simplified agent implementation designed to work with
 * Roo Code's tool infrastructure while providing:
 * - Tool access control
 * - File restriction enforcement
 * - Few-shot learning support
 * - Task execution tracking
 * - Integration with Codekin's database
 */
export abstract class BaseAgent extends EventEmitter {
	protected config: AgentConfig
	protected currentTask?: AgentTask
	protected context?: AgentContext
	protected executor?: AgentExecutor

	constructor(config: AgentConfig) {
		super()
		this.config = config
	}

	/**
	 * Initialize executor with provider settings
	 * This should be called before executing tasks
	 */
	public initializeExecutor(executorConfig: AgentExecutorConfig): void {
		this.executor = new AgentExecutor(executorConfig)
	}

	/**
	 * Get agent configuration
	 */
	public getConfig(): AgentConfig {
		return this.config
	}

	/**
	 * Update agent configuration
	 */
	public updateConfig(updates: Partial<AgentConfig>): void {
		this.config = { ...this.config, ...updates }

		// Update in database
		if (updates.roleDefinition || updates.allowedTools || updates.fileRestrictions || updates.model || updates.examples) {
			queries.updateAgent.run(
				updates.roleDefinition || this.config.roleDefinition,
				JSON.stringify(updates.allowedTools || this.config.allowedTools),
				updates.fileRestrictions ? JSON.stringify(updates.fileRestrictions) : this.config.fileRestrictions ? JSON.stringify(this.config.fileRestrictions) : null,
				updates.model || this.config.model,
				updates.examples ? JSON.stringify(updates.examples) : this.config.examples ? JSON.stringify(this.config.examples) : null,
				this.config.id
			)
		}
	}

	/**
	 * Set agent context (project info, working directory)
	 */
	public setContext(context: AgentContext): void {
		this.context = context
	}

	/**
	 * Main entry point: Handle a task
	 */
	public async handle(task: AgentTask): Promise<TaskResult> {
		this.currentTask = task
		this.emit('task:started', { agentId: this.config.id, taskId: task.id })

		try {
			// Update database
			queries.updateTaskStatus.run('active', new Date().toISOString(), task.id)

			// Execute task (implemented by child classes)
			const result = await this.executeTask(task)

			// Update database
			queries.completeTask.run('completed', task.id)

			this.emit('task:completed', { agentId: this.config.id, taskId: task.id, result })

			return result
		} catch (error) {
			// Update database
			queries.updateTaskStatus.run('failed', null, task.id)

			this.emit('task:failed', { agentId: this.config.id, taskId: task.id, error: (error as Error).message })

			return {
				success: false,
				output: null,
				filesChanged: [],
				error: (error as Error).message,
			}
		} finally {
			this.currentTask = undefined
		}
	}

	/**
	 * Abstract method: Each agent implements its own task execution
	 */
	protected abstract executeTask(task: AgentTask): Promise<TaskResult>

	/**
	 * Helper: Execute task using LLM (for child classes to use)
	 */
	protected async executeWithLLM(task: AgentTask): Promise<TaskResult> {
		if (!this.executor) {
			throw new Error('Executor not initialized. Call initializeExecutor() first.')
		}

		if (!this.context) {
			throw new Error('Context not set. Call setContext() first.')
		}

		this.saveMessage('system', `Starting task: ${task.title}`)
		this.updateProgress(0)

		try {
			// Call LLM through executor
			const result = await this.executor.execute(this, task)

			if (result.success) {
				this.updateProgress(100)
				this.saveMessage('assistant', result.response)

				return {
					success: true,
					output: result.response,
					filesChanged: result.filesModified,
				}
			} else {
				this.saveMessage('system', `Error: ${result.error}`)

				return {
					success: false,
					output: null,
					filesChanged: [],
					error: result.error,
				}
			}
		} catch (error) {
			const errorMessage = (error as Error).message
			this.saveMessage('system', `Error: ${errorMessage}`)

			return {
				success: false,
				output: null,
				filesChanged: [],
				error: errorMessage,
			}
		}
	}

	/**
	 * Check if a tool is allowed for this agent
	 */
	public isToolAllowed(toolName: string): boolean {
		return this.config.allowedTools.includes(toolName)
	}

	/**
	 * Check if agent can access/edit a file based on restrictions
	 */
	public canAccessFile(filePath: string): boolean {
		if (!this.config.fileRestrictions) {
			return true // No restrictions
		}

		const { allowedPatterns, deniedPatterns } = this.config.fileRestrictions

		// Check denied patterns first (blocklist takes precedence)
		if (deniedPatterns && deniedPatterns.length > 0) {
			for (const pattern of deniedPatterns) {
				if (this.matchGlob(filePath, pattern)) {
					return false
				}
			}
		}

		// Check allowed patterns
		if (allowedPatterns && allowedPatterns.length > 0) {
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
	 * Get list of allowed tools for this agent
	 */
	public getAllowedTools(): string[] {
		return [...this.config.allowedTools]
	}

	/**
	 * Get file restrictions for this agent
	 */
	public getFileRestrictions(): AgentConfig['fileRestrictions'] {
		return this.config.fileRestrictions
	}

	/**
	 * Build system prompt for LLM (includes role definition and examples)
	 */
	protected buildSystemPrompt(additionalContext?: string): string {
		let prompt = this.config.roleDefinition

		// Add few-shot examples if available
		if (this.config.examples && this.config.examples.length > 0) {
			prompt += '\n\n## Examples\n\n'
			prompt += 'Here are some examples of how you should approach tasks:\n\n'
			for (let i = 0; i < this.config.examples.length; i++) {
				const example = this.config.examples[i]
				if (example) {
					prompt += `### Example ${i + 1}\n\n`
					prompt += `**Input:**\n${example.input}\n\n`
					prompt += `**Output:**\n${example.output}\n\n`
				}
			}
		}

		// Add file restrictions info
		if (this.config.fileRestrictions) {
			prompt += '\n\n## File Access Restrictions\n\n'
			if (this.config.fileRestrictions.allowedPatterns) {
				prompt += 'You can only read/edit files matching these patterns:\n'
				this.config.fileRestrictions.allowedPatterns.forEach((p) => {
					prompt += `- ${p}\n`
				})
			}
			if (this.config.fileRestrictions.deniedPatterns) {
				prompt += '\nYou CANNOT access files matching these patterns:\n'
				this.config.fileRestrictions.deniedPatterns.forEach((p) => {
					prompt += `- ${p}\n`
				})
			}
		}

		// Add tool restrictions info
		prompt += '\n\n## Available Tools\n\n'
		prompt += 'You have access to the following tools:\n'
		this.config.allowedTools.forEach((tool) => {
			prompt += `- ${tool}\n`
		})

		if (additionalContext) {
			prompt += '\n\n## Additional Context\n\n'
			prompt += additionalContext
		}

		return prompt
	}

	/**
	 * Save conversation message to database
	 */
	protected saveMessage(role: string, content: string, agentId?: string): void {
		if (!this.currentTask) {
			return
		}

		queries.insertMessage.run(
			crypto.randomUUID(),
			this.currentTask.id,
			agentId || this.config.id,
			role,
			content
		)
	}

	/**
	 * Update task progress (0-100)
	 */
	protected updateProgress(progress: number): void {
		if (!this.currentTask) {
			return
		}

		queries.updateTaskProgress.run(progress, this.currentTask.id)
		this.emit('task:progress', { agentId: this.config.id, taskId: this.currentTask.id, progress })
	}

	/**
	 * Glob pattern matching with minimatch
	 */
	private matchGlob(filePath: string, pattern: string): boolean {
		// Normalize path separators
		const normalizedPath = filePath.replace(/\\\\/g, '/')
		return minimatch(normalizedPath, pattern, { dot: true })
	}
}

// Export crypto for child classes
import crypto from 'crypto'
export { crypto }
