import type OpenAI from "openai";
import type { ModeConfig, ToolName, ToolGroup } from "@roo-code/types";
import type { CodeIndexManager } from "../../../services/code-index/manager";
/**
 * Filters native tools based on mode restrictions.
 * This ensures native tools are filtered the same way XML tools are filtered in the system prompt.
 *
 * @param nativeTools - Array of all available native tools
 * @param mode - Current mode slug
 * @param customModes - Custom mode configurations
 * @param experiments - Experiment flags
 * @param codeIndexManager - Code index manager for codebase_search feature check
 * @param settings - Additional settings for tool filtering
 * @returns Filtered array of tools allowed for the mode
 */
export declare function filterNativeToolsForMode(nativeTools: OpenAI.Chat.ChatCompletionTool[], mode: string | undefined, customModes: ModeConfig[] | undefined, experiments: Record<string, boolean> | undefined, codeIndexManager?: CodeIndexManager, settings?: Record<string, any>): OpenAI.Chat.ChatCompletionTool[];
/**
 * Checks if a specific tool is allowed in the current mode.
 * This is useful for dynamically filtering system prompt content.
 *
 * @param toolName - Name of the tool to check
 * @param mode - Current mode slug
 * @param customModes - Custom mode configurations
 * @param experiments - Experiment flags
 * @param codeIndexManager - Code index manager for codebase_search feature check
 * @param settings - Additional settings for tool filtering
 * @returns true if the tool is allowed in the mode, false otherwise
 */
export declare function isToolAllowedInMode(toolName: ToolName, mode: string | undefined, customModes: ModeConfig[] | undefined, experiments: Record<string, boolean> | undefined, codeIndexManager?: CodeIndexManager, settings?: Record<string, any>): boolean;
/**
 * Gets the list of available tools from a specific tool group for the current mode.
 * This is useful for dynamically building system prompt content based on available tools.
 *
 * @param groupName - Name of the tool group to check
 * @param mode - Current mode slug
 * @param customModes - Custom mode configurations
 * @param experiments - Experiment flags
 * @param codeIndexManager - Code index manager for codebase_search feature check
 * @param settings - Additional settings for tool filtering
 * @returns Array of tool names that are available from the group
 */
export declare function getAvailableToolsInGroup(groupName: ToolGroup, mode: string | undefined, customModes: ModeConfig[] | undefined, experiments: Record<string, boolean> | undefined, codeIndexManager?: CodeIndexManager, settings?: Record<string, any>): ToolName[];
/**
 * Filters MCP tools based on whether use_mcp_tool is allowed in the current mode.
 *
 * @param mcpTools - Array of MCP tools
 * @param mode - Current mode slug
 * @param customModes - Custom mode configurations
 * @param experiments - Experiment flags
 * @returns Filtered array of MCP tools if use_mcp_tool is allowed, empty array otherwise
 */
export declare function filterMcpToolsForMode(mcpTools: OpenAI.Chat.ChatCompletionTool[], mode: string | undefined, customModes: ModeConfig[] | undefined, experiments: Record<string, boolean> | undefined): OpenAI.Chat.ChatCompletionTool[];
//# sourceMappingURL=filter-tools-for-mode.d.ts.map