import EventEmitter from 'events'
import { db, queries } from '@codekin/db'
import { loadAllAgents, type BaseAgent, type AgentExecutorConfig } from '@codekin/agents'
import { TaskAnalyzer } from './TaskAnalyzer'
import { DependencyBuilder } from './DependencyBuilder'
import type { Task, OrchestratorEvents, ExecutionPlan } from './types'

/**
 * Orchestrator - Smart task coordination with parallel execution
 *
 * The Orchestrator is the brain of Codekin. It:
 * 1. Analyzes user requirements into discrete tasks
 * 2. Builds a dependency graph
 * 3. Creates an execution plan with maximum parallelism
 * 4. Coordinates 6 specialized agents
 * 5. Executes tasks respecting dependencies and file conflicts
 * 6. Provides real-time progress updates
 */
export class Orchestrator extends EventEmitter {
	private taskAnalyzer: TaskAnalyzer
	private dependencyBuilder: DependencyBuilder
	private agents: Map<string, BaseAgent>
	private isRunning: boolean = false

	constructor(executorConfig?: AgentExecutorConfig) {
		super()
		this.taskAnalyzer = new TaskAnalyzer()
		this.dependencyBuilder = new DependencyBuilder()
		this.agents = new Map()

		this.initializeAgents(executorConfig)
	}

	/**
	 * Initialize all 6 specialized agents
	 */
	private initializeAgents(executorConfig?: AgentExecutorConfig): void {
		try {
			const allAgents = loadAllAgents()

			for (const agent of allAgents) {
				// Initialize agent's LLM executor if config provided
				if (executorConfig) {
					agent.initializeExecutor(executorConfig)
				}

				this.agents.set(agent.getConfig().type, agent)

				// Forward agent events to orchestrator
				agent.on('task:started', (data) => {
					this.emit('task:started', {
						taskId: data.taskId,
						agentType: agent.getConfig().type as any,
					})
				})

				agent.on('task:completed', (data) => {
					this.emit('task:completed', {
						taskId: data.taskId,
						agentType: agent.getConfig().type as any,
						duration: 0, // TODO: Track actual duration
					})
				})

				agent.on('task:failed', (data) => {
					this.emit('task:failed', {
						taskId: data.taskId,
						agentType: agent.getConfig().type as any,
						error: data.error,
					})
				})
			}

			console.log(`✅ Orchestrator initialized with ${allAgents.length} agents`)
		} catch (error) {
			console.error('❌ Failed to initialize agents:', error)
			throw error
		}
	}

	/**
	 * Main entry point: Execute user requirement
	 */
	async execute(requirement: string, projectId: string, projectPath: string): Promise<ExecutionResult> {
		if (this.isRunning) {
			throw new Error('Orchestrator is already running a task')
		}

		this.isRunning = true
		const startTime = Date.now()

		console.log('🚀 Orchestrator starting execution')
		console.log(`📋 Requirement: ${requirement}`)

		this.emit('execution:started', { requirement, projectId })

		try {
			// Step 1: Analyze requirement into tasks
			console.log('\n📊 Step 1/4: Analyzing requirement...')
			const tasks = await this.taskAnalyzer.analyze(requirement)
			console.log(`✅ Parsed into ${tasks.length} tasks:`)
			tasks.forEach((t, i) => {
				console.log(`   ${i + 1}. [${t.agentType}] ${t.title}`)
			})

			if (tasks.length === 0) {
				throw new Error('No tasks generated from requirement')
			}

			// Step 2: Build dependency graph
			console.log('\n🔗 Step 2/4: Building dependency graph...')
			const graph = this.dependencyBuilder.build(tasks)

			// Validate graph
			const validation = this.dependencyBuilder.validateGraph(graph)
			if (!validation.valid) {
				throw new Error(`Invalid task graph: ${validation.errors.join(', ')}`)
			}

			// Step 3: Create execution plan
			console.log('\n📅 Step 3/4: Creating execution plan...')
			const plan = this.dependencyBuilder.createExecutionPlan(graph)

			console.log(`✅ Execution plan created:`)
			console.log(`   • ${plan.totalTasks} total tasks`)
			console.log(`   • ${plan.phases.length} execution phases`)
			console.log(`   • ${plan.totalDuration} minutes estimated`)
			console.log(`   • ${(plan.parallelizationRatio * 100).toFixed(1)}% parallelization`)

			// Step 4: Execute phases
			console.log('\n⚡ Step 4/4: Executing tasks...')
			await this.executePlan(plan, projectId, projectPath)

			const duration = Math.round((Date.now() - startTime) / 1000)
			console.log(`\n🎉 Execution complete! (${duration}s)`)

			this.emit('execution:completed', { projectId, duration })

			return {
				success: true,
				tasksCompleted: plan.totalTasks,
				duration,
				plan,
			}
		} catch (error) {
			const errorMessage = (error as Error).message
			console.error('\n❌ Execution failed:', errorMessage)

			this.emit('execution:failed', { error: errorMessage })

			return {
				success: false,
				tasksCompleted: 0,
				duration: Math.round((Date.now() - startTime) / 1000),
				error: errorMessage,
			}
		} finally {
			this.isRunning = false
		}
	}

