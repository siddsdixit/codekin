import { BaseAgent } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * Product Manager Agent - Requirements and specifications
 */
export class PMAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		// Use the LLM executor
		return await this.executeWithLLM(task)
	}
}
