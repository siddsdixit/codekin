/**
 * Codekin Demo - Shows how the system works
 *
 * This demonstrates:
 * 1. Database initialization
 * 2. Agent loading
 * 3. Task orchestration
 * 4. Parallel execution
 */

import { db, seedAgents, queries } from './db/src'
import { Orchestrator } from './orchestrator/src'
import { CodeIndexer } from './rag/src'

async function main() {
	console.log('🎯 Codekin Demo\n')

	try {
		// Step 1: Initialize database and seed agents
		console.log('📊 Step 1: Database Setup')
		console.log('─'.repeat(50))
		seedAgents()
		console.log()

		// Step 2: Verify agents are loaded
		console.log('🤖 Step 2: Verify Agents')
		console.log('─'.repeat(50))
		const agents = queries.getAllAgents.all()
		console.log(`Found ${agents.length} agents:`)
		agents.forEach((agent: any) => {
			console.log(`  • ${agent.name} (${agent.type})`)
		})
		console.log()

		// Step 3: Initialize code indexing (optional)
		console.log('🔍 Step 3: Code Indexing (Optional)')
		console.log('─'.repeat(50))
		console.log('Qdrant in-memory ready for semantic search')
		console.log('(Skipping actual indexing in demo)\n')

		// Step 4: Create orchestrator
		console.log('⚙️  Step 4: Initialize Orchestrator')
		console.log('─'.repeat(50))
		const orchestrator = new Orchestrator()
		const status = orchestrator.getStatus()
		console.log(`✅ Orchestrator ready with ${status.agentsLoaded} agents`)
		console.log(`   Agents: ${status.agentTypes.join(', ')}\n`)

		// Step 5: Simulate a requirement
		console.log('🚀 Step 5: Execute Sample Requirement')
		console.log('─'.repeat(50))

		const requirement = 'Build a user authentication system with JWT, including login and registration APIs'

		console.log(`Requirement: "${requirement}"\n`)

		// Create a test project
		const projectId = 'test-project-' + Date.now()
		queries.setSetting.run(
			'last_project_id',
			projectId
		)

		// Execute!
		const result = await orchestrator.execute(requirement, projectId, process.cwd())

		// Step 6: Show results
		console.log('\n📈 Execution Results')
		console.log('─'.repeat(50))
		console.log(`Success: ${result.success}`)
		console.log(`Tasks Completed: ${result.tasksCompleted}`)
		console.log(`Duration: ${result.duration}s`)

		if (result.plan) {
			console.log(`\nExecution Plan:`)
			console.log(`  • Total phases: ${result.plan.phases.length}`)
			console.log(`  • Estimated time: ${result.plan.totalDuration} minutes`)
			console.log(`  • Parallelization: ${(result.plan.parallelizationRatio * 100).toFixed(1)}%`)

			console.log(`\nPhase Breakdown:`)
			result.plan.phases.forEach((phase) => {
				console.log(`  Phase ${phase.phaseNumber}: ${phase.tasks.length} task(s) - ${phase.estimatedDuration}min`)
				phase.tasks.forEach((task) => {
					console.log(`    → [${task.agentType}] ${task.title}`)
				})
			})
		}

		if (result.error) {
			console.error(`\n❌ Error: ${result.error}`)
		}

		console.log('\n✅ Demo complete!')
	} catch (error) {
		console.error('\n❌ Demo failed:', error)
		process.exit(1)
	}
}

// Run demo
main().catch(console.error)
