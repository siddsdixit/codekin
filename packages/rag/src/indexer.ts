import { QdrantClient } from '@qdrant/js-client-rest'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

export interface SearchResult {
	file: string
	chunk: string
	score: number
	language: string
	lineStart?: number
	lineEnd?: number
}

export class CodeIndexer {
	private qdrant: QdrantClient
	private embeddings: OpenAIEmbeddings
	private collectionName: string
	private isInitialized: boolean = false

	constructor(collectionName: string = 'codebase') {
		// Use Qdrant in-memory mode (no Docker required!)
		this.qdrant = new QdrantClient({
			url: ':memory:',
		})

		this.embeddings = new OpenAIEmbeddings({
			modelName: 'text-embedding-3-small', // Cheaper & faster than ada-002
			batchSize: 512,
		})

		this.collectionName = collectionName
	}

	/**
	 * Initialize Qdrant collection
	 */
	async init(): Promise<void> {
		if (this.isInitialized) {
			return
		}

		try {
			// Check if collection exists
			const collections = await this.qdrant.getCollections()
			const exists = collections.collections.some((c) => c.name === this.collectionName)

			if (!exists) {
				// Create collection
				await this.qdrant.createCollection(this.collectionName, {
					vectors: {
						size: 1536, // text-embedding-3-small dimension
						distance: 'Cosine',
					},
				})
				console.log('✅ Created Qdrant collection:', this.collectionName)
			} else {
				console.log('✅ Qdrant collection exists:', this.collectionName)
			}

			this.isInitialized = true
		} catch (error) {
			console.error('❌ Failed to initialize Qdrant:', error)
			throw error
		}
	}

