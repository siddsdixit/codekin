import type { Task, DependencyGraph, ExecutionPhase } from './types'

/**
 * DependencyBuilder - Build task dependency graph and execution phases
 *
 * This analyzes tasks and their dependencies to create an execution plan
 * that maximizes parallelism while respecting dependencies and file conflicts.
 */
export class DependencyBuilder {
	/**
	 * Build dependency graph from tasks
	 */
	build(tasks: Task[]): DependencyGraph {
		const edges = new Map<string, string[]>()

		// Build dependency edges
		for (const task of tasks) {
			edges.set(task.id, task.dependencies || [])
		}

		return { tasks, edges }
	}

	/**
	 * Find execution phases (groups of tasks that can run in parallel)
	 */
	findExecutionPhases(graph: DependencyGraph): ExecutionPhase[] {
		const phases: ExecutionPhase[] = []
		const completed = new Set<string>()
		let phaseNumber = 1

		while (completed.size < graph.tasks.length) {
			// Find tasks ready to execute (all dependencies met)
			const readyTasks = graph.tasks.filter((task) => {
				if (completed.has(task.id)) return false
				const deps = graph.edges.get(task.id) || []
				return deps.every((depId) => completed.has(depId))
			})

			if (readyTasks.length === 0) {
				// Check for circular dependencies
				if (completed.size < graph.tasks.length) {
					throw new Error('Circular dependency detected in task graph')
				}
				break
			}

			// Check for file conflicts and split if necessary
			const conflictFreeTasks = this.resolveFileConflicts(readyTasks)

			// Calculate phase duration (max of all tasks in phase)
			const phaseDuration = Math.max(...conflictFreeTasks.map((t) => t.estimatedDuration))

			phases.push({
				phaseNumber,
				tasks: conflictFreeTasks,
				estimatedDuration: phaseDuration,
				canRunInParallel: conflictFreeTasks.length > 1,
			})

			// Mark tasks as completed
			conflictFreeTasks.forEach((task) => completed.add(task.id))
			phaseNumber++
		}

		return phases
	}

	/**
	 * Create execution plan with parallelization metrics
	 */
	createExecutionPlan(graph: DependencyGraph): import('./types').ExecutionPlan {
		const phases = this.findExecutionPhases(graph)

		const totalTasks = graph.tasks.length
		const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0)

		// Calculate how much parallelization we achieved
		const sequentialDuration = graph.tasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
		const parallelizationRatio = totalDuration > 0 ? 1 - totalDuration / sequentialDuration : 0

		return {
			phases,
			totalTasks,
			totalDuration,
			parallelizationRatio,
		}
	}

	/**
	 * Resolve file conflicts - tasks that would modify same files
	 * cannot run in parallel
	 */
	private resolveFileConflicts(tasks: Task[]): Task[] {
		const result: Task[] = []
		const usedFiles = new Set<string>()

		for (const task of tasks) {
			const taskFiles = task.filesAffected || []

			// Check if any file is already being modified
			const hasConflict = taskFiles.some((file) => usedFiles.has(file))

			if (!hasConflict) {
				result.push(task)
				taskFiles.forEach((file) => usedFiles.add(file))
			}
			// Tasks with conflicts will be picked up in the next phase
		}

		return result
	}

	/**
	 * Validate task graph for circular dependencies
	 */
	validateGraph(graph: DependencyGraph): { valid: boolean; errors: string[] } {
		const errors: string[] = []

		// Check for self-dependencies
		for (const task of graph.tasks) {
			const deps = graph.edges.get(task.id) || []
			if (deps.includes(task.id)) {
				errors.push(`Task ${task.title} depends on itself`)
			}
		}

		// Check for missing dependencies
		for (const task of graph.tasks) {
			const deps = graph.edges.get(task.id) || []
			for (const depId of deps) {
				if (!graph.tasks.find((t) => t.id === depId)) {
					errors.push(`Task ${task.title} depends on non-existent task ${depId}`)
				}
			}
		}

		// Check for circular dependencies using DFS
		const visited = new Set<string>()
		const recursionStack = new Set<string>()

		const hasCycle = (taskId: string): boolean => {
			visited.add(taskId)
			recursionStack.add(taskId)

			const deps = graph.edges.get(taskId) || []
			for (const depId of deps) {
				if (!visited.has(depId)) {
					if (hasCycle(depId)) return true
				} else if (recursionStack.has(depId)) {
					errors.push(`Circular dependency detected involving task ${taskId}`)
					return true
				}
			}

			recursionStack.delete(taskId)
			return false
		}

		for (const task of graph.tasks) {
			if (!visited.has(task.id)) {
				hasCycle(task.id)
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	/**
	 * Get critical path (longest chain of dependent tasks)
	 */
	getCriticalPath(graph: DependencyGraph): Task[] {
		const taskMap = new Map(graph.tasks.map((t) => [t.id, t]))
		const memo = new Map<string, { duration: number; path: Task[] }>()

		const getLongestPath = (taskId: string): { duration: number; path: Task[] } => {
			if (memo.has(taskId)) {
				return memo.get(taskId)!
			}

			const task = taskMap.get(taskId)!
			const deps = graph.edges.get(taskId) || []

			if (deps.length === 0) {
				const result = { duration: task.estimatedDuration, path: [task] }
				memo.set(taskId, result)
				return result
			}

			let maxPath = { duration: 0, path: [] as Task[] }
			for (const depId of deps) {
				const depPath = getLongestPath(depId)
				if (depPath.duration > maxPath.duration) {
					maxPath = depPath
				}
			}

			const result = {
				duration: maxPath.duration + task.estimatedDuration,
				path: [...maxPath.path, task],
			}
			memo.set(taskId, result)
			return result
		}

		// Find the longest path from all leaf tasks
		let criticalPath = { duration: 0, path: [] as Task[] }
		for (const task of graph.tasks) {
			const path = getLongestPath(task.id)
			if (path.duration > criticalPath.duration) {
				criticalPath = path
			}
		}

		return criticalPath.path
	}
}
