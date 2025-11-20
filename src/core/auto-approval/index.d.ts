import { type ClineAsk } from "@roo-code/types";
import type { ExtensionState } from "../../shared/ExtensionMessage";
import { ClineAskResponse } from "../../shared/WebviewMessage";
export type AutoApprovalState = "alwaysAllowReadOnly" | "alwaysAllowWrite" | "alwaysAllowBrowser" | "alwaysApproveResubmit" | "alwaysAllowMcp" | "alwaysAllowModeSwitch" | "alwaysAllowSubtasks" | "alwaysAllowExecute" | "alwaysAllowFollowupQuestions" | "alwaysAllowUpdateTodoList";
export type AutoApprovalStateOptions = "autoApprovalEnabled" | "alwaysAllowReadOnlyOutsideWorkspace" | "alwaysAllowWriteOutsideWorkspace" | "alwaysAllowWriteProtected" | "followupAutoApproveTimeoutMs" | "mcpServers" | "allowedCommands" | "deniedCommands";
export type CheckAutoApprovalResult = {
    decision: "approve";
} | {
    decision: "deny";
} | {
    decision: "ask";
} | {
    decision: "timeout";
    timeout: number;
    fn: () => {
        askResponse: ClineAskResponse;
        text?: string;
        images?: string[];
    };
};
export declare function checkAutoApproval({ state, ask, text, isProtected, }: {
    state?: Pick<ExtensionState, AutoApprovalState | AutoApprovalStateOptions>;
    ask: ClineAsk;
    text?: string;
    isProtected?: boolean;
}): Promise<CheckAutoApprovalResult>;
export { AutoApprovalHandler } from "./AutoApprovalHandler";
//# sourceMappingURL=index.d.ts.map