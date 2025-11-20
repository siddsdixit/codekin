import { z } from "zod";
import type { ModelRecord } from "../../../shared/api";
declare const huggingFaceProviderSchema: z.ZodObject<{
    provider: z.ZodString;
    status: z.ZodEnum<["live", "staging", "error"]>;
    supports_tools: z.ZodOptional<z.ZodBoolean>;
    supports_structured_output: z.ZodOptional<z.ZodBoolean>;
    context_length: z.ZodOptional<z.ZodNumber>;
    pricing: z.ZodOptional<z.ZodObject<{
        input: z.ZodNumber;
        output: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        output: number;
        input: number;
    }, {
        output: number;
        input: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "live" | "staging";
    provider: string;
    pricing?: {
        output: number;
        input: number;
    } | undefined;
    context_length?: number | undefined;
    supports_tools?: boolean | undefined;
    supports_structured_output?: boolean | undefined;
}, {
    status: "error" | "live" | "staging";
    provider: string;
    pricing?: {
        output: number;
        input: number;
    } | undefined;
    context_length?: number | undefined;
    supports_tools?: boolean | undefined;
    supports_structured_output?: boolean | undefined;
}>;
/**
 * Represents a provider that can serve a HuggingFace model.
 *
 * @property provider - The provider identifier (e.g., "sambanova", "together")
 * @property status - The current status of the provider
 * @property supports_tools - Whether the provider supports tool/function calling
 * @property supports_structured_output - Whether the provider supports structured output
 * @property context_length - The maximum context length supported by this provider
 * @property pricing - The pricing information for input/output tokens
 */
export type HuggingFaceProvider = z.infer<typeof huggingFaceProviderSchema>;
declare const huggingFaceModelSchema: z.ZodObject<{
    id: z.ZodString;
    object: z.ZodLiteral<"model">;
    created: z.ZodNumber;
    owned_by: z.ZodString;
    providers: z.ZodArray<z.ZodObject<{
        provider: z.ZodString;
        status: z.ZodEnum<["live", "staging", "error"]>;
        supports_tools: z.ZodOptional<z.ZodBoolean>;
        supports_structured_output: z.ZodOptional<z.ZodBoolean>;
        context_length: z.ZodOptional<z.ZodNumber>;
        pricing: z.ZodOptional<z.ZodObject<{
            input: z.ZodNumber;
            output: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            output: number;
            input: number;
        }, {
            output: number;
            input: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "live" | "staging";
        provider: string;
        pricing?: {
            output: number;
            input: number;
        } | undefined;
        context_length?: number | undefined;
        supports_tools?: boolean | undefined;
        supports_structured_output?: boolean | undefined;
    }, {
        status: "error" | "live" | "staging";
        provider: string;
        pricing?: {
            output: number;
            input: number;
        } | undefined;
        context_length?: number | undefined;
        supports_tools?: boolean | undefined;
        supports_structured_output?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    object: "model";
    id: string;
    created: number;
    owned_by: string;
    providers: {
        status: "error" | "live" | "staging";
        provider: string;
        pricing?: {
            output: number;
            input: number;
        } | undefined;
        context_length?: number | undefined;
        supports_tools?: boolean | undefined;
        supports_structured_output?: boolean | undefined;
    }[];
}, {
    object: "model";
    id: string;
    created: number;
    owned_by: string;
    providers: {
        status: "error" | "live" | "staging";
        provider: string;
        pricing?: {
            output: number;
            input: number;
        } | undefined;
        context_length?: number | undefined;
        supports_tools?: boolean | undefined;
        supports_structured_output?: boolean | undefined;
    }[];
}>;
/**
 * Represents a HuggingFace model available through the router API
 *
 * @property id - The unique identifier of the model
 * @property object - The object type (always "model")
 * @property created - Unix timestamp of when the model was created
 * @property owned_by - The organization that owns the model
 * @property providers - List of providers that can serve this model
 */
export type HuggingFaceModel = z.infer<typeof huggingFaceModelSchema>;
/**
 * Fetches available models from HuggingFace
 *
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails
 */
export declare function getHuggingFaceModels(): Promise<ModelRecord>;
/**
 * Get cached models without making an API request.
 */
export declare function getCachedHuggingFaceModels(): ModelRecord | null;
/**
 * Get cached raw models for UI display.
 */
export declare function getCachedRawHuggingFaceModels(): HuggingFaceModel[] | null;
export declare function clearHuggingFaceCache(): void;
export interface HuggingFaceModelsResponse {
    models: HuggingFaceModel[];
    cached: boolean;
    timestamp: number;
}
export declare function getHuggingFaceModelsWithMetadata(): Promise<HuggingFaceModelsResponse>;
export {};
//# sourceMappingURL=huggingface.d.ts.map