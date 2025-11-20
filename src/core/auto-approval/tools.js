"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWriteToolAction = isWriteToolAction;
exports.isReadOnlyToolAction = isReadOnlyToolAction;
function isWriteToolAction(tool) {
    return ["editedExistingFile", "appliedDiff", "newFileCreated", "insertContent", "generateImage"].includes(tool.tool);
}
function isReadOnlyToolAction(tool) {
    return [
        "readFile",
        "listFiles",
        "listFilesTopLevel",
        "listFilesRecursive",
        "listCodeDefinitionNames",
        "searchFiles",
        "codebaseSearch",
        "runSlashCommand",
    ].includes(tool.tool);
}
//# sourceMappingURL=tools.js.map