"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterHandler = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("@roo-code/types");
const openai_format_1 = require("../transform/openai-format");
const r1_format_1 = require("../transform/r1-format");
const anthropic_1 = require("../transform/caching/anthropic");
const gemini_1 = require("../transform/caching/gemini");
const model_params_1 = require("../transform/model-params");
const modelCache_1 = require("./fetchers/modelCache");
const modelEndpointCache_1 = require("./fetchers/modelEndpointCache");
const constants_1 = require("./constants");
const base_provider_1 = require("./base-provider");
const openai_error_handler_1 = require("./utils/openai-error-handler");
class OpenRouterHandler extends base_provider_1.BaseProvider {
    options;
    client;
    models = {};
    endpoints = {};
    providerName = "OpenRouter";
    constructor(options) {
        super();
        this.options = options;
        const baseURL = this.options.openRouterBaseUrl || "https://openrouter.ai/api/v1";
        const apiKey = this.options.openRouterApiKey ?? "not-provided";
        this.client = new openai_1.default({ baseURL, apiKey, defaultHeaders: constants_1.DEFAULT_HEADERS });
        // Load models asynchronously to populate cache before getModel() is called
        this.loadDynamicModels().catch((error) => {
            console.error("[OpenRouterHandler] Failed to load dynamic models:", error);
        });
    }
    async loadDynamicModels() {
        try {
            const [models, endpoints] = await Promise.all([
                (0, modelCache_1.getModels)({ provider: "openrouter" }),
                (0, modelEndpointCache_1.getModelEndpoints)({
                    router: "openrouter",
                    modelId: this.options.openRouterModelId,
                    endpoint: this.options.openRouterSpecificProvider,
                }),
            ]);
            this.models = models;
            this.endpoints = endpoints;
        }
        catch (error) {
            console.error("[OpenRouterHandler] Error loading dynamic models:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }
    async *createMessage(systemPrompt, messages, metadata) {
        const model = await this.fetchModel();
        let { id: modelId, maxTokens, temperature, topP, reasoning } = model;
        // OpenRouter sends reasoning tokens by default for Gemini 2.5 Pro
        // Preview even if you don't request them. This is not the default for
        // other providers (including Gemini), so we need to explicitly disable
        // i We should generalize this using the logic in `getModelParams`, but
        // this is easier for now.
        if ((modelId === "google/gemini-2.5-pro-preview" || modelId === "google/gemini-2.5-pro") &&
            typeof reasoning === "undefined") {
            reasoning = { exclude: true };
        }
        // Convert Anthropic messages to OpenAI format.
        let openAiMessages = [
            { role: "system", content: systemPrompt },
            ...(0, openai_format_1.convertToOpenAiMessages)(messages),
        ];
        // DeepSeek highly recommends using user instead of system role.
        if (modelId.startsWith("deepseek/deepseek-r1") || modelId === "perplexity/sonar-reasoning") {
            openAiMessages = (0, r1_format_1.convertToR1Format)([{ role: "user", content: systemPrompt }, ...messages]);
        }
        // https://openrouter.ai/docs/features/prompt-caching
        // TODO: Add a `promptCacheStratey` field to `ModelInfo`.
        if (types_1.OPEN_ROUTER_PROMPT_CACHING_MODELS.has(modelId)) {
            if (modelId.startsWith("google")) {
                (0, gemini_1.addCacheBreakpoints)(systemPrompt, openAiMessages);
            }
            else {
                (0, anthropic_1.addCacheBreakpoints)(systemPrompt, openAiMessages);
            }
        }
        const transforms = (this.options.openRouterUseMiddleOutTransform ?? true) ? ["middle-out"] : undefined;
        // https://openrouter.ai/docs/transforms
        const completionParams = {
            model: modelId,
            ...(maxTokens && maxTokens > 0 && { max_tokens: maxTokens }),
            temperature,
            top_p: topP,
            messages: openAiMessages,
            stream: true,
            stream_options: { include_usage: true },
            // Only include provider if openRouterSpecificProvider is not "[default]".
            ...(this.options.openRouterSpecificProvider &&
                this.options.openRouterSpecificProvider !== types_1.OPENROUTER_DEFAULT_PROVIDER_NAME && {
                provider: {
                    order: [this.options.openRouterSpecificProvider],
                    only: [this.options.openRouterSpecificProvider],
                    allow_fallbacks: false,
                },
            }),
            parallel_tool_calls: false, // Ensure only one tool call at a time
            ...(transforms && { transforms }),
            ...(reasoning && { reasoning }),
            ...(metadata?.tools && { tools: metadata.tools }),
            ...(metadata?.tool_choice && { tool_choice: metadata.tool_choice }),
        };
        let stream;
        try {
            stream = await this.client.chat.completions.create(completionParams);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
        let lastUsage = undefined;
        const toolCallAccumulator = new Map();
        for await (const chunk of stream) {
            // OpenRouter returns an error object instead of the OpenAI SDK throwing an error.
            if ("error" in chunk) {
                const error = chunk.error;
                console.error(`OpenRouter API Error: ${error?.code} - ${error?.message}`);
                throw new Error(`OpenRouter API Error ${error?.code}: ${error?.message}`);
            }
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;
            if (delta) {
                if ("reasoning" in delta && delta.reasoning && typeof delta.reasoning === "string") {
                    yield { type: "reasoning", text: delta.reasoning };
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
                    yield { type: "text", text: delta.content };
                }
            }
            // When finish_reason is 'tool_calls', yield all accumulated tool calls
            if (finishReason === "tool_calls" && toolCallAccumulator.size > 0) {
                for (const toolCall of toolCallAccumulator.values()) {
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
            yield {
                type: "usage",
                inputTokens: lastUsage.prompt_tokens || 0,
                outputTokens: lastUsage.completion_tokens || 0,
                cacheReadTokens: lastUsage.prompt_tokens_details?.cached_tokens,
                reasoningTokens: lastUsage.completion_tokens_details?.reasoning_tokens,
                totalCost: (lastUsage.cost_details?.upstream_inference_cost || 0) + (lastUsage.cost || 0),
            };
        }
    }
    async fetchModel() {
        const [models, endpoints] = await Promise.all([
            (0, modelCache_1.getModels)({ provider: "openrouter" }),
            (0, modelEndpointCache_1.getModelEndpoints)({
                router: "openrouter",
                modelId: this.options.openRouterModelId,
                endpoint: this.options.openRouterSpecificProvider,
            }),
        ]);
        this.models = models;
        this.endpoints = endpoints;
        return this.getModel();
    }
    getModel() {
        const id = this.options.openRouterModelId ?? types_1.openRouterDefaultModelId;
        let info = this.models[id] ?? types_1.openRouterDefaultModelInfo;
        // If a specific provider is requested, use the endpoint for that provider.
        if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
            info = this.endpoints[this.options.openRouterSpecificProvider];
        }
        const isDeepSeekR1 = id.startsWith("deepseek/deepseek-r1") || id === "perplexity/sonar-reasoning";
        const params = (0, model_params_1.getModelParams)({
            format: "openrouter",
            modelId: id,
            model: info,
            settings: this.options,
            defaultTemperature: isDeepSeekR1 ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0,
        });
        return { id, info, topP: isDeepSeekR1 ? 0.95 : undefined, ...params };
    }
    async completePrompt(prompt) {
        let { id: modelId, maxTokens, temperature, reasoning } = await this.fetchModel();
        const completionParams = {
            model: modelId,
            max_tokens: maxTokens,
            temperature,
            messages: [{ role: "user", content: prompt }],
            stream: false,
            // Only include provider if openRouterSpecificProvider is not "[default]".
            ...(this.options.openRouterSpecificProvider &&
                this.options.openRouterSpecificProvider !== types_1.OPENROUTER_DEFAULT_PROVIDER_NAME && {
                provider: {
                    order: [this.options.openRouterSpecificProvider],
                    only: [this.options.openRouterSpecificProvider],
                    allow_fallbacks: false,
                },
            }),
            ...(reasoning && { reasoning }),
        };
        let response;
        try {
            response = await this.client.chat.completions.create(completionParams);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
        if ("error" in response) {
            const error = response.error;
            throw new Error(`OpenRouter API Error ${error?.code}: ${error?.message}`);
        }
        const completion = response;
        return completion.choices[0]?.message?.content || "";
    }
    /**
     * Generate an image using OpenRouter's image generation API
     * @param prompt The text prompt for image generation
     * @param model The model to use for generation
     * @param apiKey The OpenRouter API key (must be explicitly provided)
     * @param inputImage Optional base64 encoded input image data URL
     * @returns The generated image data and format, or an error
     */
    async generateImage(prompt, model, apiKey, inputImage) {
        if (!apiKey) {
            return {
                success: false,
                error: "OpenRouter API key is required for image generation",
            };
        }
        try {
            const baseURL = this.options.openRouterBaseUrl || "https://openrouter.ai/api/v1";
            const response = await fetch(`${baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/RooVetGit/Roo-Code",
                    "X-Title": "Roo Code",
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: inputImage
                                ? [
                                    {
                                        type: "text",
                                        text: prompt,
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: inputImage,
                                        },
                                    },
                                ]
                                : prompt,
                        },
                    ],
                    modalities: ["image", "text"],
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Failed to generate image: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error?.message) {
                        errorMessage = `Failed to generate image: ${errorJson.error.message}`;
                    }
                }
                catch {
                    // Use default error message
                }
                return {
                    success: false,
                    error: errorMessage,
                };
            }
            const result = await response.json();
            if (result.error) {
                return {
                    success: false,
                    error: `Failed to generate image: ${result.error.message}`,
                };
            }
            // Extract the generated image from the response
            const images = result.choices?.[0]?.message?.images;
            if (!images || images.length === 0) {
                return {
                    success: false,
                    error: "No image was generated in the response",
                };
            }
            const imageData = images[0]?.image_url?.url;
            if (!imageData) {
                return {
                    success: false,
                    error: "Invalid image data in response",
                };
            }
            // Extract base64 data from data URL
            const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
            if (!base64Match) {
                return {
                    success: false,
                    error: "Invalid image format received",
                };
            }
            return {
                success: true,
                imageData: imageData,
                imageFormat: base64Match[1],
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }
}
exports.OpenRouterHandler = OpenRouterHandler;
//# sourceMappingURL=openrouter.js.map