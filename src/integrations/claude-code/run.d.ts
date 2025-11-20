import type Anthropic from "@anthropic-ai/sdk";
import { ClaudeCodeMessage } from "./types";
type ClaudeCodeOptions = {
    systemPrompt: string;
    messages: Anthropic.Messages.MessageParam[];
    path?: string;
    modelId?: string;
};
export declare function runClaudeCode(options: ClaudeCodeOptions & {
    maxOutputTokens?: number;
}): AsyncGenerator<ClaudeCodeMessage | string>;
export {};
//# sourceMappingURL=run.d.ts.map