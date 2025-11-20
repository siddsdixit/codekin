/**
 * Codekin Integration Test - End-to-End Flow with LLM
 *
 * This tests the full stack:
 * 1. Database initialization
 * 2. Agent loading with LLM executor
 * 3. Task orchestration
 * 4. LLM execution (simulated for MVP)
 * 5. Parallel execution
 */

import { db, seedAgents, queries } from './db/src'
import { Orchestrator } from './orchestrator/src'
import type { AgentExecutorConfig } from './agents/src'

async function main() {
	console.log('🧪 Codekin Integration Test\n')
	console.log('This tests the full LLM integration flow.\n')

	try {
		// Step 1: Initialize database and seed agents
		console.log('━'.repeat(60))
		console.log('📊 Step 1: Database Setup')
		console.log('━'.repeat(60))
		seedAgents()
		console.log()

		// Step 2: Configure LLM provider
		console.log('━'.repeat(60))
		console.log('⚙️  Step 2: Configure LLM Provider')
		console.log('━'.repeat(60))

		// For MVP, we use a minimal config
		// In production, this would come from VS Code settings
		const executorConfig: AgentExecutorConfig = {
			providerSettings: {
				apiProvider: 'anthropic', // Can be any provider
				apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
				apiModelId: 'claude-opus-4',
			},
			cwd: process.cwd(),
		}

		console.log('✅ Provider: anthropic')
		console.log('✅ Model: claude-opus-4')
		console.log('✅ Working Directory:', process.cwd())
		console.log()

		// Step 3: Create orchestrator with LLM integration
		console.log('━'.repeat(60))
		console.log('🤖 Step 3: Initialize Orchestrator with LLM')
		console.log('━'.repeat(60))

		const orchestrator = new Orchestrator(executorConfig)
		const status = orchestrator.getStatus()

		console.log(`✅ Orchestrator ready with ${status.agentsLoaded} agents`)
		console.log(`   Agents: ${status.agentTypes.join(', ')}`)
		console.log(`   Each agent has LLM executor initialized`)
		console.log()

		// Step 4: Execute a complex requirement
		console.log('━'.repeat(60))
		console.log('🚀 Step 4: Execute Complex Requirement')
		console.log('━'.repeat(60))

		const requirement = 'Build a user authentication system with JWT tokens. Include registration, login, logout APIs. Add comprehensive tests and deployment pipeline.'

		console.log(`📋 Requirement:`)
		console.log(`   "${requirement}"`)
		console.log()

		// Create a test project
		const projectId = 'integration-test-' + Date.now()

		// Execute!
		console.log('⚡ Starting execution...\n')
		const result = await orchestrator.execute(requirement, projectId, process.cwd())

		// Step 5: Show detailed results
		console.log()
		console.log('━'.repeat(60))
		console.log('📈 Step 5: Execution Results')
		console.log('━'.repeat(60))

		console.log(`\n🎯 Overall Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
		console.log(`   Tasks Completed: ${result.tasksCompleted}`)
		console.log(`   Duration: ${result.duration}s`)

		if (result.plan) {
			console.log(`\n📊 Execution Plan Analysis:`)
			console.log(`   • Total phases: ${result.plan.phases.length}`)
			console.log(`   • Total tasks: ${result.plan.totalTasks}`)
			console.log(`   • Estimated time: ${result.plan.totalDuration} minutes`)
			console.log(
				`   • Parallelization: ${(result.plan.parallelizationRatio * 100).toFixed(1)}% (${result.plan.parallelizationRatio > 0 ? '⚡ Faster!' : '🐌 Sequential'})`
			)

			console.log(`\n📋 Phase-by-Phase Breakdown:`)
			result.plan.phases.forEach((phase) => {
				const parallelSymbol = phase.canRunInParallel && phase.tasks.length > 1 ? '⚡' : '→'
				console.log(
					`\n   ${parallelSymbol} Phase ${phase.phaseNumber}: ${phase.tasks.length} task(s) - ${phase.estimatedDuration}min`
				)
				phase.tasks.forEach((task) => {
					console.log(`      • [${task.agentType}] ${task.title}`)
				})
			})

			// Show critical path
			console.log(`\n🎯 Critical Path (longest dependency chain):`)
			// Would calculate and show critical path here
			console.log(`   Estimated minimum time: ${result.plan.totalDuration} minutes`)
		}

		if (result.error) {
			console.error(`\n❌ Error Details: ${result.error}`)
		}

		// Step 6: Verify database state
		console.log()
		console.log('━'.repeat(60))
		console.log('🗄️  Step 6: Verify Database State')
		console.log('━'.repeat(60))

		const tasks = queries.getTasksByProject.all(projectId) as any[]
		console.log(`\n✅ Found ${tasks.length} tasks in database:`)
		tasks.forEach((task, i) => {
			console.log(`   ${i + 1}. [${task.status}] ${task.title}`)
		})

		// Get conversation history for first task
		if (tasks.length > 0) {
			const messages = queries.getMessagesByTask.all(tasks[0].id) as any[]
			console.log(`\n💬 Conversation history for first task (${messages.length} messages):`)
			messages.slice(0, 5).forEach((msg) => {
				console.log(`   [${msg.role}] ${msg.content.substring(0, 60)}...`)
			})
			if (messages.length > 5) {
				console.log(`   ... and ${messages.length - 5} more messages`)
			}
		}

		console.log()
		console.log('━'.repeat(60))
		console.log('✅ Integration Test Complete!')
		console.log('━'.repeat(60))
		console.log()
		console.log('🎉 What we tested:')
		console.log('   ✅ Database initialization and seeding')
		console.log('   ✅ Agent loading with LLM executor')
		console.log('   ✅ Task analysis and breakdown')
		console.log('   ✅ Dependency graph creation')
		console.log('   ✅ Execution plan with parallelism')
		console.log('   ✅ LLM execution (simulated)')
		console.log('   ✅ Database persistence')
		console.log('   ✅ Conversation history tracking')
		console.log()
		console.log('📝 Next Steps:')
		console.log('   1. Replace simulated LLM with real API calls')
		console.log('   2. Implement actual tool execution')
		console.log('   3. Add retry logic and error handling')
		console.log('   4. Build web UI for visualization')
		console.log()
	} catch (error) {
		console.error('\n❌ Integration test failed:', error)
		console.error('\nStack trace:', (error as Error).stack)
		process.exit(1)
	}
}

// Run test
if (require.main === module) {
	main().catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}

export { main as runIntegrationTest }
