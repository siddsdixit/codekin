import type { Task, TaskType, AgentType } from './types'
import { randomUUID } from 'crypto'

/**
 * TaskAnalyzer - Parse user requirements into discrete tasks
 *
 * This uses LLM to intelligently break down requirements into
 * actionable tasks for each specialized agent.
 *
 * For MVP, we use a rule-based system. In production, this would
 * call an LLM to analyze requirements more intelligently.
 */
export class TaskAnalyzer {
	/**
	 * Analyze requirement and break into tasks
	 */
	async analyze(requirement: string): Promise<Task[]> {
		// For MVP: Simple rule-based task generation
		// In production: Use LLM to intelligently parse requirements

		const tasks: Task[] = []

		// Detect what type of work is needed based on keywords
		const needsRequirements = this.detectRequirementsWork(requirement)
		const needsArchitecture = this.detectArchitectureWork(requirement)
		const needsFrontend = this.detectFrontendWork(requirement)
		const needsBackend = this.detectBackendWork(requirement)
		const needsTesting = this.detectTestingWork(requirement)
		const needsDeployment = this.detectDeploymentWork(requirement)

		// Generate tasks based on detection
		if (needsRequirements) {
			tasks.push({
				id: randomUUID(),
				title: 'Clarify requirements and write specifications',
				description: `Analyze the requirement: "${requirement}"\n\nCreate user stories, acceptance criteria, and technical specifications.`,
				type: 'requirements' as TaskType,
				agentType: 'pm' as AgentType,
				estimatedDuration: 15,
				dependencies: [],
			})
		}

		if (needsArchitecture) {
			tasks.push({
				id: randomUUID(),
				title: 'Design system architecture',
				description: `Design the architecture for: "${requirement}"\n\nInclude API contracts, database schema, and technology decisions.`,
				type: 'design' as TaskType,
				agentType: 'architect' as AgentType,
				estimatedDuration: 30,
				dependencies: needsRequirements && tasks[0] ? [tasks[0].id] : [],
			})
		}

		if (needsBackend) {
			const archTaskId = tasks.find((t) => t.agentType === 'architect')?.id
			tasks.push({
				id: randomUUID(),
				title: 'Implement backend/API',
				description: `Implement backend functionality for: "${requirement}"\n\nInclude APIs, business logic, and database operations.`,
				type: 'implement' as TaskType,
				agentType: 'dev-backend' as AgentType,
				estimatedDuration: 60,
				dependencies: archTaskId ? [archTaskId] : [],
				filesAffected: ['src/api/**/*', 'src/server/**/*'],
			})
		}

		if (needsFrontend) {
			const backendTaskId = tasks.find((t) => t.agentType === 'dev-backend')?.id
			tasks.push({
				id: randomUUID(),
				title: 'Implement frontend/UI',
				description: `Implement UI for: "${requirement}"\n\nInclude components, pages, and client-side logic.`,
				type: 'implement' as TaskType,
				agentType: 'dev-frontend' as AgentType,
				estimatedDuration: 45,
				dependencies: backendTaskId ? [backendTaskId] : [],
				filesAffected: ['src/components/**/*', 'src/pages/**/*'],
			})
		}

		if (needsTesting) {
			const devTasks = tasks.filter((t) => t.agentType.startsWith('dev-'))
			tasks.push({
				id: randomUUID(),
				title: 'Write and run tests',
				description: `Write comprehensive tests for: "${requirement}"\n\nInclude unit, integration, and E2E tests.`,
				type: 'test' as TaskType,
				agentType: 'qa' as AgentType,
				estimatedDuration: 30,
				dependencies: devTasks.map((t) => t.id),
				filesAffected: ['tests/**/*'],
			})
		}

		if (needsDeployment) {
			const qaTaskId = tasks.find((t) => t.agentType === 'qa')?.id
			tasks.push({
				id: randomUUID(),
				title: 'Setup deployment pipeline',
				description: `Setup CI/CD for: "${requirement}"\n\nConfigure deployment, monitoring, and rollback.`,
				type: 'deploy' as TaskType,
				agentType: 'devops' as AgentType,
				estimatedDuration: 20,
				dependencies: qaTaskId ? [qaTaskId] : [],
				filesAffected: ['.github/workflows/**/*'],
			})
		}

		return tasks
	}

	/**
	 * Detect if requirements/specification work is needed
	 */
	private detectRequirementsWork(requirement: string): boolean {
		const keywords = ['feature', 'requirement', 'user story', 'spec', 'specification']
		return keywords.some((k) => requirement.toLowerCase().includes(k))
	}

	/**
	 * Detect if architecture/design work is needed
	 */
	private detectArchitectureWork(requirement: string): boolean {
		const keywords = [
			'design',
			'architecture',
			'api',
			'database',
			'schema',
			'system',
			'implement',
			'build',
			'create',
		]
		return keywords.some((k) => requirement.toLowerCase().includes(k))
	}

	/**
	 * Detect if frontend work is needed
	 */
	private detectFrontendWork(requirement: string): boolean {
		const keywords = [
			'ui',
			'frontend',
			'component',
			'page',
			'form',
			'button',
			'interface',
			'view',
			'display',
			'show',
			'render',
		]
		return keywords.some((k) => requirement.toLowerCase().includes(k))
	}

	/**
	 * Detect if backend work is needed
	 */
	private detectBackendWork(requirement: string): boolean {
		const keywords = [
			'api',
			'backend',
			'server',
			'database',
			'endpoint',
			'service',
			'logic',
			'authentication',
			'authorization',
		]
		return keywords.some((k) => requirement.toLowerCase().includes(k))
	}

	/**
	 * Detect if testing work is needed
	 */
	private detectTestingWork(requirement: string): boolean {
		// Always need testing for implementation tasks
		return true
	}

	/**
	 * Detect if deployment work is needed
	 */
	private detectDeploymentWork(requirement: string): boolean {
		const keywords = ['deploy', 'ci/cd', 'pipeline', 'production', 'release']
		return keywords.some((k) => requirement.toLowerCase().includes(k))
	}
}
