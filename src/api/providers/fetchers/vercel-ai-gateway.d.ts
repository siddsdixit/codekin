import { z } from "zod";
import type { ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../../shared/api";
/**
 * VercelAiGatewayModel
 */
declare const vercelAiGatewayModelSchema: z.ZodObject<{
    id: z.ZodString;
    object: z.ZodString;
    created: z.ZodNumber;
    owned_by: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    context_window: z.ZodNumber;
    max_tokens: z.ZodNumber;
    type: z.ZodString;
    pricing: z.ZodObject<{
        input: z.ZodString;
        output: z.ZodString;
        input_cache_write: z.ZodOptional<z.ZodString>;
        input_cache_read: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        output: string;
        input: string;
        input_cache_read?: string | undefined;
        input_cache_write?: string | undefined;
    }, {
        output: string;
        input: string;
        input_cache_read?: string | undefined;
        input_cache_write?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    object: string;
    id: string;
    type: string;
    name: string;
    created: number;
    max_tokens: number;
    description: string;
    owned_by: string;
    context_window: number;
    pricing: {
        output: string;
        input: string;
        input_cache_read?: string | undefined;
        input_cache_write?: string | undefined;
    };
}, {
    object: string;
    id: string;
    type: string;
    name: string;
    created: number;
    max_tokens: number;
    description: string;
    owned_by: string;
    context_window: number;
    pricing: {
        output: string;
        input: string;
        input_cache_read?: string | undefined;
        input_cache_write?: string | undefined;
    };
}>;
export type VercelAiGatewayModel = z.infer<typeof vercelAiGatewayModelSchema>;
/**
 * getVercelAiGatewayModels
 */
export declare function getVercelAiGatewayModels(options?: ApiHandlerOptions): Promise<Record<string, ModelInfo>>;
/**
 * parseVercelAiGatewayModel
 */
export declare const parseVercelAiGatewayModel: ({ id, model }: {
    id: string;
    model: VercelAiGatewayModel;
}) => ModelInfo;
export {};
//# sourceMappingURL=vercel-ai-gateway.d.ts.map