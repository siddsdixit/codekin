import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiHandlerCreateMessageMetadata } from "../index";
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider";
export declare class ZAiHandler extends BaseOpenAiCompatibleProvider<string> {
    constructor(options: ApiHandlerOptions);
    protected createStream(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata, requestOptions?: OpenAI.RequestOptions): import("openai").APIPromise<import("openai/core/streaming.js").Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=zai.d.ts.map