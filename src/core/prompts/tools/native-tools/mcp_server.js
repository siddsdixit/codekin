"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcpServerTools = getMcpServerTools;
/**
 * Dynamically generates native tool definitions for all enabled tools across connected MCP servers.
 *
 * @param mcpHub The McpHub instance containing connected servers.
 * @returns An array of OpenAI.Chat.ChatCompletionTool definitions.
 */
function getMcpServerTools(mcpHub) {
    if (!mcpHub) {
        return [];
    }
    const servers = mcpHub.getServers();
    const tools = [];
    for (const server of servers) {
        if (!server.tools) {
            continue;
        }
        for (const tool of server.tools) {
            // Filter tools where tool.enabledForPrompt is not explicitly false
            if (tool.enabledForPrompt === false) {
                continue;
            }
            const originalSchema = tool.inputSchema;
            const toolInputProps = originalSchema?.properties ?? {};
            const toolInputRequired = (originalSchema?.required ?? []);
            // Create a proper JSON Schema object for toolInputProps
            const toolInputPropsSchema = {
                type: "object",
                properties: toolInputProps,
                additionalProperties: false,
            };
            // Only add required if there are required fields
            if (toolInputRequired.length > 0) {
                toolInputPropsSchema.required = toolInputRequired;
            }
            // Build parameters with all properties defined before adding required array
            const parameters = {
                type: "object",
                properties: {
                    toolInputProps: toolInputPropsSchema,
                    server_name: {
                        type: "string",
                        const: server.name,
                    },
                    tool_name: {
                        type: "string",
                        const: tool.name,
                    },
                },
                required: ["server_name", "tool_name", "toolInputProps"],
                additionalProperties: false,
            };
            // Use triple underscores as separator to allow underscores in tool and server names
            const toolDefinition = {
                type: "function",
                function: {
                    name: `mcp_${server.name}_${tool.name}`,
                    description: tool.description,
                    parameters: parameters,
                },
            };
            tools.push(toolDefinition);
        }
    }
    return tools;
}
//# sourceMappingURL=mcp_server.js.map