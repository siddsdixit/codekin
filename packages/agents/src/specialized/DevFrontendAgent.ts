import { BaseAgent } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * Frontend Developer Agent - UI and client-side logic
 */
export class DevFrontendAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		return await this.executeWithLLM(task)
	}
}
