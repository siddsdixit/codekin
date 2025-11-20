"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChutesHandler = void 0;
const types_1 = require("@roo-code/types");
const api_1 = require("../../shared/api");
const xml_matcher_1 = require("../../utils/xml-matcher");
const r1_format_1 = require("../transform/r1-format");
const openai_format_1 = require("../transform/openai-format");
const router_provider_1 = require("./router-provider");
class ChutesHandler extends router_provider_1.RouterProvider {
    constructor(options) {
        super({
            options,
            name: "chutes",
            baseURL: "https://llm.chutes.ai/v1",
            apiKey: options.chutesApiKey,
            modelId: options.apiModelId,
            defaultModelId: types_1.chutesDefaultModelId,
            defaultModelInfo: types_1.chutesDefaultModelInfo,
        });
    }
    getCompletionParams(systemPrompt, messages) {
        const { id: model, info } = this.getModel();
        // Centralized cap: clamp to 20% of the context window (unless provider-specific exceptions apply)
        const max_tokens = (0, api_1.getModelMaxOutputTokens)({
            modelId: model,
            model: info,
            settings: this.options,
            format: "openai",
        }) ?? undefined;
        const params = {
            model,
            max_tokens,
            messages: [{ role: "system", content: systemPrompt }, ...(0, openai_format_1.convertToOpenAiMessages)(messages)],
            stream: true,
            stream_options: { include_usage: true },
        };
        // Only add temperature if model supports it
        if (this.supportsTemperature(model)) {
            params.temperature = this.options.modelTemperature ?? info.temperature;
        }
        return params;
    }
    async *createMessage(systemPrompt, messages, metadata) {
        const model = await this.fetchModel();
        if (model.id.includes("DeepSeek-R1")) {
            const stream = await this.client.chat.completions.create({
                ...this.getCompletionParams(systemPrompt, messages),
                messages: (0, r1_format_1.convertToR1Format)([{ role: "user", content: systemPrompt }, ...messages]),
            });
            const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
                type: chunk.matched ? "reasoning" : "text",
                text: chunk.data,
            }));
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                if (delta?.content) {
                    for (const processedChunk of matcher.update(delta.content)) {
                        yield processedChunk;
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
        else {
            // For non-DeepSeek-R1 models, use standard OpenAI streaming
            const stream = await this.client.chat.completions.create(this.getCompletionParams(systemPrompt, messages));
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                if (delta?.content) {
                    yield { type: "text", text: delta.content };
                }
                if (delta && "reasoning_content" in delta && delta.reasoning_content) {
                    yield { type: "reasoning", text: delta.reasoning_content || "" };
                }
                if (chunk.usage) {
                    yield {
                        type: "usage",
                        inputTokens: chunk.usage.prompt_tokens || 0,
                        outputTokens: chunk.usage.completion_tokens || 0,
                    };
                }
            }
        }
    }
    async completePrompt(prompt) {
        const model = await this.fetchModel();
        const { id: modelId, info } = model;
        try {
            // Centralized cap: clamp to 20% of the context window (unless provider-specific exceptions apply)
            const max_tokens = (0, api_1.getModelMaxOutputTokens)({
                modelId,
                model: info,
                settings: this.options,
                format: "openai",
            }) ?? undefined;
            const requestParams = {
                model: modelId,
                messages: [{ role: "user", content: prompt }],
                max_tokens,
            };
            // Only add temperature if model supports it
            if (this.supportsTemperature(modelId)) {
                const isDeepSeekR1 = modelId.includes("DeepSeek-R1");
                const defaultTemperature = isDeepSeekR1 ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0.5;
                requestParams.temperature = this.options.modelTemperature ?? defaultTemperature;
            }
            const response = await this.client.chat.completions.create(requestParams);
            return response.choices[0]?.message.content || "";
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Chutes completion error: ${error.message}`);
            }
            throw error;
        }
    }
    getModel() {
        const model = super.getModel();
        const isDeepSeekR1 = model.id.includes("DeepSeek-R1");
        return {
            ...model,
            info: {
                ...model.info,
                temperature: isDeepSeekR1 ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0.5,
            },
        };
    }
}
exports.ChutesHandler = ChutesHandler;
//# sourceMappingURL=chutes.js.map