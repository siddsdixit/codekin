"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNativeToolsForMode = filterNativeToolsForMode;
exports.isToolAllowedInMode = isToolAllowedInMode;
exports.getAvailableToolsInGroup = getAvailableToolsInGroup;
exports.filterMcpToolsForMode = filterMcpToolsForMode;
const modes_1 = require("../../../shared/modes");
const tools_1 = require("../../../shared/tools");
const modes_2 = require("../../../shared/modes");
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
function filterNativeToolsForMode(nativeTools, mode, customModes, experiments, codeIndexManager, settings) {
    // Get mode configuration and all tools for this mode
    const modeSlug = mode ?? modes_2.defaultModeSlug;
    let modeConfig = (0, modes_1.getModeBySlug)(modeSlug, customModes);
    // Fallback to default mode if current mode config is not found
    // This ensures the agent always has functional tools even if a custom mode is deleted
    // or configuration becomes corrupted
    if (!modeConfig) {
        modeConfig = (0, modes_1.getModeBySlug)(modes_2.defaultModeSlug, customModes);
    }
    // Get all tools for this mode (including always-available tools)
    const allToolsForMode = (0, modes_1.getToolsForMode)(modeConfig.groups);
    // Filter to only tools that pass permission checks
    const allowedToolNames = new Set(allToolsForMode.filter((tool) => (0, modes_1.isToolAllowedForMode)(tool, modeSlug, customModes ?? [], undefined, undefined, experiments ?? {})));
    // Conditionally exclude codebase_search if feature is disabled or not configured
    if (!codeIndexManager ||
        !(codeIndexManager.isFeatureEnabled && codeIndexManager.isFeatureConfigured && codeIndexManager.isInitialized)) {
        allowedToolNames.delete("codebase_search");
    }
    // Conditionally exclude update_todo_list if disabled in settings
    if (settings?.todoListEnabled === false) {
        allowedToolNames.delete("update_todo_list");
    }
    // Conditionally exclude generate_image if experiment is not enabled
    if (!experiments?.imageGeneration) {
        allowedToolNames.delete("generate_image");
    }
    // Conditionally exclude run_slash_command if experiment is not enabled
    if (!experiments?.runSlashCommand) {
        allowedToolNames.delete("run_slash_command");
    }
    // Conditionally exclude browser_action if disabled in settings
    if (settings?.browserToolEnabled === false) {
        allowedToolNames.delete("browser_action");
    }
    // Filter native tools based on allowed tool names
    return nativeTools.filter((tool) => {
        // Handle both ChatCompletionTool and ChatCompletionCustomTool
        if ("function" in tool && tool.function) {
            return allowedToolNames.has(tool.function.name);
        }
        return false;
    });
}
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
function isToolAllowedInMode(toolName, mode, customModes, experiments, codeIndexManager, settings) {
    const modeSlug = mode ?? modes_2.defaultModeSlug;
    // Check if it's an always-available tool
    if (tools_1.ALWAYS_AVAILABLE_TOOLS.includes(toolName)) {
        // But still check for conditional exclusions
        if (toolName === "codebase_search") {
            return !!(codeIndexManager &&
                codeIndexManager.isFeatureEnabled &&
                codeIndexManager.isFeatureConfigured &&
                codeIndexManager.isInitialized);
        }
        if (toolName === "update_todo_list") {
            return settings?.todoListEnabled !== false;
        }
        if (toolName === "generate_image") {
            return experiments?.imageGeneration === true;
        }
        if (toolName === "run_slash_command") {
            return experiments?.runSlashCommand === true;
        }
        return true;
    }
    // Check for browser_action being disabled by user settings
    if (toolName === "browser_action" && settings?.browserToolEnabled === false) {
        return false;
    }
    // Check if the tool is allowed by the mode's groups
    return (0, modes_1.isToolAllowedForMode)(toolName, modeSlug, customModes ?? [], undefined, undefined, experiments ?? {});
}
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
function getAvailableToolsInGroup(groupName, mode, customModes, experiments, codeIndexManager, settings) {
    const toolGroup = tools_1.TOOL_GROUPS[groupName];
    if (!toolGroup) {
        return [];
    }
    return toolGroup.tools.filter((tool) => isToolAllowedInMode(tool, mode, customModes, experiments, codeIndexManager, settings));
}
/**
 * Filters MCP tools based on whether use_mcp_tool is allowed in the current mode.
 *
 * @param mcpTools - Array of MCP tools
 * @param mode - Current mode slug
 * @param customModes - Custom mode configurations
 * @param experiments - Experiment flags
 * @returns Filtered array of MCP tools if use_mcp_tool is allowed, empty array otherwise
 */
function filterMcpToolsForMode(mcpTools, mode, customModes, experiments) {
    const modeSlug = mode ?? modes_2.defaultModeSlug;
    // MCP tools are always in the mcp group, check if use_mcp_tool is allowed
    const isMcpAllowed = (0, modes_1.isToolAllowedForMode)("use_mcp_tool", modeSlug, customModes ?? [], undefined, undefined, experiments ?? {});
    return isMcpAllowed ? mcpTools : [];
}
//# sourceMappingURL=filter-tools-for-mode.js.map