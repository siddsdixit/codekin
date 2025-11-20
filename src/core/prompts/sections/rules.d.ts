import { DiffStrategy } from "../../../shared/tools";
import { CodeIndexManager } from "../../../services/code-index/manager";
import type { SystemPromptSettings } from "../types";
import type { ModeConfig } from "@roo-code/types";
export declare function getRulesSection(cwd: string, supportsComputerUse: boolean, mode: string, customModes: ModeConfig[] | undefined, experiments: Record<string, boolean> | undefined, diffStrategy?: DiffStrategy, codeIndexManager?: CodeIndexManager, settings?: SystemPromptSettings): string;
//# sourceMappingURL=rules.d.ts.map