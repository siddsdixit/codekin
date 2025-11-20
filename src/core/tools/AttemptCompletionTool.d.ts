import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface AttemptCompletionParams {
    result: string;
    command?: string;
}
export interface AttemptCompletionCallbacks extends ToolCallbacks {
    askFinishSubTaskApproval: () => Promise<boolean>;
    toolDescription: () => string;
}
export declare class AttemptCompletionTool extends BaseTool<"attempt_completion"> {
    readonly name: "attempt_completion";
    parseLegacy(params: Partial<Record<string, string>>): AttemptCompletionParams;
    execute(params: AttemptCompletionParams, task: Task, callbacks: AttemptCompletionCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"attempt_completion">): Promise<void>;
}
export declare const attemptCompletionTool: AttemptCompletionTool;
export {};
//# sourceMappingURL=AttemptCompletionTool.d.ts.map