	/**
	 * Execute the execution plan phase by phase
	 */
	private async executePlan(plan: ExecutionPlan, projectId: string, projectPath: string): Promise<void> {
		for (let i = 0; i < plan.phases.length; i++) {
			const phase = plan.phases[i]
			if (!phase) continue

			console.log(`\n📍 Phase ${phase.phaseNumber}/${plan.phases.length}:`)
			console.log(`   • ${phase.tasks.length} task(s)`)
			console.log(`   • ${phase.canRunInParallel ? 'Parallel' : 'Sequential'} execution`)
			console.log(`   • ${phase.estimatedDuration} minutes estimated`)

			this.emit('phase:started', {
				phase: phase.phaseNumber,
				total: plan.phases.length,
				tasks: phase.tasks,
			})

			const phaseStartTime = Date.now()

			// Execute all tasks in this phase (in parallel if possible)
			if (phase.canRunInParallel && phase.tasks.length > 1) {
				// Parallel execution
				await Promise.all(phase.tasks.map((task) => this.executeTask(task, projectId, projectPath)))
			} else {
				// Sequential execution
				for (const task of phase.tasks) {
					await this.executeTask(task, projectId, projectPath)
				}
			}

			const phaseDuration = Math.round((Date.now() - phaseStartTime) / 1000)
			console.log(`✅ Phase ${phase.phaseNumber} completed (${phaseDuration}s)`)

			this.emit('phase:completed', {
				phase: phase.phaseNumber,
				duration: phaseDuration,
			})
		}
	}

	/**
	 * Execute a single task with the appropriate agent
	 */
	private async executeTask(task: Task, projectId: string, projectPath: string): Promise<void> {
		// Get the appropriate agent
		const agent = this.agents.get(task.agentType)

		if (!agent) {
			throw new Error(`No agent found for type: ${task.agentType}`)
		}

		console.log(`   → [${agent.getConfig().name}] ${task.title}`)

		// Set agent context
		agent.setContext({
			projectId,
			projectPath,
			cwd: projectPath,
		})

		// Save task to database
		queries.insertTask.run(
			task.id,
			projectId,
			task.title,
			task.description,
			task.type,
			agent.getConfig().id,
			'pending',
			JSON.stringify(task.dependencies),
			JSON.stringify(task.filesAffected || [])
		)

		this.emit('task:assigned', {
			taskId: task.id,
			agentType: task.agentType,
		})

		// Execute task with agent
		const result = await agent.handle({
			id: task.id,
			title: task.title,
			description: task.description,
			type: task.type,
			dependencies: task.dependencies,
			filesAffected: task.filesAffected,
		})

		if (result.success) {
			console.log(`   ✓ [${agent.getConfig().name}] Completed`)
		} else {
			console.log(`   ✗ [${agent.getConfig().name}] Failed: ${result.error}`)
			throw new Error(`Task failed: ${result.error}`)
		}
	}

	/**
	 * Get current orchestrator status
	 */
	getStatus(): OrchestratorStatus {
		return {
			isRunning: this.isRunning,
			agentsLoaded: this.agents.size,
			agentTypes: Array.from(this.agents.keys()),
		}
	}

	/**
	 * Get agent by type
	 */
	getAgent(agentType: string): BaseAgent | undefined {
		return this.agents.get(agentType)
	}
}

// Types

export interface ExecutionResult {
	success: boolean
	tasksCompleted: number
	duration: number
	plan?: ExecutionPlan
	error?: string
}

export interface OrchestratorStatus {
	isRunning: boolean
	agentsLoaded: number
	agentTypes: string[]
}
