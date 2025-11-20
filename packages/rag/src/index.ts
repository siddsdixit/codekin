export { CodeIndexer } from './indexer'
export type {
	SearchResult,
	IndexOptions,
	IndexStats,
	SearchOptions,
	SearchFilters,
	CollectionStats,
} from './indexer'

import type { CodeIndexer as CodeIndexerType } from './indexer'
import { CodeIndexer as CodeIndexerClass } from './indexer'

// Helper function for quick setup
export async function setupCodeIndexing(projectPath: string): Promise<CodeIndexerType> {
	console.log('🚀 Setting up code indexing for:', projectPath)

	const indexer = new CodeIndexerClass()
	await indexer.init()
	await indexer.indexCodebase(projectPath)

	console.log('✅ Code indexing complete!')

	return indexer
}
