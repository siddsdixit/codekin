import { BaseAgent, crypto } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * Architect Agent - System design and technical architecture
 *
 * Responsibilities:
 * - Design system architecture
 * - Create API contracts
 * - Design database schemas
 * - Make technology decisions
 * - Review code for architectural compliance
 * - Create architectural decision records (ADRs)
 *
 * This agent only writes to documentation files and cannot
 * modify source code directly.
 */
export class ArchitectAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		// Use the new LLM executor!
		return await this.executeWithLLM(task)
	}

	/**
	 * Build task context for the LLM
	 */
	private buildTaskContext(task: AgentTask): string {
		let context = `# Architecture Task\n\n`
		context += `**Title:** ${task.title}\n\n`
		context += `**Description:**\n${task.description}\n\n`
		context += `**Type:** ${task.type}\n\n`

		if (task.dependencies && task.dependencies.length > 0) {
			context += `**Dependencies:**\n`
			task.dependencies.forEach((dep) => {
				context += `- ${dep}\n`
			})
			context += `\n`
		}

		context += `## Your Role\n\n`
		context += `As the System Architect, you need to:\n`
		context += `1. Analyze the requirements\n`
		context += `2. Design the system architecture\n`
		context += `3. Create API contracts if needed\n`
		context += `4. Design database schemas if needed\n`
		context += `5. Document your decisions\n\n`

		context += `Please provide your architectural design in a structured format.`

		return context
	}

	/**
	 * Design architecture for the task
	 *
	 * NOTE: This is a placeholder implementation.
	 * In the full implementation, this will:
	 * 1. Call Roo Code's LLM integration
	 * 2. Use the agent's system prompt and examples
	 * 3. Execute allowed tools (read, write, search_files, etc.)
	 * 4. Respect file restrictions
	 * 5. Return structured results
	 */
	private async designArchitecture(task: AgentTask): Promise<any> {
		this.updateProgress(25)

		// Placeholder: Simulate architectural design
		const design = {
			architecture: {
				type: 'microservices',
				components: ['API Gateway', 'Auth Service', 'User Service', 'Database'],
			},
			apiContracts: [
				{
					endpoint: '/api/users',
					methods: ['GET', 'POST', 'PUT', 'DELETE'],
					authentication: 'JWT',
				},
			],
			database: {
				type: 'PostgreSQL',
				tables: ['users', 'sessions'],
			},
			filesCreated: ['docs/architecture/system-design.md', 'docs/api/user-api.md'],
		}

		this.updateProgress(75)

		// In real implementation:
		// - Build system prompt using this.buildSystemPrompt()
		// - Call LLM through Roo Code's API
		// - Execute tools (write files, read existing code, etc.)
		// - Verify file restrictions before writing
		// - Return actual results

		return design
	}

	/**
	 * Override to add architecture-specific validation
	 */
	public canAccessFile(filePath: string): boolean {
		// Additional validation for architect agent
		// Architects can only write to docs/ directory
		if (
			filePath.endsWith('.ts') ||
			filePath.endsWith('.tsx') ||
			filePath.endsWith('.js') ||
			filePath.endsWith('.jsx')
		) {
			// Never allow direct code modification
			return false
		}

		return super.canAccessFile(filePath)
	}
}
