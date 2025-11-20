import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface FetchInstructionsParams {
    task: string;
}
export declare class FetchInstructionsTool extends BaseTool<"fetch_instructions"> {
    readonly name: "fetch_instructions";
    parseLegacy(params: Partial<Record<string, string>>): FetchInstructionsParams;
    execute(params: FetchInstructionsParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"fetch_instructions">): Promise<void>;
}
export declare const fetchInstructionsTool: FetchInstructionsTool;
export {};
//# sourceMappingURL=FetchInstructionsTool.d.ts.map