import { BaseAgent } from '../BaseAgent'
import type { AgentConfig, AgentTask, TaskResult } from '../types'

/**
 * QA Engineer Agent - Testing and quality assurance
 */
export class QAAgent extends BaseAgent {
	constructor(config: AgentConfig) {
		super(config)
	}

	protected async executeTask(task: AgentTask): Promise<TaskResult> {
		return await this.executeWithLLM(task)
	}
}
