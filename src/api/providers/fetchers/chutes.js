"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChutesModels = getChutesModels;
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const types_1 = require("@roo-code/types");
const constants_1 = require("../constants");
// Chutes models endpoint follows OpenAI /models shape with additional fields
const ChutesModelSchema = zod_1.z.object({
    id: zod_1.z.string(),
    object: zod_1.z.literal("model").optional(),
    owned_by: zod_1.z.string().optional(),
    created: zod_1.z.number().optional(),
    context_length: zod_1.z.number(),
    max_model_len: zod_1.z.number(),
    input_modalities: zod_1.z.array(zod_1.z.string()),
});
const ChutesModelsResponseSchema = zod_1.z.object({ data: zod_1.z.array(ChutesModelSchema) });
async function getChutesModels(apiKey) {
    const headers = { ...constants_1.DEFAULT_HEADERS };
    if (apiKey)
        headers["Authorization"] = `Bearer ${apiKey}`;
    const url = "https://llm.chutes.ai/v1/models";
    // Start with hardcoded models as the base
    const models = { ...types_1.chutesModels };
    try {
        const response = await axios_1.default.get(url, { headers });
        const parsed = ChutesModelsResponseSchema.safeParse(response.data);
        const data = parsed.success ? parsed.data.data : response.data?.data || [];
        for (const m of data) {
            // Extract from API response (all fields are required)
            const contextWindow = m.context_length;
            const maxTokens = m.max_model_len;
            const supportsImages = m.input_modalities.includes("image");
            const info = {
                maxTokens,
                contextWindow,
                supportsImages,
                supportsPromptCache: false,
                inputPrice: 0,
                outputPrice: 0,
                description: `Chutes AI model: ${m.id}`,
            };
            // Union: dynamic models override hardcoded ones if they have the same ID
            models[m.id] = info;
        }
    }
    catch (error) {
        console.error(`Error fetching Chutes models: ${error instanceof Error ? error.message : String(error)}`);
        // On error, still return hardcoded models
    }
    return models;
}
//# sourceMappingURL=chutes.js.map