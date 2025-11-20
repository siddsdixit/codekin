"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxHandler = void 0;
const types_1 = require("@roo-code/types");
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider");
class MiniMaxHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
    constructor(options) {
        super({
            ...options,
            providerName: "MiniMax",
            baseURL: options.minimaxBaseUrl ?? "https://api.minimax.io/v1",
            apiKey: options.minimaxApiKey,
            defaultProviderModelId: types_1.minimaxDefaultModelId,
            providerModels: types_1.minimaxModels,
            defaultTemperature: 1.0,
        });
    }
}
exports.MiniMaxHandler = MiniMaxHandler;
//# sourceMappingURL=minimax.js.map