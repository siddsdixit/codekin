import type { ModelInfo } from "@roo-code/types";
export interface ApiCostResult {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
}
export declare function calculateApiCostAnthropic(modelInfo: ModelInfo, inputTokens: number, outputTokens: number, cacheCreationInputTokens?: number, cacheReadInputTokens?: number): ApiCostResult;
export declare function calculateApiCostOpenAI(modelInfo: ModelInfo, inputTokens: number, outputTokens: number, cacheCreationInputTokens?: number, cacheReadInputTokens?: number): ApiCostResult;
export declare const parseApiPrice: (price: any) => number | undefined;
//# sourceMappingURL=cost.d.ts.map