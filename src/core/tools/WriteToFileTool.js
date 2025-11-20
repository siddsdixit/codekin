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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToFileTool = exports.WriteToFileTool = void 0;
const path_1 = __importDefault(require("path"));
const delay_1 = __importDefault(require("delay"));
const vscode = __importStar(require("vscode"));
const promises_1 = __importDefault(require("fs/promises"));
const responses_1 = require("../prompts/responses");
const fs_1 = require("../../utils/fs");
const extract_text_1 = require("../../integrations/misc/extract-text");
const path_2 = require("../../utils/path");
const pathUtils_1 = require("../../utils/pathUtils");
const detect_omission_1 = require("../../integrations/editor/detect-omission");
const text_normalization_1 = require("../../utils/text-normalization");
const types_1 = require("@roo-code/types");
const experiments_1 = require("../../shared/experiments");
const stats_1 = require("../diff/stats");
const BaseTool_1 = require("./BaseTool");
class WriteToFileTool extends BaseTool_1.BaseTool {
    name = "write_to_file";
    parseLegacy(params) {
        return {
            path: params.path || "",
            content: params.content || "",
            line_count: parseInt(params.line_count ?? "0", 10),
        };
    }
    async execute(params, task, callbacks) {
        const { pushToolResult, handleError, askApproval, removeClosingTag } = callbacks;
        const relPath = params.path;
        let newContent = params.content;
        const predictedLineCount = params.line_count;
        if (!relPath) {
            task.consecutiveMistakeCount++;
            task.recordToolError("write_to_file");
            pushToolResult(await task.sayAndCreateMissingParamError("write_to_file", "path"));
            await task.diffViewProvider.reset();
            return;
        }
        if (newContent === undefined) {
            task.consecutiveMistakeCount++;
            task.recordToolError("write_to_file");
            pushToolResult(await task.sayAndCreateMissingParamError("write_to_file", "content"));
            await task.diffViewProvider.reset();
            return;
        }
        const accessAllowed = task.rooIgnoreController?.validateAccess(relPath);
        if (!accessAllowed) {
            await task.say("rooignore_error", relPath);
            pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)));
            return;
        }
        const isWriteProtected = task.rooProtectedController?.isWriteProtected(relPath) || false;
        let fileExists;
        if (task.diffViewProvider.editType !== undefined) {
            fileExists = task.diffViewProvider.editType === "modify";
        }
        else {
            const absolutePath = path_1.default.resolve(task.cwd, relPath);
            fileExists = await (0, fs_1.fileExistsAtPath)(absolutePath);
            task.diffViewProvider.editType = fileExists ? "modify" : "create";
        }
        if (newContent.startsWith("```")) {
            newContent = newContent.split("\n").slice(1).join("\n");
        }
        if (newContent.endsWith("```")) {
            newContent = newContent.split("\n").slice(0, -1).join("\n");
        }
        if (!task.api.getModel().id.includes("claude")) {
            newContent = (0, text_normalization_1.unescapeHtmlEntities)(newContent);
        }
        const fullPath = relPath ? path_1.default.resolve(task.cwd, removeClosingTag("path", relPath)) : "";
        const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath);
        const sharedMessageProps = {
            tool: fileExists ? "editedExistingFile" : "newFileCreated",
            path: (0, path_2.getReadablePath)(task.cwd, removeClosingTag("path", relPath)),
            content: newContent,
            isOutsideWorkspace,
            isProtected: isWriteProtected,
        };
        try {
            if (predictedLineCount === undefined || predictedLineCount === 0) {
                task.consecutiveMistakeCount++;
                task.recordToolError("write_to_file");
                const actualLineCount = newContent.split("\n").length;
                const isNewFile = !fileExists;
                const diffStrategyEnabled = !!task.diffStrategy;
                await task.say("error", `Roo tried to use write_to_file${relPath ? ` for '${relPath.toPosix()}'` : ""} but the required parameter 'line_count' was missing or truncated after ${actualLineCount} lines of content were written. Retrying...`);
                pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.lineCountTruncationError(actualLineCount, isNewFile, diffStrategyEnabled)));
                await task.diffViewProvider.revertChanges();
                return;
            }
            task.consecutiveMistakeCount = 0;
            const provider = task.providerRef.deref();
            const state = await provider?.getState();
            const diagnosticsEnabled = state?.diagnosticsEnabled ?? true;
            const writeDelayMs = state?.writeDelayMs ?? types_1.DEFAULT_WRITE_DELAY_MS;
            const isPreventFocusDisruptionEnabled = experiments_1.experiments.isEnabled(state?.experiments ?? {}, experiments_1.EXPERIMENT_IDS.PREVENT_FOCUS_DISRUPTION);
            if (isPreventFocusDisruptionEnabled) {
                task.diffViewProvider.editType = fileExists ? "modify" : "create";
                if (fileExists) {
                    const absolutePath = path_1.default.resolve(task.cwd, relPath);
                    task.diffViewProvider.originalContent = await promises_1.default.readFile(absolutePath, "utf-8");
                }
                else {
                    task.diffViewProvider.originalContent = "";
                }
                if ((0, detect_omission_1.detectCodeOmission)(task.diffViewProvider.originalContent || "", newContent, predictedLineCount)) {
                    if (task.diffStrategy) {
                        pushToolResult(responses_1.formatResponse.toolError(`Content appears to be truncated (file has ${newContent.split("\n").length} lines but was predicted to have ${predictedLineCount} lines), and found comments indicating omitted code (e.g., '// rest of code unchanged', '/* previous code */'). Please provide the complete file content without any omissions if possible, or otherwise use the 'apply_diff' tool to apply the diff to the original file.`));
                        return;
                    }
                    else {
                        vscode.window
                            .showWarningMessage("Potential code truncation detected. cline happens when the AI reaches its max output limit.", "Follow cline guide to fix the issue")
                            .then((selection) => {
                            if (selection === "Follow cline guide to fix the issue") {
                                vscode.env.openExternal(vscode.Uri.parse("https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Cline-Deleting-Code-with-%22Rest-of-Code-Here%22-Comments"));
                            }
                        });
                    }
                }
                let unified = fileExists
                    ? responses_1.formatResponse.createPrettyPatch(relPath, task.diffViewProvider.originalContent, newContent)
                    : (0, stats_1.convertNewFileToUnifiedDiff)(newContent, relPath);
                unified = (0, stats_1.sanitizeUnifiedDiff)(unified);
                const completeMessage = JSON.stringify({
                    ...sharedMessageProps,
                    content: unified,
                    diffStats: (0, stats_1.computeDiffStats)(unified) || undefined,
                });
                const didApprove = await askApproval("tool", completeMessage, undefined, isWriteProtected);
                if (!didApprove) {
                    return;
                }
                await task.diffViewProvider.saveDirectly(relPath, newContent, false, diagnosticsEnabled, writeDelayMs);
            }
            else {
                if (!task.diffViewProvider.isEditing) {
                    const partialMessage = JSON.stringify(sharedMessageProps);
                    await task.ask("tool", partialMessage, true).catch(() => { });
                    await task.diffViewProvider.open(relPath);
                }
                await task.diffViewProvider.update((0, extract_text_1.everyLineHasLineNumbers)(newContent) ? (0, extract_text_1.stripLineNumbers)(newContent) : newContent, true);
                await (0, delay_1.default)(300);
                task.diffViewProvider.scrollToFirstDiff();
                if ((0, detect_omission_1.detectCodeOmission)(task.diffViewProvider.originalContent || "", newContent, predictedLineCount)) {
                    if (task.diffStrategy) {
                        await task.diffViewProvider.revertChanges();
                        pushToolResult(responses_1.formatResponse.toolError(`Content appears to be truncated (file has ${newContent.split("\n").length} lines but was predicted to have ${predictedLineCount} lines), and found comments indicating omitted code (e.g., '// rest of code unchanged', '/* previous code */'). Please provide the complete file content without any omissions if possible, or otherwise use the 'apply_diff' tool to apply the diff to the original file.`));
                        return;
                    }
                    else {
                        vscode.window
                            .showWarningMessage("Potential code truncation detected. cline happens when the AI reaches its max output limit.", "Follow cline guide to fix the issue")
                            .then((selection) => {
                            if (selection === "Follow cline guide to fix the issue") {
                                vscode.env.openExternal(vscode.Uri.parse("https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Cline-Deleting-Code-with-%22Rest-of-Code-Here%22-Comments"));
                            }
                        });
                    }
                }
                let unified = fileExists
                    ? responses_1.formatResponse.createPrettyPatch(relPath, task.diffViewProvider.originalContent, newContent)
                    : (0, stats_1.convertNewFileToUnifiedDiff)(newContent, relPath);
                unified = (0, stats_1.sanitizeUnifiedDiff)(unified);
                const completeMessage = JSON.stringify({
                    ...sharedMessageProps,
                    content: unified,
                    diffStats: (0, stats_1.computeDiffStats)(unified) || undefined,
                });
                const didApprove = await askApproval("tool", completeMessage, undefined, isWriteProtected);
                if (!didApprove) {
                    await task.diffViewProvider.revertChanges();
                    return;
                }
                await task.diffViewProvider.saveChanges(diagnosticsEnabled, writeDelayMs);
            }
            if (relPath) {
                await task.fileContextTracker.trackFileContext(relPath, "roo_edited");
            }
            task.didEditFile = true;
            const message = await task.diffViewProvider.pushToolWriteResult(task, task.cwd, !fileExists);
            pushToolResult(message);
            await task.diffViewProvider.reset();
            task.processQueuedMessages();
            return;
        }
        catch (error) {
            await handleError("writing file", error);
            await task.diffViewProvider.reset();
            return;
        }
    }
    async handlePartial(task, block) {
        const relPath = block.params.path;
        let newContent = block.params.content;
        if (!relPath || newContent === undefined) {
            return;
        }
        const provider = task.providerRef.deref();
        const state = await provider?.getState();
        const isPreventFocusDisruptionEnabled = experiments_1.experiments.isEnabled(state?.experiments ?? {}, experiments_1.EXPERIMENT_IDS.PREVENT_FOCUS_DISRUPTION);
        if (isPreventFocusDisruptionEnabled) {
            return;
        }
        let fileExists;
        if (task.diffViewProvider.editType !== undefined) {
            fileExists = task.diffViewProvider.editType === "modify";
        }
        else {
            const absolutePath = path_1.default.resolve(task.cwd, relPath);
            fileExists = await (0, fs_1.fileExistsAtPath)(absolutePath);
            task.diffViewProvider.editType = fileExists ? "modify" : "create";
        }
        const isWriteProtected = task.rooProtectedController?.isWriteProtected(relPath) || false;
        const fullPath = path_1.default.resolve(task.cwd, relPath);
        const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath);
        const sharedMessageProps = {
            tool: fileExists ? "editedExistingFile" : "newFileCreated",
            path: (0, path_2.getReadablePath)(task.cwd, relPath),
            content: newContent,
            isOutsideWorkspace,
            isProtected: isWriteProtected,
        };
        const partialMessage = JSON.stringify(sharedMessageProps);
        await task.ask("tool", partialMessage, block.partial).catch(() => { });
        if (!task.diffViewProvider.isEditing) {
            await task.diffViewProvider.open(relPath);
        }
        await task.diffViewProvider.update((0, extract_text_1.everyLineHasLineNumbers)(newContent) ? (0, extract_text_1.stripLineNumbers)(newContent) : newContent, false);
    }
}
exports.WriteToFileTool = WriteToFileTool;
exports.writeToFileTool = new WriteToFileTool();
//# sourceMappingURL=WriteToFileTool.js.map