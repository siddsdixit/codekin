/**
 * File size threshold (in bytes) above which token validation is triggered.
 * Files smaller than this are read without token counting overhead.
 */
export declare const FILE_SIZE_THRESHOLD = 100000;
/**
 * Absolute maximum file size (in bytes) that will be read for token validation.
 * Files larger than this cannot be tokenized due to tokenizer limitations.
 * This prevents WASM "unreachable" errors in tiktoken.
 */
export declare const MAX_FILE_SIZE_FOR_TOKENIZATION = 5000000;
/**
 * Size of preview to read from files that exceed MAX_FILE_SIZE_FOR_TOKENIZATION.
 * This allows the agent to see the beginning of large files without crashing.
 */
export declare const PREVIEW_SIZE_FOR_LARGE_FILES = 100000;
/**
 * Percentage of available context to reserve for file reading.
 * The remaining percentage is reserved for the model's response and overhead.
 */
export declare const FILE_READ_BUDGET_PERCENT = 0.6;
/**
 * Result of token budget validation for a file.
 */
export interface TokenBudgetResult {
    /** Whether the file content should be truncated */
    shouldTruncate: boolean;
    /** The maximum number of characters allowed (only relevant if shouldTruncate is true) */
    maxChars?: number;
    /** Human-readable reason for truncation */
    reason?: string;
    /** Whether this is a preview of a larger file (only showing beginning) */
    isPreview?: boolean;
}
/**
 * Validates whether a file's content fits within the available token budget.
 *
 * Strategy:
 * 1. Files < 100KB: Skip validation (fast path)
 * 2. Files >= 100KB: Count tokens and check against budget
 * 3. Budget = (contextWindow - currentTokens) * 0.6
 *
 * @param filePath - Path to the file to validate
 * @param contextWindow - Total context window size in tokens
 * @param currentTokens - Current token usage
 * @returns TokenBudgetResult indicating whether to truncate and at what character limit
 */
export declare function validateFileTokenBudget(filePath: string, contextWindow: number, currentTokens: number): Promise<TokenBudgetResult>;
/**
 * Truncates file content to fit within the specified character limit.
 * Adds a notice message at the end to inform the user about truncation.
 *
 * @param content - The full file content
 * @param maxChars - Maximum number of characters to keep
 * @param totalChars - Total number of characters in the original file
 * @param isPreview - Whether this is a preview of a larger file (not token-budget limited)
 * @returns Object containing truncated content and a notice message
 */
export declare function truncateFileContent(content: string, maxChars: number, totalChars: number, isPreview?: boolean): {
    content: string;
    notice: string;
};
//# sourceMappingURL=fileTokenBudget.d.ts.map