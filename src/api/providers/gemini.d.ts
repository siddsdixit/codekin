import type { Anthropic } from "@anthropic-ai/sdk";
import { type ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiStream } from "../transform/stream";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { BaseProvider } from "./base-provider";
type GeminiHandlerOptions = ApiHandlerOptions & {
    isVertex?: boolean;
};
export declare class GeminiHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    constructor({ isVertex, ...options }: GeminiHandlerOptions);
    createMessage(systemInstruction: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        format: "gemini";
        reasoning: import("../transform/reasoning").GeminiReasoningParams | undefined;
        maxTokens: number | undefined;
        temperature: number | undefined;
        reasoningEffort: import("@roo-code/types", { with: { "resolution-mode": "import" } }).ReasoningEffortExtended | undefined;
        reasoningBudget: number | undefined;
        verbosity: import("@roo-code/types", { with: { "resolution-mode": "import" } }).VerbosityLevel | undefined;
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
    };
    private extractGroundingSources;
    private extractCitationsOnly;
    completePrompt(prompt: string): Promise<string>;
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
    calculateCost({ info, inputTokens, outputTokens, cacheReadTokens, }: {
        info: ModelInfo;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens?: number;
    }): number | undefined;
}
export {};
//# sourceMappingURL=gemini.d.ts.map