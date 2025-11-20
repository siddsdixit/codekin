import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface ListFilesParams {
    path: string;
    recursive?: boolean;
}
export declare class ListFilesTool extends BaseTool<"list_files"> {
    readonly name: "list_files";
    parseLegacy(params: Partial<Record<string, string>>): ListFilesParams;
    execute(params: ListFilesParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"list_files">): Promise<void>;
}
export declare const listFilesTool: ListFilesTool;
export {};
//# sourceMappingURL=ListFilesTool.d.ts.map