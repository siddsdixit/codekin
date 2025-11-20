"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestyHandler = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("@roo-code/types");
const cost_1 = require("../../shared/cost");
const openai_format_1 = require("../transform/openai-format");
const model_params_1 = require("../transform/model-params");
const constants_1 = require("./constants");
const modelCache_1 = require("./fetchers/modelCache");
const base_provider_1 = require("./base-provider");
const requesty_1 = require("../../shared/utils/requesty");
const openai_error_handler_1 = require("./utils/openai-error-handler");
class RequestyHandler extends base_provider_1.BaseProvider {
    options;
    models = {};
    client;
    baseURL;
    providerName = "Requesty";
    constructor(options) {
        super();
        this.options = options;
        this.baseURL = (0, requesty_1.toRequestyServiceUrl)(options.requestyBaseUrl);
        const apiKey = this.options.requestyApiKey ?? "not-provided";
        this.client = new openai_1.default({
            baseURL: this.baseURL,
            apiKey: apiKey,
            defaultHeaders: constants_1.DEFAULT_HEADERS,
        });
    }
    async fetchModel() {
        this.models = await (0, modelCache_1.getModels)({ provider: "requesty", baseUrl: this.baseURL });
        return this.getModel();
    }
    getModel() {
        const id = this.options.requestyModelId ?? types_1.requestyDefaultModelId;
        const info = this.models[id] ?? types_1.requestyDefaultModelInfo;
        const params = (0, model_params_1.getModelParams)({
            format: "anthropic",
            modelId: id,
            model: info,
            settings: this.options,
        });
        return { id, info, ...params };
    }
    processUsageMetrics(usage, modelInfo) {
        const requestyUsage = usage;
        const inputTokens = requestyUsage?.prompt_tokens || 0;
        const outputTokens = requestyUsage?.completion_tokens || 0;
        const cacheWriteTokens = requestyUsage?.prompt_tokens_details?.caching_tokens || 0;
        const cacheReadTokens = requestyUsage?.prompt_tokens_details?.cached_tokens || 0;
        const { totalCost } = modelInfo
            ? (0, cost_1.calculateApiCostOpenAI)(modelInfo, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens)
            : { totalCost: 0 };
        return {
            type: "usage",
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            cacheWriteTokens: cacheWriteTokens,
            cacheReadTokens: cacheReadTokens,
            totalCost: totalCost,
        };
    }
    async *createMessage(systemPrompt, messages, metadata) {
        const { id: model, info, maxTokens: max_tokens, temperature, reasoningEffort: reasoning_effort, reasoning: thinking, } = await this.fetchModel();
        const openAiMessages = [
            { role: "system", content: systemPrompt },
            ...(0, openai_format_1.convertToOpenAiMessages)(messages),
        ];
        // Map extended efforts to OpenAI Chat Completions-accepted values (omit unsupported)
        const allowedEffort = ["low", "medium", "high"].includes(reasoning_effort)
            ? reasoning_effort
            : undefined;
        const completionParams = {
            messages: openAiMessages,
            model,
            max_tokens,
            temperature,
            ...(allowedEffort && { reasoning_effort: allowedEffort }),
            ...(thinking && { thinking }),
            stream: true,
            stream_options: { include_usage: true },
            requesty: { trace_id: metadata?.taskId, extra: { mode: metadata?.mode } },
        };
        let stream;
        try {
            // With streaming params type, SDK returns an async iterable stream
            stream = await this.client.chat.completions.create(completionParams);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
        let lastUsage = undefined;
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
                yield { type: "text", text: delta.content };
            }
            if (delta && "reasoning_content" in delta && delta.reasoning_content) {
                yield { type: "reasoning", text: delta.reasoning_content || "" };
            }
            if (chunk.usage) {
                lastUsage = chunk.usage;
            }
        }
        if (lastUsage) {
            yield this.processUsageMetrics(lastUsage, info);
        }
    }
    async completePrompt(prompt) {
        const { id: model, maxTokens: max_tokens, temperature } = await this.fetchModel();
        let openAiMessages = [{ role: "system", content: prompt }];
        const completionParams = {
            model,
            max_tokens,
            messages: openAiMessages,
            temperature: temperature,
        };
        let response;
        try {
            response = await this.client.chat.completions.create(completionParams);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
        return response.choices[0]?.message.content || "";
    }
}
exports.RequestyHandler = RequestyHandler;
//# sourceMappingURL=requesty.js.map