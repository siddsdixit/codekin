"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RooHandler = void 0;
const types_1 = require("@roo-code/types");
const cloud_1 = require("@roo-code/cloud");
const model_params_1 = require("../transform/model-params");
const openai_format_1 = require("../transform/openai-format");
const reasoning_1 = require("../transform/reasoning");
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider");
const modelCache_1 = require("../providers/fetchers/modelCache");
const openai_error_handler_1 = require("./utils/openai-error-handler");
function getSessionToken() {
    const token = cloud_1.CloudService.hasInstance() ? cloud_1.CloudService.instance.authService?.getSessionToken() : undefined;
    return token ?? "unauthenticated";
}
class RooHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
    fetcherBaseURL;
    constructor(options) {
        const sessionToken = getSessionToken();
        let baseURL = process.env.ROO_CODE_PROVIDER_URL ?? "https://api.roocode.com/proxy";
        // Ensure baseURL ends with /v1 for OpenAI client, but don't duplicate it
        if (!baseURL.endsWith("/v1")) {
            baseURL = `${baseURL}/v1`;
        }
        // Always construct the handler, even without a valid token.
        // The provider-proxy server will return 401 if authentication fails.
        super({
            ...options,
            providerName: "Roo Code Cloud",
            baseURL, // Already has /v1 suffix
            apiKey: sessionToken,
            defaultProviderModelId: types_1.rooDefaultModelId,
            providerModels: {},
            defaultTemperature: 0.7,
        });
        // Load dynamic models asynchronously - strip /v1 from baseURL for fetcher
        this.fetcherBaseURL = baseURL.endsWith("/v1") ? baseURL.slice(0, -3) : baseURL;
        this.loadDynamicModels(this.fetcherBaseURL, sessionToken).catch((error) => {
            console.error("[RooHandler] Failed to load dynamic models:", error);
        });
    }
    createStream(systemPrompt, messages, metadata, requestOptions) {
        const { id: model, info } = this.getModel();
        // Get model parameters including reasoning
        const params = (0, model_params_1.getModelParams)({
            format: "openai",
            modelId: model,
            model: info,
            settings: this.options,
            defaultTemperature: this.defaultTemperature,
        });
        // Get Roo-specific reasoning parameters
        const reasoning = (0, reasoning_1.getRooReasoning)({
            model: info,
            reasoningBudget: params.reasoningBudget,
            reasoningEffort: params.reasoningEffort,
            settings: this.options,
        });
        const max_tokens = params.maxTokens ?? undefined;
        const temperature = params.temperature ?? this.defaultTemperature;
        const rooParams = {
            model,
            max_tokens,
            temperature,
            messages: [{ role: "system", content: systemPrompt }, ...(0, openai_format_1.convertToOpenAiMessages)(messages)],
            stream: true,
            stream_options: { include_usage: true },
            ...(reasoning && { reasoning }),
            ...(metadata?.tools && { tools: metadata.tools }),
            ...(metadata?.tool_choice && { tool_choice: metadata.tool_choice }),
        };
        try {
            this.client.apiKey = getSessionToken();
            return this.client.chat.completions.create(rooParams, requestOptions);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
    }
    async *createMessage(systemPrompt, messages, metadata) {
        try {
            const stream = await this.createStream(systemPrompt, messages, metadata, metadata?.taskId ? { headers: { "X-Roo-Task-ID": metadata.taskId } } : undefined);
            let lastUsage = undefined;
            // Accumulate tool calls by index - similar to how reasoning accumulates
            const toolCallAccumulator = new Map();
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                const finishReason = chunk.choices[0]?.finish_reason;
                if (delta) {
                    // Check for reasoning content (similar to OpenRouter)
                    if ("reasoning" in delta && delta.reasoning && typeof delta.reasoning === "string") {
                        yield {
                            type: "reasoning",
                            text: delta.reasoning,
                        };
                    }
                    // Also check for reasoning_content for backward compatibility
                    if ("reasoning_content" in delta && typeof delta.reasoning_content === "string") {
                        yield {
                            type: "reasoning",
                            text: delta.reasoning_content,
                        };
                    }
                    // Check for tool calls in delta
                    if ("tool_calls" in delta && Array.isArray(delta.tool_calls)) {
                        for (const toolCall of delta.tool_calls) {
                            const index = toolCall.index;
                            const existing = toolCallAccumulator.get(index);
                            if (existing) {
                                // Accumulate arguments for existing tool call
                                if (toolCall.function?.arguments) {
                                    existing.arguments += toolCall.function.arguments;
                                }
                            }
                            else {
                                // Start new tool call accumulation
                                toolCallAccumulator.set(index, {
                                    id: toolCall.id || "",
                                    name: toolCall.function?.name || "",
                                    arguments: toolCall.function?.arguments || "",
                                });
                            }
                        }
                    }
                    if (delta.content) {
                        yield {
                            type: "text",
                            text: delta.content,
                        };
                    }
                }
                // When finish_reason is 'tool_calls', yield all accumulated tool calls
                if (finishReason === "tool_calls" && toolCallAccumulator.size > 0) {
                    for (const [index, toolCall] of toolCallAccumulator.entries()) {
                        yield {
                            type: "tool_call",
                            id: toolCall.id,
                            name: toolCall.name,
                            arguments: toolCall.arguments,
                        };
                    }
                    // Clear accumulator after yielding
                    toolCallAccumulator.clear();
                }
                if (chunk.usage) {
                    lastUsage = chunk.usage;
                }
            }
            if (lastUsage) {
                // Check if the current model is marked as free
                const model = this.getModel();
                const isFreeModel = model.info.isFree ?? false;
                // Normalize input tokens based on protocol expectations:
                // - OpenAI protocol expects TOTAL input tokens (cached + non-cached)
                // - Anthropic protocol expects NON-CACHED input tokens (caches passed separately)
                const modelId = model.id;
                const apiProtocol = (0, types_1.getApiProtocol)("roo", modelId);
                const promptTokens = lastUsage.prompt_tokens || 0;
                const cacheWrite = lastUsage.cache_creation_input_tokens || 0;
                const cacheRead = lastUsage.prompt_tokens_details?.cached_tokens || 0;
                const nonCached = Math.max(0, promptTokens - cacheWrite - cacheRead);
                const inputTokensForDownstream = apiProtocol === "anthropic" ? nonCached : promptTokens;
                yield {
                    type: "usage",
                    inputTokens: inputTokensForDownstream,
                    outputTokens: lastUsage.completion_tokens || 0,
                    cacheWriteTokens: cacheWrite,
                    cacheReadTokens: cacheRead,
                    totalCost: isFreeModel ? 0 : (lastUsage.cost ?? 0),
                };
            }
        }
        catch (error) {
            // Log streaming errors with context
            console.error("[RooHandler] Error during message streaming:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                modelId: this.options.apiModelId,
                hasTaskId: Boolean(metadata?.taskId),
            });
            throw error;
        }
    }
    async completePrompt(prompt) {
        // Update API key before making request to ensure we use the latest session token
        this.client.apiKey = getSessionToken();
        return super.completePrompt(prompt);
    }
    async loadDynamicModels(baseURL, apiKey) {
        try {
            // Fetch models and cache them in the shared cache
            await (0, modelCache_1.getModels)({
                provider: "roo",
                baseUrl: baseURL,
                apiKey,
            });
        }
        catch (error) {
            // Enhanced error logging with more context
            console.error("[RooHandler] Error loading dynamic models:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                baseURL,
                hasApiKey: Boolean(apiKey),
            });
        }
    }
    getModel() {
        const modelId = this.options.apiModelId || types_1.rooDefaultModelId;
        // Get models from shared cache
        const models = (0, modelCache_1.getModelsFromCache)("roo") || {};
        const modelInfo = models[modelId];
        if (modelInfo) {
            return { id: modelId, info: modelInfo };
        }
        // Return the requested model ID even if not found, with fallback info.
        // Check if there are model-specific defaults configured
        const baseModelInfo = {
            maxTokens: 16_384,
            contextWindow: 262_144,
            supportsImages: false,
            supportsReasoningEffort: false,
            supportsPromptCache: true,
            supportsNativeTools: false,
            inputPrice: 0,
            outputPrice: 0,
            isFree: false,
        };
        // Merge with model-specific defaults if they exist
        const modelDefaults = types_1.rooModelDefaults[modelId];
        const fallbackInfo = modelDefaults ? { ...baseModelInfo, ...modelDefaults } : baseModelInfo;
        return {
            id: modelId,
            info: fallbackInfo,
        };
    }
}
exports.RooHandler = RooHandler;
//# sourceMappingURL=roo.js.map