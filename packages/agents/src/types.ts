export interface AgentConfig {
	id: string
	type: string
	name: string
	roleDefinition: string
	allowedTools: string[]
	fileRestrictions?: {
		allowedPatterns: string[]
		deniedPatterns: string[]
	}
	model: string
	examples?: Array<{ input: string; output: string }>
}

export interface AgentTask {
	id: string
	title: string
	description: string
	type: string
	dependencies: string[]
	filesAffected?: string[]
}

export interface TaskResult {
	success: boolean
	output: any
	filesChanged: string[]
	error?: string
}

export interface AgentContext {
	projectId: string
	projectPath: string
	cwd: string
}
