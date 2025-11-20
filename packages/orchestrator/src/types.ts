export interface Task {
	id: string
	title: string
	description: string
	type: TaskType
	agentType: AgentType
	estimatedDuration: number // minutes
	dependencies: string[] // task IDs
	filesAffected?: string[]
	priority?: number
}

export enum TaskType {
	REQUIREMENTS = 'requirements',
	DESIGN = 'design',
	IMPLEMENT = 'implement',
	TEST = 'test',
	DEPLOY = 'deploy',
	DOCUMENT = 'document',
}

export enum AgentType {
	PM = 'pm',
	ARCHITECT = 'architect',
	DEV_FRONTEND = 'dev-frontend',
	DEV_BACKEND = 'dev-backend',
	QA = 'qa',
	DEVOPS = 'devops',
}

export interface DependencyGraph {
	tasks: Task[]
	edges: Map<string, string[]> // taskId → [dependsOnTaskIds]
}

export interface ExecutionPhase {
	phaseNumber: number
	tasks: Task[]
	estimatedDuration: number
	canRunInParallel: boolean
}

export interface ExecutionPlan {
	phases: ExecutionPhase[]
	totalTasks: number
	totalDuration: number
	parallelizationRatio: number // 0-1, how much parallelism is achieved
}

export interface OrchestratorEvents {
	'execution:started': { requirement: string; projectId: string }
	'execution:completed': { projectId: string; duration: number }
	'execution:failed': { error: string }
	'phase:started': { phase: number; total: number; tasks: Task[] }
	'phase:completed': { phase: number; duration: number }
	'task:assigned': { taskId: string; agentType: AgentType }
	'task:started': { taskId: string; agentType: AgentType }
	'task:completed': { taskId: string; agentType: AgentType; duration: number }
	'task:failed': { taskId: string; agentType: AgentType; error: string }
}
