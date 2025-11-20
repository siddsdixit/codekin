import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import type { ApiHandlerCreateMessageMetadata } from "../index";
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider";
export declare class RooHandler extends BaseOpenAiCompatibleProvider<string> {
    private fetcherBaseURL;
    constructor(options: ApiHandlerOptions);
    protected createStream(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata, requestOptions?: OpenAI.RequestOptions): import("openai").APIPromise<import("openai/core/streaming.js").Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    completePrompt(prompt: string): Promise<string>;
    private loadDynamicModels;
    getModel(): {
        id: string;
        info: {
            contextWindow: number;
            supportsPromptCache: boolean;
            maxTokens?: number | null | undefined;
            maxThinkingTokens?: number | null | undefined;
            supportsImages?: boolean | undefined;
            promptCacheRetention?: "in_memory" | "24h" | undefined;
            supportsVerbosity?: boolean | undefined;
            supportsReasoningBudget?: boolean | undefined;
            supportsReasoningBinary?: boolean | undefined;
            supportsTemperature?: boolean | undefined;
            defaultTemperature?: number | undefined;
            requiredReasoningBudget?: boolean | undefined;
            supportsReasoningEffort?: boolean | ("low" | "medium" | "high" | "minimal" | "none" | "disable")[] | undefined;
            requiredReasoningEffort?: boolean | undefined;
            preserveReasoning?: boolean | undefined;
            supportedParameters?: ("reasoning" | "max_tokens" | "temperature" | "include_reasoning")[] | undefined;
            inputPrice?: number | undefined;
            outputPrice?: number | undefined;
            cacheWritesPrice?: number | undefined;
            cacheReadsPrice?: number | undefined;
            description?: string | undefined;
            reasoningEffort?: "low" | "medium" | "high" | "minimal" | "none" | undefined;
            minTokensPerCachePoint?: number | undefined;
            maxCachePoints?: number | undefined;
            cachableFields?: string[] | undefined;
            deprecated?: boolean | undefined;
            isFree?: boolean | undefined;
            supportsNativeTools?: boolean | undefined;
            defaultToolProtocol?: "xml" | "native" | undefined;
            tiers?: {
                contextWindow: number;
                name?: "default" | "flex" | "priority" | undefined;
                inputPrice?: number | undefined;
                outputPrice?: number | undefined;
                cacheWritesPrice?: number | undefined;
                cacheReadsPrice?: number | undefined;
            }[] | undefined;
        };
    } | {
        id: string;
        info: {
            maxTokens: number;
            contextWindow: number;
            supportsImages: boolean;
            supportsReasoningEffort: boolean;
            supportsPromptCache: boolean;
            supportsNativeTools: boolean;
            inputPrice: number;
            outputPrice: number;
            isFree: boolean;
        } | {
            contextWindow: number;
            supportsPromptCache: boolean;
            maxTokens: number | null;
            maxThinkingTokens?: number | null | undefined;
            supportsImages: boolean;
            promptCacheRetention?: "in_memory" | "24h" | undefined;
            supportsVerbosity?: boolean | undefined;
            supportsReasoningBudget?: boolean | undefined;
            supportsReasoningBinary?: boolean | undefined;
            supportsTemperature?: boolean | undefined;
            defaultTemperature?: number | undefined;
            requiredReasoningBudget?: boolean | undefined;
            supportsReasoningEffort: boolean | ("low" | "medium" | "high" | "minimal" | "none" | "disable")[];
            requiredReasoningEffort?: boolean | undefined;
            preserveReasoning?: boolean | undefined;
            supportedParameters?: ("reasoning" | "max_tokens" | "temperature" | "include_reasoning")[] | undefined;
            inputPrice: number;
            outputPrice: number;
            cacheWritesPrice?: number | undefined;
            cacheReadsPrice?: number | undefined;
            description?: string | undefined;
            reasoningEffort?: "low" | "medium" | "high" | "minimal" | "none" | undefined;
            minTokensPerCachePoint?: number | undefined;
            maxCachePoints?: number | undefined;
            cachableFields?: string[] | undefined;
            deprecated?: boolean | undefined;
            isFree: boolean;
            supportsNativeTools: boolean;
            defaultToolProtocol?: "xml" | "native" | undefined;
            tiers?: {
                contextWindow: number;
                name?: "default" | "flex" | "priority" | undefined;
                inputPrice?: number | undefined;
                outputPrice?: number | undefined;
                cacheWritesPrice?: number | undefined;
                cacheReadsPrice?: number | undefined;
            }[] | undefined;
        };
    };
}
//# sourceMappingURL=roo.d.ts.map