import { Task } from "../task/Task";
import { BaseTool, ToolCallbacks } from "./BaseTool";
import type { ToolUse } from "../../shared/tools";
interface ListCodeDefinitionNamesParams {
    path: string;
}
export declare class ListCodeDefinitionNamesTool extends BaseTool<"list_code_definition_names"> {
    readonly name: "list_code_definition_names";
    parseLegacy(params: Partial<Record<string, string>>): ListCodeDefinitionNamesParams;
    execute(params: ListCodeDefinitionNamesParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"list_code_definition_names">): Promise<void>;
}
export declare const listCodeDefinitionNamesTool: ListCodeDefinitionNamesTool;
export {};
//# sourceMappingURL=ListCodeDefinitionNamesTool.d.ts.map