"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiReasoning = exports.getOpenAiReasoning = exports.getAnthropicReasoning = exports.getRooReasoning = exports.getOpenRouterReasoning = void 0;
const api_1 = require("../../shared/api");
const getOpenRouterReasoning = ({ model, reasoningBudget, reasoningEffort, settings, }) => (0, api_1.shouldUseReasoningBudget)({ model, settings })
    ? { max_tokens: reasoningBudget }
    : (0, api_1.shouldUseReasoningEffort)({ model, settings })
        ? reasoningEffort && reasoningEffort !== "disable"
            ? { effort: reasoningEffort }
            : undefined
        : undefined;
exports.getOpenRouterReasoning = getOpenRouterReasoning;
const getRooReasoning = ({ model, reasoningEffort, settings, }) => {
    // Check if model supports reasoning effort
    if (!model.supportsReasoningEffort)
        return undefined;
    // Explicit off switch from settings: always send disabled for back-compat and to
    // prevent automatic reasoning when the toggle is turned off.
    if (settings.enableReasoningEffort === false) {
        return { enabled: false };
    }
    // For Roo models that support reasoning effort, absence of a selection should be
    // treated as an explicit "off" signal so that the backend does not auto-enable
    // reasoning. This aligns with the default behavior in tests.
    if (!reasoningEffort) {
        return { enabled: false };
    }
    // "disable" is a legacy sentinel that means "omit the reasoning field entirely"
    // and let the server decide any defaults.
    if (reasoningEffort === "disable") {
        return undefined;
    }
    // For Roo, "minimal" is treated as "none" for effort-based reasoning – we omit
    // the reasoning field entirely instead of sending an explicit effort.
    if (reasoningEffort === "minimal") {
        return undefined;
    }
    // When an effort is provided (e.g. "low" | "medium" | "high" | "none"), enable
    // with the selected effort.
    return { enabled: true, effort: reasoningEffort };
};
exports.getRooReasoning = getRooReasoning;
const getAnthropicReasoning = ({ model, reasoningBudget, settings, }) => (0, api_1.shouldUseReasoningBudget)({ model, settings }) ? { type: "enabled", budget_tokens: reasoningBudget } : undefined;
exports.getAnthropicReasoning = getAnthropicReasoning;
const getOpenAiReasoning = ({ model, reasoningEffort, settings, }) => {
    if (!(0, api_1.shouldUseReasoningEffort)({ model, settings }))
        return undefined;
    if (reasoningEffort === "disable" || !reasoningEffort)
        return undefined;
    // Include "none" | "minimal" | "low" | "medium" | "high" literally
    return { reasoning_effort: reasoningEffort };
};
exports.getOpenAiReasoning = getOpenAiReasoning;
const getGeminiReasoning = ({ model, reasoningBudget, settings, }) => (0, api_1.shouldUseReasoningBudget)({ model, settings })
    ? { thinkingBudget: reasoningBudget, includeThoughts: true }
    : undefined;
exports.getGeminiReasoning = getGeminiReasoning;
//# sourceMappingURL=reasoning.js.map