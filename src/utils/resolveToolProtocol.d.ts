import { ToolProtocol } from "@roo-code/types";
import type { ProviderSettings, ProviderName, ModelInfo } from "@roo-code/types";
/**
 * Resolve the effective tool protocol based on the precedence hierarchy:
 * Support > Preference > Defaults
 *
 * 1. User Preference - Per-Profile (explicit profile setting)
 * 2. User Preference - Global (VSCode setting)
 * 3. Model Default (defaultToolProtocol in ModelInfo)
 * 4. Provider Default (XML by default, native for specific providers)
 * 5. XML Fallback (final fallback)
 *
 * Then check support: if protocol is "native" but model doesn't support it, use XML.
 *
 * @param providerSettings - The provider settings for the current profile
 * @param modelInfo - Optional model information containing capabilities
 * @param provider - Optional provider name for provider-specific defaults
 * @returns The resolved tool protocol (either "xml" or "native")
 */
export declare function resolveToolProtocol(providerSettings: ProviderSettings, modelInfo?: ModelInfo, provider?: ProviderName): ToolProtocol;
//# sourceMappingURL=resolveToolProtocol.d.ts.map