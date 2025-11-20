/**
 * Codekin Configuration
 *
 * Loads configuration from environment variables or config file
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface CodekinConfig {
	// LLM Provider settings
	llm: {
		provider: 'anthropic' | 'openai' | 'ollama' | 'openrouter' | string
		apiKey?: string
		model: string
		baseUrl?: string
	}

	// Project settings
	project: {
		workingDirectory: string
	}

	// Execution settings
	execution: {
		maxConversationTurns: number
		timeoutSeconds: number
		retryAttempts: number
	}

	// Feature flags
	features: {
		useRealLLM: boolean // Set to false for testing with simulated LLM
		enableCodeIndexing: boolean
		enableParallelExecution: boolean
	}
}

/**
 * Load configuration from environment or config file
 */
export function loadConfig(): CodekinConfig {
	// Try to load from config file first
	const configPath = path.join(os.homedir(), '.codekin', 'config.json')
	let fileConfig: Partial<CodekinConfig> = {}

	if (fs.existsSync(configPath)) {
		try {
			const content = fs.readFileSync(configPath, 'utf-8')
			fileConfig = JSON.parse(content)
			console.log('✅ Loaded config from:', configPath)
		} catch (error) {
			console.warn('⚠️  Failed to load config file:', error)
		}
	}

	// Build config with env vars taking precedence
	const config: CodekinConfig = {
		llm: {
			provider: process.env.CODEKIN_LLM_PROVIDER || fileConfig.llm?.provider || 'anthropic',
			apiKey: process.env.ANTHROPIC_API_KEY ||
				process.env.OPENAI_API_KEY ||
				process.env.CODEKIN_API_KEY ||
				fileConfig.llm?.apiKey,
			model:
				process.env.CODEKIN_MODEL ||
				fileConfig.llm?.model ||
				(process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-20250514' : 'gpt-4-turbo'),
			baseUrl: process.env.CODEKIN_BASE_URL || fileConfig.llm?.baseUrl,
		},

		project: {
			workingDirectory: process.env.CODEKIN_CWD || fileConfig.project?.workingDirectory || process.cwd(),
		},

		execution: {
			maxConversationTurns: parseInt(process.env.CODEKIN_MAX_TURNS || '20'),
			timeoutSeconds: parseInt(process.env.CODEKIN_TIMEOUT || '300'),
			retryAttempts: parseInt(process.env.CODEKIN_RETRY || '3'),
		},

		features: {
			useRealLLM: process.env.CODEKIN_USE_REAL_LLM === 'true' || fileConfig.features?.useRealLLM !== false,
			enableCodeIndexing: process.env.CODEKIN_CODE_INDEXING !== 'false',
			enableParallelExecution: process.env.CODEKIN_PARALLEL !== 'false',
		},
	}

	return config
}

/**
 * Save configuration to file
 */
export function saveConfig(config: CodekinConfig): void {
	const configDir = path.join(os.homedir(), '.codekin')
	const configPath = path.join(configDir, 'config.json')

	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true })
	}

	fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
	console.log('✅ Saved config to:', configPath)
}

/**
 * Initialize default config file if it doesn't exist
 */
export function initializeConfig(): void {
	const configPath = path.join(os.homedir(), '.codekin', 'config.json')

	if (fs.existsSync(configPath)) {
		console.log('✅ Config file already exists:', configPath)
		return
	}

	const defaultConfig: CodekinConfig = {
		llm: {
			provider: 'anthropic',
			model: 'claude-sonnet-4-20250514',
			// apiKey will be loaded from env
		},
		project: {
			workingDirectory: process.cwd(),
		},
		execution: {
			maxConversationTurns: 20,
			timeoutSeconds: 300,
			retryAttempts: 3,
		},
		features: {
			useRealLLM: true,
			enableCodeIndexing: true,
			enableParallelExecution: true,
		},
	}

	saveConfig(defaultConfig)
	console.log('✅ Created default config file')
	console.log('\n📝 Next steps:')
	console.log('   1. Set your API key: export ANTHROPIC_API_KEY=your-key')
	console.log('   2. Or edit config file:', configPath)
}

/**
 * Validate configuration
 */
export function validateConfig(config: CodekinConfig): { valid: boolean; errors: string[] } {
	const errors: string[] = []

	// Check API key if using real LLM
	if (config.features.useRealLLM && !config.llm.apiKey) {
		errors.push('API key is required when useRealLLM is true')
		errors.push('Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable')
	}

	// Check working directory exists
	if (!fs.existsSync(config.project.workingDirectory)) {
		errors.push(`Working directory does not exist: ${config.project.workingDirectory}`)
	}

	// Validate numbers
	if (config.execution.maxConversationTurns < 1) {
		errors.push('maxConversationTurns must be at least 1')
	}

	if (config.execution.timeoutSeconds < 1) {
		errors.push('timeoutSeconds must be at least 1')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Print current configuration
 */
export function printConfig(config: CodekinConfig): void {
	console.log('\n⚙️  Codekin Configuration:')
	console.log('━'.repeat(50))
	console.log(`LLM Provider:     ${config.llm.provider}`)
	console.log(`Model:            ${config.llm.model}`)
	console.log(`API Key:          ${config.llm.apiKey ? '✅ Set' : '❌ Not Set'}`)
	if (config.llm.baseUrl) {
		console.log(`Base URL:         ${config.llm.baseUrl}`)
	}
	console.log(`Working Dir:      ${config.project.workingDirectory}`)
	console.log(`Max Turns:        ${config.execution.maxConversationTurns}`)
	console.log(`Timeout:          ${config.execution.timeoutSeconds}s`)
	console.log(`Use Real LLM:     ${config.features.useRealLLM ? '✅ Yes' : '⚠️  No (Simulated)'}`)
	console.log(`Code Indexing:    ${config.features.enableCodeIndexing ? '✅ Enabled' : '❌ Disabled'}`)
	console.log(`Parallel Exec:    ${config.features.enableParallelExecution ? '✅ Enabled' : '❌ Disabled'}`)
	console.log('━'.repeat(50))
}
