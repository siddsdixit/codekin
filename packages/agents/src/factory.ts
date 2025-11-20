import { db, queries, type AgentRow } from '@codekin/db'
import { BaseAgent } from './BaseAgent'
import type { AgentConfig } from './types'

// Import specialized agents
import { ArchitectAgent } from './specialized/ArchitectAgent'
import { PMAgent } from './specialized/PMAgent'
import { DevFrontendAgent } from './specialized/DevFrontendAgent'
import { DevBackendAgent } from './specialized/DevBackendAgent'
import { QAAgent } from './specialized/QAAgent'
import { DevOpsAgent } from './specialized/DevOpsAgent'

/**
 * Constructor type for concrete agent implementations
 */
type AgentConstructor = new (config: AgentConfig) => BaseAgent

/**
 * Map of agent types to their implementation classes
 */
const AGENT_CLASSES: Record<string, AgentConstructor> = {
	pm: PMAgent,
	architect: ArchitectAgent,
	'dev-frontend': DevFrontendAgent,
	'dev-backend': DevBackendAgent,
	qa: QAAgent,
	devops: DevOpsAgent,
}

/**
 * Load agent configuration from database and create instance
 */
export function loadAgentFromDatabase(agentType: string): BaseAgent {
	const row = queries.getAgentByType.get(agentType) as AgentRow | undefined

	if (!row) {
		throw new Error(`Agent type "${agentType}" not found in database`)
	}

	const config: AgentConfig = {
		id: row.id,
		type: row.type,
		name: row.name,
		roleDefinition: row.role_definition,
		allowedTools: JSON.parse(row.allowed_tools),
		fileRestrictions: row.file_restrictions ? JSON.parse(row.file_restrictions) : undefined,
		model: row.model,
		examples: row.examples ? JSON.parse(row.examples) : undefined,
	}

	return createAgent(config)
}

/**
 * Create agent instance from config
 */
export function createAgent(config: AgentConfig): BaseAgent {
	const AgentClass = AGENT_CLASSES[config.type]

	if (!AgentClass) {
		throw new Error(`Unknown agent type: ${config.type}`)
	}

	return new AgentClass(config)
}

/**
 * Load all agents from database
 */
export function loadAllAgents(): BaseAgent[] {
	const rows = queries.getAllAgents.all() as AgentRow[]

	return rows.map((row) => {
		const config: AgentConfig = {
			id: row.id,
			type: row.type,
			name: row.name,
			roleDefinition: row.role_definition,
			allowedTools: JSON.parse(row.allowed_tools),
			fileRestrictions: row.file_restrictions ? JSON.parse(row.file_restrictions) : undefined,
			model: row.model,
			examples: row.examples ? JSON.parse(row.examples) : undefined,
		}

		return createAgent(config)
	})
}
