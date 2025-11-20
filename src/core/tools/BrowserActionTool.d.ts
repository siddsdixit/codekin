import type { BrowserActionParams } from "@roo-code/types";
import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
export declare class BrowserActionTool extends BaseTool<"browser_action"> {
    readonly name: "browser_action";
    parseLegacy(params: Partial<Record<string, string>>): BrowserActionParams;
    execute(params: BrowserActionParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"browser_action">): Promise<void>;
}
export declare const browserActionTool: BrowserActionTool;
//# sourceMappingURL=BrowserActionTool.d.ts.map