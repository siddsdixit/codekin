"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolCallParser = void 0;
const types_1 = require("@roo-code/types");
const tools_1 = require("../../shared/tools");
/**
 * Parser for native tool calls (OpenAI-style function calling).
 * Converts native tool call format to ToolUse format for compatibility
 * with existing tool execution infrastructure.
 *
 * For tools with refactored parsers (e.g., read_file), this parser provides
 * typed arguments via nativeArgs. Tool-specific handlers should consume
 * nativeArgs directly rather than relying on synthesized legacy params.
 */
class NativeToolCallParser {
    /**
     * Convert a native tool call chunk to a ToolUse object.
     *
     * @param toolCall - The native tool call from the API stream
     * @returns A properly typed ToolUse object
     */
    static parseToolCall(toolCall) {
        // Check if this is a dynamic MCP tool (mcp_serverName_toolName)
        if (typeof toolCall.name === "string" && toolCall.name.startsWith("mcp_")) {
            return this.parseDynamicMcpTool(toolCall);
        }
        // Validate tool name
        if (!types_1.toolNames.includes(toolCall.name)) {
            console.error(`Invalid tool name: ${toolCall.name}`);
            console.error(`Valid tool names:`, types_1.toolNames);
            return null;
        }
        try {
            // Parse the arguments JSON string
            const args = JSON.parse(toolCall.arguments);
            // Build legacy params object for backward compatibility with XML protocol and UI.
            // Native execution path uses nativeArgs instead, which has proper typing.
            const params = {};
            for (const [key, value] of Object.entries(args)) {
                // Skip complex parameters that have been migrated to nativeArgs.
                // For read_file, the 'files' parameter is a FileEntry[] array that can't be
                // meaningfully stringified. The properly typed data is in nativeArgs instead.
                if (toolCall.name === "read_file" && key === "files") {
                    continue;
                }
                // Validate parameter name
                if (!tools_1.toolParamNames.includes(key)) {
                    console.warn(`Unknown parameter '${key}' for tool '${toolCall.name}'`);
                    console.warn(`Valid param names:`, tools_1.toolParamNames);
                    continue;
                }
                // Convert to string for legacy params format
                const stringValue = typeof value === "string" ? value : JSON.stringify(value);
                params[key] = stringValue;
            }
            // Build typed nativeArgs for tools that support it.
            // This switch statement serves two purposes:
            // 1. Validation: Ensures required parameters are present before constructing nativeArgs
            // 2. Transformation: Converts raw JSON to properly typed structures
            //
            // Each case validates the minimum required parameters and constructs a properly typed
            // nativeArgs object. If validation fails, nativeArgs remains undefined and the tool
            // will fall back to legacy parameter parsing if supported.
            let nativeArgs = undefined;
            switch (toolCall.name) {
                case "read_file":
                    if (args.files && Array.isArray(args.files)) {
                        nativeArgs = { files: args.files };
                    }
                    break;
                case "attempt_completion":
                    if (args.result) {
                        nativeArgs = { result: args.result };
                    }
                    break;
                case "execute_command":
                    if (args.command) {
                        nativeArgs = {
                            command: args.command,
                            cwd: args.cwd,
                        };
                    }
                    break;
                case "insert_content":
                    if (args.path !== undefined && args.line !== undefined && args.content !== undefined) {
                        nativeArgs = {
                            path: args.path,
                            line: typeof args.line === "number" ? args.line : parseInt(String(args.line), 10),
                            content: args.content,
                        };
                    }
                    break;
                case "apply_diff":
                    if (args.path !== undefined && args.diff !== undefined) {
                        nativeArgs = {
                            path: args.path,
                            diff: args.diff,
                        };
                    }
                    break;
                case "ask_followup_question":
                    if (args.question !== undefined && args.follow_up !== undefined) {
                        nativeArgs = {
                            question: args.question,
                            follow_up: args.follow_up,
                        };
                    }
                    break;
                case "browser_action":
                    if (args.action !== undefined) {
                        nativeArgs = {
                            action: args.action,
                            url: args.url,
                            coordinate: args.coordinate,
                            size: args.size,
                            text: args.text,
                        };
                    }
                    break;
                case "codebase_search":
                    if (args.query !== undefined) {
                        nativeArgs = {
                            query: args.query,
                            path: args.path,
                        };
                    }
                    break;
                case "fetch_instructions":
                    if (args.task !== undefined) {
                        nativeArgs = {
                            task: args.task,
                        };
                    }
                    break;
                case "generate_image":
                    if (args.prompt !== undefined && args.path !== undefined) {
                        nativeArgs = {
                            prompt: args.prompt,
                            path: args.path,
                            image: args.image,
                        };
                    }
                    break;
                case "list_code_definition_names":
                    if (args.path !== undefined) {
                        nativeArgs = {
                            path: args.path,
                        };
                    }
                    break;
                case "run_slash_command":
                    if (args.command !== undefined) {
                        nativeArgs = {
                            command: args.command,
                            args: args.args,
                        };
                    }
                    break;
                case "search_files":
                    if (args.path !== undefined && args.regex !== undefined) {
                        nativeArgs = {
                            path: args.path,
                            regex: args.regex,
                            file_pattern: args.file_pattern,
                        };
                    }
                    break;
                case "switch_mode":
                    if (args.mode_slug !== undefined && args.reason !== undefined) {
                        nativeArgs = {
                            mode_slug: args.mode_slug,
                            reason: args.reason,
                        };
                    }
                    break;
                case "update_todo_list":
                    if (args.todos !== undefined) {
                        nativeArgs = {
                            todos: args.todos,
                        };
                    }
                    break;
                case "write_to_file":
                    if (args.path !== undefined && args.content !== undefined && args.line_count !== undefined) {
                        nativeArgs = {
                            path: args.path,
                            content: args.content,
                            line_count: typeof args.line_count === "number"
                                ? args.line_count
                                : parseInt(String(args.line_count), 10),
                        };
                    }
                    break;
                case "use_mcp_tool":
                    if (args.server_name !== undefined && args.tool_name !== undefined) {
                        nativeArgs = {
                            server_name: args.server_name,
                            tool_name: args.tool_name,
                            arguments: args.arguments,
                        };
                    }
                    break;
                default:
                    break;
            }
            const result = {
                type: "tool_use",
                name: toolCall.name,
                params,
                partial: false, // Native tool calls are always complete when yielded
                nativeArgs,
            };
            return result;
        }
        catch (error) {
            console.error(`Failed to parse tool call arguments:`, error);
            console.error(`Error details:`, error instanceof Error ? error.message : String(error));
            return null;
        }
    }
    /**
     * Parse dynamic MCP tools (named mcp_serverName_toolName).
     * These are generated dynamically by getMcpServerTools() and need to be
     * converted back to use_mcp_tool format.
     */
    static parseDynamicMcpTool(toolCall) {
        try {
            const args = JSON.parse(toolCall.arguments);
            // Extract server_name and tool_name from the arguments
            // The dynamic tool schema includes these as const properties
            const serverName = args.server_name;
            const toolName = args.tool_name;
            const toolInputProps = args.toolInputProps;
            if (!serverName || !toolName) {
                console.error(`Missing server_name or tool_name in dynamic MCP tool`);
                return null;
            }
            // Build params for backward compatibility with XML protocol
            const params = {
                server_name: serverName,
                tool_name: toolName,
            };
            if (toolInputProps) {
                params.arguments = JSON.stringify(toolInputProps);
            }
            // Build nativeArgs with properly typed structure
            const nativeArgs = {
                server_name: serverName,
                tool_name: toolName,
                arguments: toolInputProps,
            };
            const result = {
                type: "tool_use",
                name: "use_mcp_tool",
                params,
                partial: false,
                nativeArgs,
            };
            return result;
        }
        catch (error) {
            console.error(`Failed to parse dynamic MCP tool:`, error);
            return null;
        }
    }
}
exports.NativeToolCallParser = NativeToolCallParser;
//# sourceMappingURL=NativeToolCallParser.js.map