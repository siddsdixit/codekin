"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertContentTool = exports.InsertContentTool = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const path_2 = require("../../utils/path");
const responses_1 = require("../prompts/responses");
const fs_1 = require("../../utils/fs");
const insert_groups_1 = require("../diff/insert-groups");
const types_1 = require("@roo-code/types");
const experiments_1 = require("../../shared/experiments");
const stats_1 = require("../diff/stats");
const BaseTool_1 = require("./BaseTool");
class InsertContentTool extends BaseTool_1.BaseTool {
    name = "insert_content";
    parseLegacy(params) {
        const relPath = params.path || "";
        const lineStr = params.line || "";
        const content = params.content || "";
        const lineNumber = parseInt(lineStr, 10);
        return {
            path: relPath,
            line: lineNumber,
            content: content,
        };
    }
    async execute(params, task, callbacks) {
        const { path: relPath, line: lineNumber, content } = params;
        const { askApproval, handleError, pushToolResult } = callbacks;
        try {
            // Validate required parameters
            if (!relPath) {
                task.consecutiveMistakeCount++;
                task.recordToolError("insert_content");
                pushToolResult(await task.sayAndCreateMissingParamError("insert_content", "path"));
                return;
            }
            if (isNaN(lineNumber) || lineNumber < 0) {
                task.consecutiveMistakeCount++;
                task.recordToolError("insert_content");
                pushToolResult(responses_1.formatResponse.toolError("Invalid line number. Must be a non-negative integer."));
                return;
            }
            if (content === undefined) {
                task.consecutiveMistakeCount++;
                task.recordToolError("insert_content");
                pushToolResult(await task.sayAndCreateMissingParamError("insert_content", "content"));
                return;
            }
            const accessAllowed = task.rooIgnoreController?.validateAccess(relPath);
            if (!accessAllowed) {
                await task.say("rooignore_error", relPath);
                pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)));
                return;
            }
            // Check if file is write-protected
            const isWriteProtected = task.rooProtectedController?.isWriteProtected(relPath) || false;
            const absolutePath = path_1.default.resolve(task.cwd, relPath);
            const fileExists = await (0, fs_1.fileExistsAtPath)(absolutePath);
            let fileContent = "";
            if (!fileExists) {
                if (lineNumber > 1) {
                    task.consecutiveMistakeCount++;
                    task.recordToolError("insert_content");
                    const formattedError = `Cannot insert content at line ${lineNumber} into a non-existent file. For new files, 'line' must be 0 (to append) or 1 (to insert at the beginning).`;
                    await task.say("error", formattedError);
                    pushToolResult(formattedError);
                    return;
                }
            }
            else {
                fileContent = await promises_1.default.readFile(absolutePath, "utf8");
            }
            task.consecutiveMistakeCount = 0;
            task.diffViewProvider.editType = fileExists ? "modify" : "create";
            task.diffViewProvider.originalContent = fileContent;
            const lines = fileExists ? fileContent.split("\n") : [];
            let updatedContent = (0, insert_groups_1.insertGroups)(lines, [
                {
                    index: lineNumber - 1,
                    elements: content.split("\n"),
                },
            ]).join("\n");
            // Check if preventFocusDisruption experiment is enabled
            const provider = task.providerRef.deref();
            const state = await provider?.getState();
            const diagnosticsEnabled = state?.diagnosticsEnabled ?? true;
            const writeDelayMs = state?.writeDelayMs ?? types_1.DEFAULT_WRITE_DELAY_MS;
            const isPreventFocusDisruptionEnabled = experiments_1.experiments.isEnabled(state?.experiments ?? {}, experiments_1.EXPERIMENT_IDS.PREVENT_FOCUS_DISRUPTION);
            // Build unified diff for display (normalize EOLs only for diff generation)
            let unified;
            if (fileExists) {
                const oldForDiff = fileContent.replace(/\r\n/g, "\n");
                const newForDiff = updatedContent.replace(/\r\n/g, "\n");
                unified = responses_1.formatResponse.createPrettyPatch(relPath, oldForDiff, newForDiff);
                if (!unified) {
                    pushToolResult(`No changes needed for '${relPath}'`);
                    return;
                }
            }
            else {
                const newForDiff = updatedContent.replace(/\r\n/g, "\n");
                unified = (0, stats_1.convertNewFileToUnifiedDiff)(newForDiff, relPath);
            }
            unified = (0, stats_1.sanitizeUnifiedDiff)(unified);
            const diffStats = (0, stats_1.computeDiffStats)(unified) || undefined;
            // Prepare the approval message (same for both flows)
            const sharedMessageProps = {
                tool: "insertContent",
                path: (0, path_2.getReadablePath)(task.cwd, relPath),
                diff: content,
                lineNumber: lineNumber,
            };
            const completeMessage = JSON.stringify({
                ...sharedMessageProps,
                // Send unified diff as content for render-only webview
                content: unified,
                lineNumber: lineNumber,
                isProtected: isWriteProtected,
                diffStats,
            });
            // Show diff view if focus disruption prevention is disabled
            if (!isPreventFocusDisruptionEnabled) {
                await task.diffViewProvider.open(relPath);
                await task.diffViewProvider.update(updatedContent, true);
                task.diffViewProvider.scrollToFirstDiff();
            }
            // Ask for approval (same for both flows)
            const didApprove = await askApproval("tool", completeMessage, undefined, isWriteProtected);
            if (!didApprove) {
                // Revert changes if diff view was shown
                if (!isPreventFocusDisruptionEnabled) {
                    await task.diffViewProvider.revertChanges();
                }
                pushToolResult("Changes were rejected by the user.");
                await task.diffViewProvider.reset();
                return;
            }
            // Save the changes
            if (isPreventFocusDisruptionEnabled) {
                // Direct file write without diff view or opening the file
                await task.diffViewProvider.saveDirectly(relPath, updatedContent, false, diagnosticsEnabled, writeDelayMs);
            }
            else {
                // Call saveChanges to update the DiffViewProvider properties
                await task.diffViewProvider.saveChanges(diagnosticsEnabled, writeDelayMs);
            }
            // Track file edit operation
            if (relPath) {
                await task.fileContextTracker.trackFileContext(relPath, "roo_edited");
            }
            task.didEditFile = true;
            // Get the formatted response message
            const message = await task.diffViewProvider.pushToolWriteResult(task, task.cwd, !fileExists);
            pushToolResult(message);
            await task.diffViewProvider.reset();
            // Process any queued messages after file edit completes
            task.processQueuedMessages();
        }
        catch (error) {
            await handleError("insert content", error);
            await task.diffViewProvider.reset();
        }
    }
    async handlePartial(task, block) {
        const relPath = block.params.path;
        const line = block.params.line;
        const content = block.params.content;
        const sharedMessageProps = {
            tool: "insertContent",
            path: (0, path_2.getReadablePath)(task.cwd, relPath || ""),
            diff: content,
            lineNumber: line ? parseInt(line, 10) : undefined,
        };
        await task.ask("tool", JSON.stringify(sharedMessageProps), block.partial).catch(() => { });
    }
}
exports.InsertContentTool = InsertContentTool;
exports.insertContentTool = new InsertContentTool();
//# sourceMappingURL=InsertContentTool.js.map