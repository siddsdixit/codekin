import { type ToolName } from "@roo-code/types";
import { type ToolUse } from "../../shared/tools";
/**
 * Parser for native tool calls (OpenAI-style function calling).
 * Converts native tool call format to ToolUse format for compatibility
 * with existing tool execution infrastructure.
 *
 * For tools with refactored parsers (e.g., read_file), this parser provides
 * typed arguments via nativeArgs. Tool-specific handlers should consume
 * nativeArgs directly rather than relying on synthesized legacy params.
 */
export declare class NativeToolCallParser {
    /**
     * Convert a native tool call chunk to a ToolUse object.
     *
     * @param toolCall - The native tool call from the API stream
     * @returns A properly typed ToolUse object
     */
    static parseToolCall<TName extends ToolName>(toolCall: {
        id: string;
        name: TName;
        arguments: string;
    }): ToolUse<TName> | null;
    /**
     * Parse dynamic MCP tools (named mcp_serverName_toolName).
     * These are generated dynamically by getMcpServerTools() and need to be
     * converted back to use_mcp_tool format.
     */
    private static parseDynamicMcpTool;
}
//# sourceMappingURL=NativeToolCallParser.d.ts.map