"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooModels = getRooModels;
const types_1 = require("@roo-code/types");
const cost_1 = require("../../../shared/cost");
const constants_1 = require("../constants");
/**
 * Fetches available models from the Roo Code Cloud provider
 *
 * @param baseUrl The base URL of the Roo Code Cloud provider
 * @param apiKey The API key (session token) for the Roo Code Cloud provider
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails or the response is not as expected.
 */
async function getRooModels(baseUrl, apiKey) {
    // Construct the models endpoint URL early so it's available in catch block for logging
    // Strip trailing /v1 or /v1/ to avoid /v1/v1/models
    const normalizedBase = baseUrl.replace(/\/?v1\/?$/, "");
    const url = `${normalizedBase}/v1/models`;
    try {
        const headers = {
            "Content-Type": "application/json",
            ...constants_1.DEFAULT_HEADERS,
        };
        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }
        // Use fetch with AbortController for better timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(url, {
                headers,
                signal: controller.signal,
            });
            if (!response.ok) {
                // Log detailed error information
                let errorBody = "";
                try {
                    errorBody = await response.text();
                }
                catch {
                    errorBody = "(unable to read response body)";
                }
                console.error(`[getRooModels] HTTP error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    body: errorBody,
                });
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const models = {};
            // Validate response against schema
            const parsed = types_1.RooModelsResponseSchema.safeParse(data);
            if (!parsed.success) {
                console.error("Error fetching Roo Code Cloud models: Unexpected response format", data);
                console.error("Validation errors:", parsed.error.format());
                throw new Error("Failed to fetch Roo Code Cloud models: Unexpected response format.");
            }
            // Process the validated model data
            for (const model of parsed.data.data) {
                const modelId = model.id;
                if (!modelId)
                    continue;
                // Extract model data from the validated API response
                // All required fields are guaranteed by the schema
                const contextWindow = model.context_window;
                const maxTokens = model.max_tokens;
                const tags = model.tags || [];
                const pricing = model.pricing;
                // Determine if the model supports images based on tags
                const supportsImages = tags.includes("vision");
                // Determine if the model supports reasoning effort based on tags
                const supportsReasoningEffort = tags.includes("reasoning");
                // Determine if the model requires reasoning effort based on tags
                const requiredReasoningEffort = tags.includes("reasoning-required");
                // Determine if the model supports native tool calling based on tags
                const supportsNativeTools = tags.includes("tool-use");
                // Parse pricing (API returns strings, convert to numbers)
                const inputPrice = (0, cost_1.parseApiPrice)(pricing.input);
                const outputPrice = (0, cost_1.parseApiPrice)(pricing.output);
                const cacheReadPrice = pricing.input_cache_read ? (0, cost_1.parseApiPrice)(pricing.input_cache_read) : undefined;
                const cacheWritePrice = pricing.input_cache_write ? (0, cost_1.parseApiPrice)(pricing.input_cache_write) : undefined;
                // Build the base model info from API response
                const baseModelInfo = {
                    maxTokens,
                    contextWindow,
                    supportsImages,
                    supportsReasoningEffort,
                    requiredReasoningEffort,
                    supportsNativeTools,
                    supportsPromptCache: Boolean(cacheReadPrice !== undefined),
                    inputPrice,
                    outputPrice,
                    cacheWritesPrice: cacheWritePrice,
                    cacheReadsPrice: cacheReadPrice,
                    description: model.description || model.name,
                    deprecated: model.deprecated || false,
                    isFree: tags.includes("free"),
                };
                // Merge with model-specific defaults if they exist
                // Defaults take precedence over dynamically fetched data for specified fields
                const modelDefaults = types_1.rooModelDefaults[modelId];
                models[modelId] = modelDefaults ? { ...baseModelInfo, ...modelDefaults } : baseModelInfo;
            }
            return models;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    catch (error) {
        // Enhanced error logging
        console.error("[getRooModels] Error fetching Roo Code Cloud models:", {
            message: error.message || String(error),
            name: error.name,
            stack: error.stack,
            url,
            hasApiKey: Boolean(apiKey),
        });
        // Handle abort/timeout
        if (error.name === "AbortError") {
            throw new Error("Failed to fetch Roo Code Cloud models: Request timed out after 10 seconds.");
        }
        // Handle fetch errors
        if (error.message?.includes("HTTP")) {
            throw new Error(`Failed to fetch Roo Code Cloud models: ${error.message}. Check base URL and API key.`);
        }
        // Handle network errors
        if (error instanceof TypeError) {
            throw new Error("Failed to fetch Roo Code Cloud models: No response from server. Check Roo Code Cloud server status and base URL.");
        }
        throw new Error(`Failed to fetch Roo Code Cloud models: ${error.message || "An unknown error occurred."}`);
    }
}
//# sourceMappingURL=roo.js.map