	/**
	 * Index entire codebase
	 */
	async indexCodebase(projectPath: string, options?: IndexOptions): Promise<IndexStats> {
		await this.init()

		console.log('📦 Indexing codebase:', projectPath)

		const fileExtensions = options?.fileExtensions || [
			'ts',
			'tsx',
			'js',
			'jsx',
			'py',
			'java',
			'go',
			'rs',
			'cpp',
			'c',
			'h',
			'cs',
			'rb',
			'php',
			'swift',
			'kt',
		]

		const ignorePatterns = options?.ignorePatterns || [
			'node_modules/**',
			'dist/**',
			'build/**',
			'.git/**',
			'coverage/**',
			'*.min.js',
			'*.bundle.js',
		]

		// Find all code files
		const pattern = `**/*.{${fileExtensions.join(',')}}`
		const files = await glob(pattern, {
			cwd: projectPath,
			ignore: ignorePatterns,
			absolute: false,
		})

		console.log(`📄 Found ${files.length} files to index`)

		if (files.length === 0) {
			return {
				filesIndexed: 0,
				totalChunks: 0,
				errors: 0,
			}
		}

		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: options?.chunkSize || 1000,
			chunkOverlap: options?.chunkOverlap || 200,
			separators: ['\n\nclass ', '\n\nfunction ', '\n\nexport ', '\n\nimport ', '\n\n', '\n', ' '],
		})

		let totalChunks = 0
		let filesIndexed = 0
		let errors = 0

		// Process files in batches to avoid memory issues
		const batchSize = 10
		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize)

			await Promise.all(
				batch.map(async (file) => {
					try {
						const filePath = path.join(projectPath, file)
						const content = fs.readFileSync(filePath, 'utf-8')

						// Skip empty files
						if (content.trim().length === 0) {
							return
						}

						// Split into chunks
						const chunks = await textSplitter.splitText(content)

						// Generate embeddings
						const embeddings = await this.embeddings.embedDocuments(chunks)

						// Prepare points for Qdrant
						const points = chunks
							.map((chunk, chunkIndex) => {
								// Calculate approximate line numbers
								const linesBeforeChunk = content.substring(0, content.indexOf(chunk)).split('\n')
									.length
								const linesInChunk = chunk.split('\n').length
								const embedding = embeddings[chunkIndex]

								if (!embedding) {
									return null
								}

								return {
									id: `${file}-${chunkIndex}-${Date.now()}`,
									vector: embedding,
									payload: {
										file: file,
										chunk: chunk,
										chunkIndex: chunkIndex,
										language: this.detectLanguage(file),
										lineStart: linesBeforeChunk,
										lineEnd: linesBeforeChunk + linesInChunk,
										projectPath: projectPath,
									},
								}
							})
							.filter((p): p is NonNullable<typeof p> => p !== null)

						// Upload to Qdrant
						if (points.length > 0) {
							await this.qdrant.upsert(this.collectionName, {
								wait: true,
								points: points,
							})
						}

						totalChunks += chunks.length
						filesIndexed++

						console.log(`  ✓ Indexed ${file} (${chunks.length} chunks)`)
					} catch (error) {
						console.error(`  ✗ Failed to index ${file}:`, (error as Error).message)
						errors++
					}
				})
			)
		}

		console.log(`✅ Indexed ${filesIndexed} files with ${totalChunks} total chunks`)

		return {
			filesIndexed,
			totalChunks,
			errors,
		}
	}

	/**
	 * Search for relevant code
	 */
	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		await this.init()

		const limit = options?.limit || 5

		try {
			// Generate query embedding
			const queryEmbedding = await this.embeddings.embedQuery(query)

			// Search Qdrant
			const results = await this.qdrant.search(this.collectionName, {
				vector: queryEmbedding,
				limit: limit,
				with_payload: true,
			})

			return results.map((r) => ({
				file: r.payload?.file as string,
				chunk: r.payload?.chunk as string,
				score: r.score,
				language: r.payload?.language as string,
				lineStart: r.payload?.lineStart as number | undefined,
				lineEnd: r.payload?.lineEnd as number | undefined,
			}))
		} catch (error) {
			console.error('Search error:', error)
			return []
		}
	}

	/**
	 * Search with filters (e.g., specific file types or directories)
	 */
	async searchWithFilters(query: string, filters: SearchFilters, limit: number = 5): Promise<SearchResult[]> {
		await this.init()

		try {
			const queryEmbedding = await this.embeddings.embedQuery(query)

			// Build Qdrant filter
			const qdrantFilter: any = {}

			if (filters.languages && filters.languages.length > 0) {
				qdrantFilter.must = [
					{
						key: 'language',
						match: { any: filters.languages },
					},
				]
			}

			if (filters.filePattern) {
				// This is a simple implementation - in production you'd want more sophisticated pattern matching
				qdrantFilter.must = qdrantFilter.must || []
				// Note: Qdrant doesn't support regex in filters, so we search and filter client-side
			}

			const results = await this.qdrant.search(this.collectionName, {
				vector: queryEmbedding,
				limit: limit * 2, // Get more results to filter client-side
				with_payload: true,
				filter: Object.keys(qdrantFilter).length > 0 ? qdrantFilter : undefined,
			})

			let filtered = results.map((r) => ({
				file: r.payload?.file as string,
				chunk: r.payload?.chunk as string,
				score: r.score,
				language: r.payload?.language as string,
				lineStart: r.payload?.lineStart as number | undefined,
				lineEnd: r.payload?.lineEnd as number | undefined,
			}))

			// Client-side pattern filtering
			if (filters.filePattern) {
				const pattern = new RegExp(filters.filePattern)
				filtered = filtered.filter((r) => pattern.test(r.file))
			}

			return filtered.slice(0, limit)
		} catch (error) {
			console.error('Search with filters error:', error)
			return []
		}
	}

	/**
	 * Clear all indexed data
	 */
	async clear(): Promise<void> {
		await this.init()

		try {
			await this.qdrant.deleteCollection(this.collectionName)
			this.isInitialized = false
			console.log('✅ Cleared collection:', this.collectionName)
		} catch (error) {
			console.error('Failed to clear collection:', error)
			throw error
		}
	}

	/**
	 * Get collection stats
	 */
	async getStats(): Promise<CollectionStats> {
		await this.init()

		try {
			const info = await this.qdrant.getCollection(this.collectionName)

			return {
				pointsCount: info.points_count || 0,
				vectorsCount: info.indexed_vectors_count || info.points_count || 0,
			}
		} catch (error) {
			console.error('Failed to get stats:', error)
			return {
				pointsCount: 0,
				vectorsCount: 0,
			}
		}
	}

	/**
	 * Detect programming language from file extension
	 */
	private detectLanguage(file: string): string {
		const ext = path.extname(file).toLowerCase()
		const langMap: Record<string, string> = {
			'.ts': 'typescript',
			'.tsx': 'typescript',
			'.js': 'javascript',
			'.jsx': 'javascript',
			'.py': 'python',
			'.java': 'java',
			'.go': 'go',
			'.rs': 'rust',
			'.cpp': 'cpp',
			'.c': 'c',
			'.h': 'c',
			'.cs': 'csharp',
			'.rb': 'ruby',
			'.php': 'php',
			'.swift': 'swift',
			'.kt': 'kotlin',
		}
		return langMap[ext] || 'unknown'
	}
}

// Types

export interface IndexOptions {
	fileExtensions?: string[]
	ignorePatterns?: string[]
	chunkSize?: number
	chunkOverlap?: number
}

export interface IndexStats {
	filesIndexed: number
	totalChunks: number
	errors: number
}

export interface SearchOptions {
	limit?: number
}

export interface SearchFilters {
	languages?: string[]
	filePattern?: string
}

export interface CollectionStats {
	pointsCount: number
	vectorsCount: number
}
