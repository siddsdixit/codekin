import type { GenerateImageParams } from "@roo-code/types";
import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
export declare class GenerateImageTool extends BaseTool<"generate_image"> {
    readonly name: "generate_image";
    parseLegacy(params: Partial<Record<string, string>>): GenerateImageParams;
    execute(params: GenerateImageParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"generate_image">): Promise<void>;
}
export declare const generateImageTool: GenerateImageTool;
//# sourceMappingURL=GenerateImageTool.d.ts.map