import { Anthropic } from "@anthropic-ai/sdk";
import { ApiHandler } from "../../api";
import { SummarizeResponse } from "../condense";
import { ApiMessage } from "../task-persistence/apiMessages";
/**
 * Context Management
 *
 * This module provides Context Management for conversations, combining:
 * - Intelligent condensation of prior messages when approaching configured thresholds
 * - Sliding window truncation as a fallback when necessary
 *
 * Behavior and exports are preserved exactly from the previous sliding-window implementation.
 */
/**
 * Default percentage of the context window to use as a buffer when deciding when to truncate.
 * Used by Context Management to determine when to trigger condensation or (fallback) sliding window truncation.
 */
export declare const TOKEN_BUFFER_PERCENTAGE = 0.1;
/**
 * Counts tokens for user content using the provider's token counting implementation.
 *
 * @param {Array<Anthropic.Messages.ContentBlockParam>} content - The content to count tokens for
 * @param {ApiHandler} apiHandler - The API handler to use for token counting
 * @returns {Promise<number>} A promise resolving to the token count
 */
export declare function estimateTokenCount(content: Array<Anthropic.Messages.ContentBlockParam>, apiHandler: ApiHandler): Promise<number>;
/**
 * Truncates a conversation by removing a fraction of the messages.
 *
 * The first message is always retained, and a specified fraction (rounded to an even number)
 * of messages from the beginning (excluding the first) is removed.
 *
 * This implements the sliding window truncation behavior.
 *
 * @param {ApiMessage[]} messages - The conversation messages.
 * @param {number} fracToRemove - The fraction (between 0 and 1) of messages (excluding the first) to remove.
 * @param {string} taskId - The task ID for the conversation, used for telemetry
 * @returns {ApiMessage[]} The truncated conversation messages.
 */
export declare function truncateConversation(messages: ApiMessage[], fracToRemove: number, taskId: string): ApiMessage[];
/**
 * Context Management: Conditionally manages the conversation context when approaching limits.
 *
 * Attempts intelligent condensation of prior messages when thresholds are reached.
 * Falls back to sliding window truncation if condensation is unavailable or fails.
 *
 * @param {ContextManagementOptions} options - The options for truncation/condensation
 * @returns {Promise<ApiMessage[]>} The original, condensed, or truncated conversation messages.
 */
export type ContextManagementOptions = {
    messages: ApiMessage[];
    totalTokens: number;
    contextWindow: number;
    maxTokens?: number | null;
    apiHandler: ApiHandler;
    autoCondenseContext: boolean;
    autoCondenseContextPercent: number;
    systemPrompt: string;
    taskId: string;
    customCondensingPrompt?: string;
    condensingApiHandler?: ApiHandler;
    profileThresholds: Record<string, number>;
    currentProfileId: string;
};
export type ContextManagementResult = SummarizeResponse & {
    prevContextTokens: number;
};
/**
 * Conditionally manages conversation context (condense and fallback truncation).
 *
 * @param {ContextManagementOptions} options - The options for truncation/condensation
 * @returns {Promise<ApiMessage[]>} The original, condensed, or truncated conversation messages.
 */
export declare function manageContext({ messages, totalTokens, contextWindow, maxTokens, apiHandler, autoCondenseContext, autoCondenseContextPercent, systemPrompt, taskId, customCondensingPrompt, condensingApiHandler, profileThresholds, currentProfileId, }: ContextManagementOptions): Promise<ContextManagementResult>;
//# sourceMappingURL=index.d.ts.map