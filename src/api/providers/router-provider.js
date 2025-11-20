"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_provider_1 = require("./base-provider");
const modelCache_1 = require("./fetchers/modelCache");
const constants_1 = require("./constants");
class RouterProvider extends base_provider_1.BaseProvider {
    options;
    name;
    models = {};
    modelId;
    defaultModelId;
    defaultModelInfo;
    client;
    constructor({ options, name, baseURL, apiKey = "not-provided", modelId, defaultModelId, defaultModelInfo, }) {
        super();
        this.options = options;
        this.name = name;
        this.modelId = modelId;
        this.defaultModelId = defaultModelId;
        this.defaultModelInfo = defaultModelInfo;
        this.client = new openai_1.default({
            baseURL,
            apiKey,
            defaultHeaders: {
                ...constants_1.DEFAULT_HEADERS,
                ...(options.openAiHeaders || {}),
            },
        });
    }
    async fetchModel() {
        this.models = await (0, modelCache_1.getModels)({ provider: this.name, apiKey: this.client.apiKey, baseUrl: this.client.baseURL });
        return this.getModel();
    }
    getModel() {
        const id = this.modelId ?? this.defaultModelId;
        return this.models[id]
            ? { id, info: this.models[id] }
            : { id: this.defaultModelId, info: this.defaultModelInfo };
    }
    supportsTemperature(modelId) {
        return !modelId.startsWith("openai/o3-mini");
    }
}
exports.RouterProvider = RouterProvider;
//# sourceMappingURL=router-provider.js.map