"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    type: "function",
    function: {
        name: "switch_mode",
        description: "Request a switch to a different assistant mode. The user must approve the change before it takes effect.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                mode_slug: {
                    type: "string",
                    description: "Slug of the mode to switch to (e.g., code, ask, architect)",
                },
                reason: {
                    type: "string",
                    description: "Explanation for why the mode switch is needed",
                },
            },
            required: ["mode_slug", "reason"],
            additionalProperties: false,
        },
    },
};
//# sourceMappingURL=switch_mode.js.map