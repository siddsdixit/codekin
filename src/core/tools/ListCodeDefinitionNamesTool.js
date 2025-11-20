"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCodeDefinitionNamesTool = exports.ListCodeDefinitionNamesTool = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const path_2 = require("../../utils/path");
const pathUtils_1 = require("../../utils/pathUtils");
const tree_sitter_1 = require("../../services/tree-sitter");
const truncateDefinitions_1 = require("./helpers/truncateDefinitions");
const BaseTool_1 = require("./BaseTool");
class ListCodeDefinitionNamesTool extends BaseTool_1.BaseTool {
    name = "list_code_definition_names";
    parseLegacy(params) {
        return {
            path: params.path || "",
        };
    }
    async execute(params, task, callbacks) {
        const { askApproval, handleError, pushToolResult } = callbacks;
        const { path: relPath } = params;
        if (!relPath) {
            task.consecutiveMistakeCount++;
            task.recordToolError("list_code_definition_names");
            pushToolResult(await task.sayAndCreateMissingParamError("list_code_definition_names", "path"));
            return;
        }
        task.consecutiveMistakeCount = 0;
        const absolutePath = path_1.default.resolve(task.cwd, relPath);
        const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(absolutePath);
        const sharedMessageProps = {
            tool: "listCodeDefinitionNames",
            path: (0, path_2.getReadablePath)(task.cwd, relPath),
            isOutsideWorkspace,
        };
        try {
            let result;
            try {
                const stats = await promises_1.default.stat(absolutePath);
                if (stats.isFile()) {
                    const fileResult = await (0, tree_sitter_1.parseSourceCodeDefinitionsForFile)(absolutePath, task.rooIgnoreController);
                    if (fileResult) {
                        const { maxReadFileLine = -1 } = (await task.providerRef.deref()?.getState()) ?? {};
                        result = (0, truncateDefinitions_1.truncateDefinitionsToLineLimit)(fileResult, maxReadFileLine);
                    }
                    else {
                        result = "No source code definitions found in file.";
                    }
                }
                else if (stats.isDirectory()) {
                    result = await (0, tree_sitter_1.parseSourceCodeForDefinitionsTopLevel)(absolutePath, task.rooIgnoreController);
                }
                else {
                    result = "The specified path is neither a file nor a directory.";
                }
            }
            catch {
                result = `${absolutePath}: does not exist or cannot be accessed.`;
            }
            const completeMessage = JSON.stringify({ ...sharedMessageProps, content: result });
            const didApprove = await askApproval("tool", completeMessage);
            if (!didApprove) {
                return;
            }
            if (relPath) {
                await task.fileContextTracker.trackFileContext(relPath, "read_tool");
            }
            pushToolResult(result);
        }
        catch (error) {
            await handleError("parsing source code definitions", error);
        }
    }
    async handlePartial(task, block) {
        const relPath = block.params.path;
        const absolutePath = relPath ? path_1.default.resolve(task.cwd, relPath) : task.cwd;
        const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(absolutePath);
        const sharedMessageProps = {
            tool: "listCodeDefinitionNames",
            path: (0, path_2.getReadablePath)(task.cwd, relPath || ""),
            isOutsideWorkspace,
        };
        const partialMessage = JSON.stringify({ ...sharedMessageProps, content: "" });
        await task.ask("tool", partialMessage, block.partial).catch(() => { });
    }
}
exports.ListCodeDefinitionNamesTool = ListCodeDefinitionNamesTool;
exports.listCodeDefinitionNamesTool = new ListCodeDefinitionNamesTool();
//# sourceMappingURL=ListCodeDefinitionNamesTool.js.map