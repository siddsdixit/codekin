import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface WriteToFileParams {
    path: string;
    content: string;
    line_count: number;
}
export declare class WriteToFileTool extends BaseTool<"write_to_file"> {
    readonly name: "write_to_file";
    parseLegacy(params: Partial<Record<string, string>>): WriteToFileParams;
    execute(params: WriteToFileParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"write_to_file">): Promise<void>;
}
export declare const writeToFileTool: WriteToFileTool;
export {};
//# sourceMappingURL=WriteToFileTool.d.ts.map