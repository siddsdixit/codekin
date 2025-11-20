import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface InsertContentParams {
    path: string;
    line: number;
    content: string;
}
export declare class InsertContentTool extends BaseTool<"insert_content"> {
    readonly name: "insert_content";
    parseLegacy(params: Partial<Record<string, string>>): InsertContentParams;
    execute(params: InsertContentParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"insert_content">): Promise<void>;
}
export declare const insertContentTool: InsertContentTool;
export {};
//# sourceMappingURL=InsertContentTool.d.ts.map