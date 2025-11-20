"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchInstructionsTool = exports.FetchInstructionsTool = void 0;
const instructions_1 = require("../prompts/instructions/instructions");
const responses_1 = require("../prompts/responses");
const BaseTool_1 = require("./BaseTool");
class FetchInstructionsTool extends BaseTool_1.BaseTool {
    name = "fetch_instructions";
    parseLegacy(params) {
        return {
            task: params.task || "",
        };
    }
    async execute(params, task, callbacks) {
        const { handleError, pushToolResult, askApproval } = callbacks;
        const { task: taskParam } = params;
        try {
            if (!taskParam) {
                task.consecutiveMistakeCount++;
                task.recordToolError("fetch_instructions");
                pushToolResult(await task.sayAndCreateMissingParamError("fetch_instructions", "task"));
                return;
            }
            task.consecutiveMistakeCount = 0;
            const completeMessage = JSON.stringify({
                tool: "fetchInstructions",
                content: taskParam,
            });
            const didApprove = await askApproval("tool", completeMessage);
            if (!didApprove) {
                return;
            }
            // Now fetch the content and provide it to the agent.
            const provider = task.providerRef.deref();
            const mcpHub = provider?.getMcpHub();
            if (!mcpHub) {
                throw new Error("MCP hub not available");
            }
            const diffStrategy = task.diffStrategy;
            const context = provider?.context;
            const content = await (0, instructions_1.fetchInstructions)(taskParam, { mcpHub, diffStrategy, context });
            if (!content) {
                pushToolResult(responses_1.formatResponse.toolError(`Invalid instructions request: ${taskParam}`));
                return;
            }
            pushToolResult(content);
        }
        catch (error) {
            await handleError("fetch instructions", error);
        }
    }
    async handlePartial(task, block) {
        const taskParam = block.params.task;
        const sharedMessageProps = { tool: "fetchInstructions", content: taskParam };
        const partialMessage = JSON.stringify({ ...sharedMessageProps, content: undefined });
        await task.ask("tool", partialMessage, block.partial).catch(() => { });
    }
}
exports.FetchInstructionsTool = FetchInstructionsTool;
exports.fetchInstructionsTool = new FetchInstructionsTool();
//# sourceMappingURL=FetchInstructionsTool.js.map