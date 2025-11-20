import { ToolProtocol } from "@roo-code/types";
/**
 * Gets the current tool protocol from workspace configuration.
 */
export declare function getCurrentToolProtocol(): ToolProtocol;
/**
 * Formats tool invocation parameters for display based on protocol.
 * Used for legacy conversation history conversion.
 */
export declare function formatToolInvocation(toolName: string, params: Record<string, any>, protocol?: ToolProtocol): string;
//# sourceMappingURL=toolResultFormatting.d.ts.map