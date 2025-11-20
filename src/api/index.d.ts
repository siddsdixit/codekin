import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ProviderSettings, ModelInfo, ToolProtocol } from "@roo-code/types";
import { ApiStream } from "./transform/stream";
export interface SingleCompletionHandler {
    completePrompt(prompt: string): Promise<string>;
}
export interface ApiHandlerCreateMessageMetadata {
    /**
     * Task ID used for tracking and provider-specific features:
     * - DeepInfra: Used as prompt_cache_key for caching
     * - Roo: Sent as X-Roo-Task-ID header
     * - Requesty: Sent as trace_id
     * - Unbound: Sent in unbound_metadata
     */
    taskId: string;
    /**
     * Current mode slug for provider-specific tracking:
     * - Requesty: Sent in extra metadata
     * - Unbound: Sent in unbound_metadata
     */
    mode?: string;
    suppressPreviousResponseId?: boolean;
    /**
     * Controls whether the response should be stored for 30 days in OpenAI's Responses API.
     * When true (default), responses are stored and can be referenced in future requests
     * using the previous_response_id for efficient conversation continuity.
     * Set to false to opt out of response storage for privacy or compliance reasons.
     * @default true
     */
    store?: boolean;
    /**
     * Optional array of tool definitions to pass to the model.
     * For OpenAI-compatible providers, these are ChatCompletionTool definitions.
     */
    tools?: OpenAI.Chat.ChatCompletionTool[];
    /**
     * Controls which (if any) tool is called by the model.
     * Can be "none", "auto", "required", or a specific tool choice.
     */
    tool_choice?: OpenAI.Chat.ChatCompletionCreateParams["tool_choice"];
    /**
     * The tool protocol being used (XML or Native).
     * Used by providers to determine whether to include native tool definitions.
     */
    toolProtocol?: ToolProtocol;
}
export interface ApiHandler {
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    /**
     * Counts tokens for content blocks
     * All providers extend BaseProvider which provides a default tiktoken implementation,
     * but they can override this to use their native token counting endpoints
     *
     * @param content The content to count tokens for
     * @returns A promise resolving to the token count
     */
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
}
export declare function buildApiHandler(configuration: ProviderSettings): ApiHandler;
//# sourceMappingURL=index.d.ts.map