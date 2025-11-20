"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOpenAiCompatibleProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const api_1 = require("../../shared/api");
const xml_matcher_1 = require("../../utils/xml-matcher");
const openai_format_1 = require("../transform/openai-format");
const constants_1 = require("./constants");
const base_provider_1 = require("./base-provider");
const openai_error_handler_1 = require("./utils/openai-error-handler");
class BaseOpenAiCompatibleProvider extends base_provider_1.BaseProvider {
    providerName;
    baseURL;
    defaultTemperature;
    defaultProviderModelId;
    providerModels;
    options;
    client;
    constructor({ providerName, baseURL, defaultProviderModelId, providerModels, defaultTemperature, ...options }) {
        super();
        this.providerName = providerName;
        this.baseURL = baseURL;
        this.defaultProviderModelId = defaultProviderModelId;
        this.providerModels = providerModels;
        this.defaultTemperature = defaultTemperature ?? 0;
        this.options = options;
        if (!this.options.apiKey) {
            throw new Error("API key is required");
        }
        this.client = new openai_1.default({
            baseURL,
            apiKey: this.options.apiKey,
            defaultHeaders: constants_1.DEFAULT_HEADERS,
        });
    }
    createStream(systemPrompt, messages, metadata, requestOptions) {
        const { id: model, info } = this.getModel();
        // Centralized cap: clamp to 20% of the context window (unless provider-specific exceptions apply)
        const max_tokens = (0, api_1.getModelMaxOutputTokens)({
            modelId: model,
            model: info,
            settings: this.options,
            format: "openai",
        }) ?? undefined;
        const temperature = this.options.modelTemperature ?? this.defaultTemperature;
        const params = {
            model,
            max_tokens,
            temperature,
            messages: [{ role: "system", content: systemPrompt }, ...(0, openai_format_1.convertToOpenAiMessages)(messages)],
            stream: true,
            stream_options: { include_usage: true },
        };
        try {
            return this.client.chat.completions.create(params, requestOptions);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
    }
    async *createMessage(systemPrompt, messages, metadata) {
        const stream = await this.createStream(systemPrompt, messages, metadata);
        const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
            type: chunk.matched ? "reasoning" : "text",
            text: chunk.data,
        }));
        for await (const chunk of stream) {
            // Check for provider-specific error responses (e.g., MiniMax base_resp)
            const chunkAny = chunk;
            if (chunkAny.base_resp?.status_code && chunkAny.base_resp.status_code !== 0) {
                throw new Error(`${this.providerName} API Error (${chunkAny.base_resp.status_code}): ${chunkAny.base_resp.status_msg || "Unknown error"}`);
            }
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
                for (const processedChunk of matcher.update(delta.content)) {
                    yield processedChunk;
                }
            }
            if (delta && "reasoning_content" in delta) {
                const reasoning_content = delta.reasoning_content || "";
                if (reasoning_content?.trim()) {
                    yield { type: "reasoning", text: reasoning_content };
                }
            }
            if (chunk.usage) {
                yield {
                    type: "usage",
                    inputTokens: chunk.usage.prompt_tokens || 0,
                    outputTokens: chunk.usage.completion_tokens || 0,
                };
            }
        }
        // Process any remaining content
        for (const processedChunk of matcher.final()) {
            yield processedChunk;
        }
    }
    async completePrompt(prompt) {
        const { id: modelId } = this.getModel();
        try {
            const response = await this.client.chat.completions.create({
                model: modelId,
                messages: [{ role: "user", content: prompt }],
            });
            // Check for provider-specific error responses (e.g., MiniMax base_resp)
            const responseAny = response;
            if (responseAny.base_resp?.status_code && responseAny.base_resp.status_code !== 0) {
                throw new Error(`${this.providerName} API Error (${responseAny.base_resp.status_code}): ${responseAny.base_resp.status_msg || "Unknown error"}`);
            }
            return response.choices?.[0]?.message.content || "";
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
    }
    getModel() {
        const id = this.options.apiModelId && this.options.apiModelId in this.providerModels
            ? this.options.apiModelId
            : this.defaultProviderModelId;
        return { id, info: this.providerModels[id] };
    }
}
exports.BaseOpenAiCompatibleProvider = BaseOpenAiCompatibleProvider;
//# sourceMappingURL=base-openai-compatible-provider.js.map