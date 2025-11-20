import type { FileEntry } from "@roo-code/types";
import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
export declare class ReadFileTool extends BaseTool<"read_file"> {
    readonly name: "read_file";
    parseLegacy(params: Partial<Record<string, string>>): {
        files: FileEntry[];
    };
    execute(params: {
        files: FileEntry[];
    }, task: Task, callbacks: ToolCallbacks): Promise<void>;
    getReadFileToolDescription(blockName: string, blockParams: any): string;
    getReadFileToolDescription(blockName: string, nativeArgs: {
        files: FileEntry[];
    }): string;
    handlePartial(task: Task, block: ToolUse<"read_file">): Promise<void>;
}
export declare const readFileTool: ReadFileTool;
//# sourceMappingURL=ReadFileTool.d.ts.map