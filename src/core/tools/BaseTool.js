"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
/**
 * Abstract base class for all tools.
 *
 * Provides a consistent architecture where:
 * - XML/legacy protocol: params → parseLegacy() → typed params → execute()
 * - Native protocol: nativeArgs already contain typed data → execute()
 *
 * Each tool extends this class and implements:
 * - parseLegacy(): Convert XML/legacy string params to typed params
 * - execute(): Protocol-agnostic core logic using typed params
 * - handlePartial(): (optional) Handle streaming partial messages
 *
 * @template TName - The specific tool name, which determines native arg types
 */
class BaseTool {
    /**
     * Handle partial (streaming) tool messages.
     *
     * Default implementation does nothing. Tools that support streaming
     * partial messages should override this.
     *
     * @param task - Task instance
     * @param block - Partial ToolUse block
     */
    async handlePartial(task, block) {
        // Default: no-op for partial messages
        // Tools can override to show streaming UI updates
    }
    /**
     * Remove partial closing XML tags from text during streaming.
     *
     * This utility helps clean up partial XML tag artifacts that can appear
     * at the end of streamed content, preventing them from being displayed to users.
     *
     * @param tag - The tag name to check for partial closing
     * @param text - The text content to clean
     * @param isPartial - Whether this is a partial message (if false, returns text as-is)
     * @returns Cleaned text with partial closing tags removed
     */
    removeClosingTag(tag, text, isPartial) {
        if (!isPartial) {
            return text || "";
        }
        if (!text) {
            return "";
        }
        // This regex dynamically constructs a pattern to match the closing tag:
        // - Optionally matches whitespace before the tag
        // - Matches '<' or '</' optionally followed by any subset of characters from the tag name
        const tagRegex = new RegExp(`\\s?<\/?${tag
            .split("")
            .map((char) => `(?:${char})?`)
            .join("")}$`, "g");
        return text.replace(tagRegex, "");
    }
    /**
     * Main entry point for tool execution.
     *
     * Handles the complete flow:
     * 1. Partial message handling (if partial)
     * 2. Parameter parsing (parseLegacy for XML, or use nativeArgs directly)
     * 3. Core execution (execute)
     *
     * @param task - Task instance
     * @param block - ToolUse block from assistant message
     * @param callbacks - Tool execution callbacks
     */
    async handle(task, block, callbacks) {
        // Handle partial messages
        if (block.partial) {
            try {
                await this.handlePartial(task, block);
            }
            catch (error) {
                console.error(`Error in handlePartial:`, error);
                await callbacks.handleError(`handling partial ${this.name}`, error instanceof Error ? error : new Error(String(error)));
            }
            return;
        }
        // Determine protocol and parse parameters accordingly
        let params;
        try {
            if (block.nativeArgs !== undefined) {
                // Native protocol: typed args provided by NativeToolCallParser
                // TypeScript knows nativeArgs is properly typed based on TName
                params = block.nativeArgs;
            }
            else {
                // XML/legacy protocol: parse string params into typed params
                params = this.parseLegacy(block.params);
            }
        }
        catch (error) {
            console.error(`Error parsing parameters:`, error);
            const errorMessage = `Failed to parse ${this.name} parameters: ${error instanceof Error ? error.message : String(error)}`;
            await callbacks.handleError(`parsing ${this.name} args`, new Error(errorMessage));
            callbacks.pushToolResult(`<error>${errorMessage}</error>`);
            return;
        }
        // Execute with typed parameters
        await this.execute(params, task, callbacks);
    }
}
exports.BaseTool = BaseTool;
//# sourceMappingURL=BaseTool.js.map