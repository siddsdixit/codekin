import type { ModelRecord } from "../../../shared/api";
/**
 * Fetches available models from the Roo Code Cloud provider
 *
 * @param baseUrl The base URL of the Roo Code Cloud provider
 * @param apiKey The API key (session token) for the Roo Code Cloud provider
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails or the response is not as expected.
 */
export declare function getRooModels(baseUrl: string, apiKey?: string): Promise<ModelRecord>;
//# sourceMappingURL=roo.d.ts.map