import { BaseAgent } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * Backend Developer Agent - APIs and business logic
 */
export class DevBackendAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		return await this.executeWithLLM(task)
	}
}
