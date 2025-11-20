import { Anthropic } from "@anthropic-ai/sdk";
import { ModelInfo } from "@roo-code/types";
import { ApiStream } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import type { ApiHandlerOptions } from "../../shared/api";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
export declare class NativeOllamaHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    protected models: Record<string, ModelInfo>;
    constructor(options: ApiHandlerOptions);
    private ensureClient;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    fetchModel(): Promise<{
        id: string;
        info: ModelInfo;
    }>;
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=native-ollama.d.ts.map