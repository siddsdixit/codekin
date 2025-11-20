import { z } from "zod";
import type { ModelRecord } from "../../../shared/api";
declare const ioIntelligenceModelSchema: z.ZodObject<{
    id: z.ZodString;
    object: z.ZodLiteral<"model">;
    created: z.ZodNumber;
    owned_by: z.ZodString;
    root: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    parent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    max_model_len: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    permission: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"model_permission">;
        created: z.ZodNumber;
        allow_create_engine: z.ZodBoolean;
        allow_sampling: z.ZodBoolean;
        allow_logprobs: z.ZodBoolean;
        allow_search_indices: z.ZodBoolean;
        allow_view: z.ZodBoolean;
        allow_fine_tuning: z.ZodBoolean;
        organization: z.ZodString;
        group: z.ZodNullable<z.ZodString>;
        is_blocking: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        object: "model_permission";
        id: string;
        created: number;
        organization: string;
        allow_create_engine: boolean;
        allow_sampling: boolean;
        allow_logprobs: boolean;
        allow_search_indices: boolean;
        allow_view: boolean;
        allow_fine_tuning: boolean;
        group: string | null;
        is_blocking: boolean;
    }, {
        object: "model_permission";
        id: string;
        created: number;
        organization: string;
        allow_create_engine: boolean;
        allow_sampling: boolean;
        allow_logprobs: boolean;
        allow_search_indices: boolean;
        allow_view: boolean;
        allow_fine_tuning: boolean;
        group: string | null;
        is_blocking: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    object: "model";
    id: string;
    created: number;
    owned_by: string;
    permission: {
        object: "model_permission";
        id: string;
        created: number;
        organization: string;
        allow_create_engine: boolean;
        allow_sampling: boolean;
        allow_logprobs: boolean;
        allow_search_indices: boolean;
        allow_view: boolean;
        allow_fine_tuning: boolean;
        group: string | null;
        is_blocking: boolean;
    }[];
    root?: string | null | undefined;
    parent?: string | null | undefined;
    max_model_len?: number | null | undefined;
}, {
    object: "model";
    id: string;
    created: number;
    owned_by: string;
    permission: {
        object: "model_permission";
        id: string;
        created: number;
        organization: string;
        allow_create_engine: boolean;
        allow_sampling: boolean;
        allow_logprobs: boolean;
        allow_search_indices: boolean;
        allow_view: boolean;
        allow_fine_tuning: boolean;
        group: string | null;
        is_blocking: boolean;
    }[];
    root?: string | null | undefined;
    parent?: string | null | undefined;
    max_model_len?: number | null | undefined;
}>;
export type IOIntelligenceModel = z.infer<typeof ioIntelligenceModelSchema>;
/**
 * Fetches available models from IO Intelligence
 * <mcreference link="https://docs.io.net/reference/get-started-with-io-intelligence-api" index="1">1</mcreference>
 */
export declare function getIOIntelligenceModels(apiKey?: string): Promise<ModelRecord>;
export declare function getCachedIOIntelligenceModels(): ModelRecord | null;
export declare function clearIOIntelligenceCache(): void;
export {};
//# sourceMappingURL=io-intelligence.d.ts.map