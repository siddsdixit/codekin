"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_READ_BUDGET_PERCENT = exports.PREVIEW_SIZE_FOR_LARGE_FILES = exports.MAX_FILE_SIZE_FOR_TOKENIZATION = exports.FILE_SIZE_THRESHOLD = void 0;
exports.validateFileTokenBudget = validateFileTokenBudget;
exports.truncateFileContent = truncateFileContent;
const fs = __importStar(require("fs/promises"));
const countTokens_1 = require("../../../utils/countTokens");
const line_counter_1 = require("../../../integrations/misc/line-counter");
/**
 * File size threshold (in bytes) above which token validation is triggered.
 * Files smaller than this are read without token counting overhead.
 */
exports.FILE_SIZE_THRESHOLD = 100_000; // 100KB
/**
 * Absolute maximum file size (in bytes) that will be read for token validation.
 * Files larger than this cannot be tokenized due to tokenizer limitations.
 * This prevents WASM "unreachable" errors in tiktoken.
 */
exports.MAX_FILE_SIZE_FOR_TOKENIZATION = 5_000_000; // 5MB
/**
 * Size of preview to read from files that exceed MAX_FILE_SIZE_FOR_TOKENIZATION.
 * This allows the agent to see the beginning of large files without crashing.
 */
exports.PREVIEW_SIZE_FOR_LARGE_FILES = 100_000; // 100KB
/**
 * Percentage of available context to reserve for file reading.
 * The remaining percentage is reserved for the model's response and overhead.
 */
exports.FILE_READ_BUDGET_PERCENT = 0.6; // 60% for file, 40% for response
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
async function validateFileTokenBudget(filePath, contextWindow, currentTokens) {
    try {
        // Check file size first (fast path)
        const stats = await fs.stat(filePath);
        const fileSizeBytes = stats.size;
        // Fast path: small files always pass
        if (fileSizeBytes < exports.FILE_SIZE_THRESHOLD) {
            return { shouldTruncate: false };
        }
        // Calculate available token budget
        const remainingTokens = contextWindow - currentTokens;
        const safeReadBudget = Math.floor(remainingTokens * exports.FILE_READ_BUDGET_PERCENT);
        // If we don't have enough budget, truncate immediately without reading
        if (safeReadBudget <= 0) {
            return {
                shouldTruncate: true,
                maxChars: 0,
                reason: "No available context budget for file reading",
            };
        }
        // For files too large to tokenize entirely, read a preview instead
        // The tokenizer (tiktoken WASM) crashes with "unreachable" errors on very large files
        const isPreviewMode = fileSizeBytes > exports.MAX_FILE_SIZE_FOR_TOKENIZATION;
        // Use streaming token counter for normal-sized files to avoid double read
        // For previews, still use direct read since we're only reading a portion
        let tokenCount = 0;
        let streamingSucceeded = false;
        if (!isPreviewMode) {
            // Try streaming token estimation first (single pass, early exit capability)
            try {
                const result = await (0, line_counter_1.countFileLinesAndTokens)(filePath, {
                    budgetTokens: safeReadBudget,
                    chunkLines: 256,
                });
                tokenCount = result.tokenEstimate;
                streamingSucceeded = true;
                // If streaming indicated we exceeded budget during scan
                if (!result.complete) {
                    // Early exit - we know file exceeds budget without reading it all
                    const maxChars = Math.floor(safeReadBudget * 3);
                    return {
                        shouldTruncate: true,
                        maxChars,
                        reason: `File requires ${tokenCount}+ tokens but only ${safeReadBudget} tokens available in context budget`,
                    };
                }
            }
            catch (error) {
                // Streaming failed - will fallback to full read below
                streamingSucceeded = false;
            }
        }
        // Fallback to full read + token count (for preview mode or if streaming failed)
        if (!streamingSucceeded) {
            let content;
            if (isPreviewMode) {
                // Read only the preview portion to avoid tokenizer crashes
                const fileHandle = await fs.open(filePath, "r");
                try {
                    const buffer = Buffer.alloc(exports.PREVIEW_SIZE_FOR_LARGE_FILES);
                    const { bytesRead } = await fileHandle.read(buffer, 0, exports.PREVIEW_SIZE_FOR_LARGE_FILES, 0);
                    content = buffer.slice(0, bytesRead).toString("utf-8");
                }
                finally {
                    await fileHandle.close();
                }
            }
            else {
                // Read the entire file for normal-sized files
                content = await fs.readFile(filePath, "utf-8");
            }
            // Count tokens with error handling
            try {
                const contentBlocks = [{ type: "text", text: content }];
                tokenCount = await (0, countTokens_1.countTokens)(contentBlocks);
            }
            catch (error) {
                // Catch tokenizer "unreachable" errors
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes("unreachable")) {
                    // Use conservative estimation: 2 chars = 1 token
                    const estimatedTokens = Math.ceil(content.length / 2);
                    if (estimatedTokens > safeReadBudget) {
                        return {
                            shouldTruncate: true,
                            maxChars: safeReadBudget,
                            isPreview: true,
                            reason: `File content caused tokenizer error. Showing truncated preview to fit context budget. Use line_range to read specific sections.`,
                        };
                    }
                    return {
                        shouldTruncate: true,
                        maxChars: content.length,
                        isPreview: true,
                        reason: `File content caused tokenizer error but fits in context. Use line_range for specific sections.`,
                    };
                }
                throw error;
            }
        }
        // Check if content exceeds budget
        if (tokenCount > safeReadBudget) {
            const maxChars = Math.floor(safeReadBudget * 3);
            return {
                shouldTruncate: true,
                maxChars,
                isPreview: isPreviewMode,
                reason: isPreviewMode
                    ? `Preview of large file (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB) truncated to fit context budget. Use line_range to read specific sections.`
                    : `File requires ${tokenCount} tokens but only ${safeReadBudget} tokens available in context budget`,
            };
        }
        // Content fits within budget
        if (isPreviewMode) {
            return {
                shouldTruncate: true,
                maxChars: exports.PREVIEW_SIZE_FOR_LARGE_FILES,
                isPreview: true,
                reason: `File is too large (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB) to read entirely. Showing preview of first ${(exports.PREVIEW_SIZE_FOR_LARGE_FILES / 1024 / 1024).toFixed(1)}MB. Use line_range to read specific sections.`,
            };
        }
        // File fits within budget
        return { shouldTruncate: false };
    }
    catch (error) {
        // On error, be conservative and don't truncate
        // This allows the existing error handling to take over
        console.warn(`[fileTokenBudget] Error validating file ${filePath}:`, error);
        return { shouldTruncate: false };
    }
}
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
function truncateFileContent(content, maxChars, totalChars, isPreview = false) {
    const truncatedContent = content.slice(0, maxChars);
    const notice = isPreview
        ? `Preview: Showing first ${(maxChars / 1024 / 1024).toFixed(1)}MB of ${(totalChars / 1024 / 1024).toFixed(2)}MB file. Use line_range to read specific sections.`
        : `File truncated to ${maxChars} of ${totalChars} characters due to context limitations. Use line_range to read specific sections if needed.`;
    return {
        content: truncatedContent,
        notice,
    };
}
//# sourceMappingURL=fileTokenBudget.js.map