import { BaseAgent } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * DevOps Engineer Agent - CI/CD and deployment
 */
export class DevOpsAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		return await this.executeWithLLM(task)
	}
}
