import { Task } from "../task/Task";
import { ToolUse, ToolResponse } from "../../shared/tools";
import { BaseTool, ToolCallbacks } from "./BaseTool";
interface ExecuteCommandParams {
    command: string;
    cwd?: string;
}
export declare class ExecuteCommandTool extends BaseTool<"execute_command"> {
    readonly name: "execute_command";
    parseLegacy(params: Partial<Record<string, string>>): ExecuteCommandParams;
    execute(params: ExecuteCommandParams, task: Task, callbacks: ToolCallbacks): Promise<void>;
    handlePartial(task: Task, block: ToolUse<"execute_command">): Promise<void>;
}
export type ExecuteCommandOptions = {
    executionId: string;
    command: string;
    customCwd?: string;
    terminalShellIntegrationDisabled?: boolean;
    terminalOutputLineLimit?: number;
    terminalOutputCharacterLimit?: number;
    commandExecutionTimeout?: number;
};
export declare function executeCommandInTerminal(task: Task, { executionId, command, customCwd, terminalShellIntegrationDisabled, terminalOutputLineLimit, terminalOutputCharacterLimit, commandExecutionTimeout, }: ExecuteCommandOptions): Promise<[boolean, ToolResponse]>;
export declare const executeCommandTool: ExecuteCommandTool;
export {};
//# sourceMappingURL=ExecuteCommandTool.d.ts.map