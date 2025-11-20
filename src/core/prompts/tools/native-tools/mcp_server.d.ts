import type OpenAI from "openai";
import { McpHub } from "../../../../services/mcp/McpHub";
/**
 * Dynamically generates native tool definitions for all enabled tools across connected MCP servers.
 *
 * @param mcpHub The McpHub instance containing connected servers.
 * @returns An array of OpenAI.Chat.ChatCompletionTool definitions.
 */
export declare function getMcpServerTools(mcpHub?: McpHub): OpenAI.Chat.ChatCompletionTool[];
//# sourceMappingURL=mcp_server.d.ts.map