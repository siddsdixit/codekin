"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.attemptCompletionTool = exports.AttemptCompletionTool = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("@roo-code/types");
const telemetry_1 = require("@roo-code/telemetry");
const responses_1 = require("../prompts/responses");
const package_1 = require("../../shared/package");
const BaseTool_1 = require("./BaseTool");
class AttemptCompletionTool extends BaseTool_1.BaseTool {
    name = "attempt_completion";
    parseLegacy(params) {
        return {
            result: params.result || "",
            command: params.command,
        };
    }
    async execute(params, task, callbacks) {
        const { result } = params;
        const { handleError, pushToolResult, askFinishSubTaskApproval, toolDescription } = callbacks;
        const preventCompletionWithOpenTodos = vscode.workspace
            .getConfiguration(package_1.Package.name)
            .get("preventCompletionWithOpenTodos", false);
        const hasIncompleteTodos = task.todoList && task.todoList.some((todo) => todo.status !== "completed");
        if (preventCompletionWithOpenTodos && hasIncompleteTodos) {
            task.consecutiveMistakeCount++;
            task.recordToolError("attempt_completion");
            pushToolResult(responses_1.formatResponse.toolError("Cannot complete task while there are incomplete todos. Please finish all todos before attempting completion."));
            return;
        }
        try {
            if (!result) {
                task.consecutiveMistakeCount++;
                task.recordToolError("attempt_completion");
                pushToolResult(await task.sayAndCreateMissingParamError("attempt_completion", "result"));
                return;
            }
            task.consecutiveMistakeCount = 0;
            await task.say("completion_result", result, undefined, false);
            telemetry_1.TelemetryService.instance.captureTaskCompleted(task.taskId);
            task.emit(types_1.RooCodeEventName.TaskCompleted, task.taskId, task.getTokenUsage(), task.toolUsage);
            if (task.parentTask) {
                const didApprove = await askFinishSubTaskApproval();
                if (!didApprove) {
                    pushToolResult(responses_1.formatResponse.toolDenied());
                    return;
                }
                pushToolResult("");
                await task.providerRef.deref()?.finishSubTask(result);
                return;
            }
            const { response, text, images } = await task.ask("completion_result", "", false);
            if (response === "yesButtonClicked") {
                pushToolResult("");
                return;
            }
            await task.say("user_feedback", text ?? "", images);
            const feedbackText = `The user has provided feedback on the results. Consider their input to continue the task, and then attempt completion again.\n<feedback>\n${text}\n</feedback>`;
            pushToolResult(responses_1.formatResponse.toolResult(feedbackText, images));
        }
        catch (error) {
            await handleError("inspecting site", error);
        }
    }
    async handlePartial(task, block) {
        const result = block.params.result;
        const command = block.params.command;
        const lastMessage = task.clineMessages.at(-1);
        if (command) {
            if (lastMessage && lastMessage.ask === "command") {
                await task
                    .ask("command", this.removeClosingTag("command", command, block.partial), block.partial)
                    .catch(() => { });
            }
            else {
                await task.say("completion_result", this.removeClosingTag("result", result, block.partial), undefined, false);
                telemetry_1.TelemetryService.instance.captureTaskCompleted(task.taskId);
                task.emit(types_1.RooCodeEventName.TaskCompleted, task.taskId, task.getTokenUsage(), task.toolUsage);
                await task
                    .ask("command", this.removeClosingTag("command", command, block.partial), block.partial)
                    .catch(() => { });
            }
        }
        else {
            await task.say("completion_result", this.removeClosingTag("result", result, block.partial), undefined, block.partial);
        }
    }
}
exports.AttemptCompletionTool = AttemptCompletionTool;
exports.attemptCompletionTool = new AttemptCompletionTool();
//# sourceMappingURL=AttemptCompletionTool.js.map