"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZAiHandler = void 0;
const types_1 = require("@roo-code/types");
const api_1 = require("../../shared/api");
const openai_format_1 = require("../transform/openai-format");
const openai_error_handler_1 = require("./utils/openai-error-handler");
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider");
class ZAiHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
    constructor(options) {
        const isChina = types_1.zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].isChina;
        const models = (isChina ? types_1.mainlandZAiModels : types_1.internationalZAiModels);
        const defaultModelId = (isChina ? types_1.mainlandZAiDefaultModelId : types_1.internationalZAiDefaultModelId);
        super({
            ...options,
            providerName: "Z AI",
            baseURL: types_1.zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].baseUrl,
            apiKey: options.zaiApiKey ?? "not-provided",
            defaultProviderModelId: defaultModelId,
            providerModels: models,
            defaultTemperature: types_1.ZAI_DEFAULT_TEMPERATURE,
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
        // Add thinking parameter if reasoning is enabled and model supports it
        const { id: modelId, info: modelInfo } = this.getModel();
        if (this.options.enableReasoningEffort && modelInfo.supportsReasoningBinary) {
            ;
            params.thinking = { type: "enabled" };
        }
        try {
            return this.client.chat.completions.create(params, requestOptions);
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
    }
    async completePrompt(prompt) {
        const { id: modelId } = this.getModel();
        const params = {
            model: modelId,
            messages: [{ role: "user", content: prompt }],
        };
        // Add thinking parameter if reasoning is enabled and model supports it
        const { info: modelInfo } = this.getModel();
        if (this.options.enableReasoningEffort && modelInfo.supportsReasoningBinary) {
            ;
            params.thinking = { type: "enabled" };
        }
        try {
            const response = await this.client.chat.completions.create(params);
            return response.choices[0]?.message.content || "";
        }
        catch (error) {
            throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName);
        }
    }
}
exports.ZAiHandler = ZAiHandler;
//# sourceMappingURL=zai.js.map