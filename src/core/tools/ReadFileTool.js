"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFileTool = exports.ReadFileTool = void 0;
const path_1 = __importDefault(require("path"));
const isbinaryfile_1 = require("isbinaryfile");
const types_1 = require("@roo-code/types");
const responses_1 = require("../prompts/responses");
const i18n_1 = require("../../i18n");
const pathUtils_1 = require("../../utils/pathUtils");
const path_2 = require("../../utils/path");
const line_counter_1 = require("../../integrations/misc/line-counter");
const read_lines_1 = require("../../integrations/misc/read-lines");
const extract_text_1 = require("../../integrations/misc/extract-text");
const tree_sitter_1 = require("../../services/tree-sitter");
const xml_1 = require("../../utils/xml");
const resolveToolProtocol_1 = require("../../utils/resolveToolProtocol");
const imageHelpers_1 = require("./helpers/imageHelpers");
const fileTokenBudget_1 = require("./helpers/fileTokenBudget");
const truncateDefinitions_1 = require("./helpers/truncateDefinitions");
const BaseTool_1 = require("./BaseTool");
class ReadFileTool extends BaseTool_1.BaseTool {
    name = "read_file";
    parseLegacy(params) {
        const argsXmlTag = params.args;
        const legacyPath = params.path;
        const legacyStartLineStr = params.start_line;
        const legacyEndLineStr = params.end_line;
        const fileEntries = [];
        // XML args format
        if (argsXmlTag) {
            const parsed = (0, xml_1.parseXml)(argsXmlTag);
            const files = Array.isArray(parsed.file) ? parsed.file : [parsed.file].filter(Boolean);
            for (const file of files) {
                if (!file.path)
                    continue;
                const fileEntry = {
                    path: file.path,
                    lineRanges: [],
                };
                if (file.line_range) {
                    const ranges = Array.isArray(file.line_range) ? file.line_range : [file.line_range];
                    for (const range of ranges) {
                        const match = String(range).match(/(\d+)-(\d+)/);
                        if (match) {
                            const [, start, end] = match.map(Number);
                            if (!isNaN(start) && !isNaN(end)) {
                                fileEntry.lineRanges?.push({ start, end });
                            }
                        }
                    }
                }
                fileEntries.push(fileEntry);
            }
            return { files: fileEntries };
        }
        // Legacy single file path
        if (legacyPath) {
            const fileEntry = {
                path: legacyPath,
                lineRanges: [],
            };
            if (legacyStartLineStr && legacyEndLineStr) {
                const start = parseInt(legacyStartLineStr, 10);
                const end = parseInt(legacyEndLineStr, 10);
                if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
                    fileEntry.lineRanges?.push({ start, end });
                }
            }
            fileEntries.push(fileEntry);
        }
        return { files: fileEntries };
    }
    async execute(params, task, callbacks) {
        const { handleError, pushToolResult } = callbacks;
        const fileEntries = params.files;
        const modelInfo = task.api.getModel().info;
        const protocol = (0, resolveToolProtocol_1.resolveToolProtocol)(task.apiConfiguration, modelInfo, task.apiConfiguration.apiProvider);
        const useNative = (0, types_1.isNativeProtocol)(protocol);
        if (!fileEntries || fileEntries.length === 0) {
            task.consecutiveMistakeCount++;
            task.recordToolError("read_file");
            const errorMsg = await task.sayAndCreateMissingParamError("read_file", "args (containing valid file paths)");
            const errorResult = useNative ? `Error: ${errorMsg}` : `<files><error>${errorMsg}</error></files>`;
            pushToolResult(errorResult);
            return;
        }
        const supportsImages = modelInfo.supportsImages ?? false;
        const fileResults = fileEntries.map((entry) => ({
            path: entry.path,
            status: "pending",
            lineRanges: entry.lineRanges,
        }));
        const updateFileResult = (filePath, updates) => {
            const index = fileResults.findIndex((result) => result.path === filePath);
            if (index !== -1) {
                fileResults[index] = { ...fileResults[index], ...updates };
            }
        };
        try {
            const filesToApprove = [];
            for (const fileResult of fileResults) {
                const relPath = fileResult.path;
                const fullPath = path_1.default.resolve(task.cwd, relPath);
                if (fileResult.lineRanges) {
                    let hasRangeError = false;
                    for (const range of fileResult.lineRanges) {
                        if (range.start > range.end) {
                            const errorMsg = "Invalid line range: end line cannot be less than start line";
                            updateFileResult(relPath, {
                                status: "blocked",
                                error: errorMsg,
                                xmlContent: `<file><path>${relPath}</path><error>Error reading file: ${errorMsg}</error></file>`,
                                nativeContent: `File: ${relPath}\nError: Error reading file: ${errorMsg}`,
                            });
                            await task.say("error", `Error reading file ${relPath}: ${errorMsg}`);
                            hasRangeError = true;
                            break;
                        }
                        if (isNaN(range.start) || isNaN(range.end)) {
                            const errorMsg = "Invalid line range values";
                            updateFileResult(relPath, {
                                status: "blocked",
                                error: errorMsg,
                                xmlContent: `<file><path>${relPath}</path><error>Error reading file: ${errorMsg}</error></file>`,
                                nativeContent: `File: ${relPath}\nError: Error reading file: ${errorMsg}`,
                            });
                            await task.say("error", `Error reading file ${relPath}: ${errorMsg}`);
                            hasRangeError = true;
                            break;
                        }
                    }
                    if (hasRangeError)
                        continue;
                }
                if (fileResult.status === "pending") {
                    const accessAllowed = task.rooIgnoreController?.validateAccess(relPath);
                    if (!accessAllowed) {
                        await task.say("rooignore_error", relPath);
                        const errorMsg = responses_1.formatResponse.rooIgnoreError(relPath);
                        updateFileResult(relPath, {
                            status: "blocked",
                            error: errorMsg,
                            xmlContent: `<file><path>${relPath}</path><error>${errorMsg}</error></file>`,
                            nativeContent: `File: ${relPath}\nError: ${errorMsg}`,
                        });
                        continue;
                    }
                    filesToApprove.push(fileResult);
                }
            }
            if (filesToApprove.length > 1) {
                const { maxReadFileLine = -1 } = (await task.providerRef.deref()?.getState()) ?? {};
                const batchFiles = filesToApprove.map((fileResult) => {
                    const relPath = fileResult.path;
                    const fullPath = path_1.default.resolve(task.cwd, relPath);
                    const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath);
                    let lineSnippet = "";
                    if (fileResult.lineRanges && fileResult.lineRanges.length > 0) {
                        const ranges = fileResult.lineRanges.map((range) => (0, i18n_1.t)("tools:readFile.linesRange", { start: range.start, end: range.end }));
                        lineSnippet = ranges.join(", ");
                    }
                    else if (maxReadFileLine === 0) {
                        lineSnippet = (0, i18n_1.t)("tools:readFile.definitionsOnly");
                    }
                    else if (maxReadFileLine > 0) {
                        lineSnippet = (0, i18n_1.t)("tools:readFile.maxLines", { max: maxReadFileLine });
                    }
                    const readablePath = (0, path_2.getReadablePath)(task.cwd, relPath);
                    const key = `${readablePath}${lineSnippet ? ` (${lineSnippet})` : ""}`;
                    return { path: readablePath, lineSnippet, isOutsideWorkspace, key, content: fullPath };
                });
                const completeMessage = JSON.stringify({ tool: "readFile", batchFiles });
                const { response, text, images } = await task.ask("tool", completeMessage, false);
                if (response === "yesButtonClicked") {
                    if (text)
                        await task.say("user_feedback", text, images);
                    filesToApprove.forEach((fileResult) => {
                        updateFileResult(fileResult.path, {
                            status: "approved",
                            feedbackText: text,
                            feedbackImages: images,
                        });
                    });
                }
                else if (response === "noButtonClicked") {
                    if (text)
                        await task.say("user_feedback", text, images);
                    task.didRejectTool = true;
                    filesToApprove.forEach((fileResult) => {
                        updateFileResult(fileResult.path, {
                            status: "denied",
                            xmlContent: `<file><path>${fileResult.path}</path><status>Denied by user</status></file>`,
                            nativeContent: `File: ${fileResult.path}\nStatus: Denied by user`,
                            feedbackText: text,
                            feedbackImages: images,
                        });
                    });
                }
                else {
                    try {
                        const individualPermissions = JSON.parse(text || "{}");
                        let hasAnyDenial = false;
                        batchFiles.forEach((batchFile, index) => {
                            const fileResult = filesToApprove[index];
                            const approved = individualPermissions[batchFile.key] === true;
                            if (approved) {
                                updateFileResult(fileResult.path, { status: "approved" });
                            }
                            else {
                                hasAnyDenial = true;
                                updateFileResult(fileResult.path, {
                                    status: "denied",
                                    xmlContent: `<file><path>${fileResult.path}</path><status>Denied by user</status></file>`,
                                    nativeContent: `File: ${fileResult.path}\nStatus: Denied by user`,
                                });
                            }
                        });
                        if (hasAnyDenial)
                            task.didRejectTool = true;
                    }
                    catch (error) {
                        console.error("Failed to parse individual permissions:", error);
                        task.didRejectTool = true;
                        filesToApprove.forEach((fileResult) => {
                            updateFileResult(fileResult.path, {
                                status: "denied",
                                xmlContent: `<file><path>${fileResult.path}</path><status>Denied by user</status></file>`,
                                nativeContent: `File: ${fileResult.path}\nStatus: Denied by user`,
                            });
                        });
                    }
                }
            }
            else if (filesToApprove.length === 1) {
                const fileResult = filesToApprove[0];
                const relPath = fileResult.path;
                const fullPath = path_1.default.resolve(task.cwd, relPath);
                const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath);
                const { maxReadFileLine = -1 } = (await task.providerRef.deref()?.getState()) ?? {};
                let lineSnippet = "";
                if (fileResult.lineRanges && fileResult.lineRanges.length > 0) {
                    const ranges = fileResult.lineRanges.map((range) => (0, i18n_1.t)("tools:readFile.linesRange", { start: range.start, end: range.end }));
                    lineSnippet = ranges.join(", ");
                }
                else if (maxReadFileLine === 0) {
                    lineSnippet = (0, i18n_1.t)("tools:readFile.definitionsOnly");
                }
                else if (maxReadFileLine > 0) {
                    lineSnippet = (0, i18n_1.t)("tools:readFile.maxLines", { max: maxReadFileLine });
                }
                const completeMessage = JSON.stringify({
                    tool: "readFile",
                    path: (0, path_2.getReadablePath)(task.cwd, relPath),
                    isOutsideWorkspace,
                    content: fullPath,
                    reason: lineSnippet,
                });
                const { response, text, images } = await task.ask("tool", completeMessage, false);
                if (response !== "yesButtonClicked") {
                    if (text)
                        await task.say("user_feedback", text, images);
                    task.didRejectTool = true;
                    updateFileResult(relPath, {
                        status: "denied",
                        xmlContent: `<file><path>${relPath}</path><status>Denied by user</status></file>`,
                        nativeContent: `File: ${relPath}\nStatus: Denied by user`,
                        feedbackText: text,
                        feedbackImages: images,
                    });
                }
                else {
                    if (text)
                        await task.say("user_feedback", text, images);
                    updateFileResult(relPath, { status: "approved", feedbackText: text, feedbackImages: images });
                }
            }
            const imageMemoryTracker = new imageHelpers_1.ImageMemoryTracker();
            const state = await task.providerRef.deref()?.getState();
            const { maxReadFileLine = -1, maxImageFileSize = imageHelpers_1.DEFAULT_MAX_IMAGE_FILE_SIZE_MB, maxTotalImageSize = imageHelpers_1.DEFAULT_MAX_TOTAL_IMAGE_SIZE_MB, } = state ?? {};
            for (const fileResult of fileResults) {
                if (fileResult.status !== "approved")
                    continue;
                const relPath = fileResult.path;
                const fullPath = path_1.default.resolve(task.cwd, relPath);
                try {
                    const [totalLines, isBinary] = await Promise.all([(0, line_counter_1.countFileLines)(fullPath), (0, isbinaryfile_1.isBinaryFile)(fullPath)]);
                    if (isBinary) {
                        const fileExtension = path_1.default.extname(relPath).toLowerCase();
                        const supportedBinaryFormats = (0, extract_text_1.getSupportedBinaryFormats)();
                        if ((0, imageHelpers_1.isSupportedImageFormat)(fileExtension)) {
                            try {
                                const validationResult = await (0, imageHelpers_1.validateImageForProcessing)(fullPath, supportsImages, maxImageFileSize, maxTotalImageSize, imageMemoryTracker.getTotalMemoryUsed());
                                if (!validationResult.isValid) {
                                    await task.fileContextTracker.trackFileContext(relPath, "read_tool");
                                    updateFileResult(relPath, {
                                        xmlContent: `<file><path>${relPath}</path>\n<notice>${validationResult.notice}</notice>\n</file>`,
                                        nativeContent: `File: ${relPath}\nNote: ${validationResult.notice}`,
                                    });
                                    continue;
                                }
                                const imageResult = await (0, imageHelpers_1.processImageFile)(fullPath);
                                imageMemoryTracker.addMemoryUsage(imageResult.sizeInMB);
                                await task.fileContextTracker.trackFileContext(relPath, "read_tool");
                                updateFileResult(relPath, {
                                    xmlContent: `<file><path>${relPath}</path>\n<notice>${imageResult.notice}</notice>\n</file>`,
                                    nativeContent: `File: ${relPath}\nNote: ${imageResult.notice}`,
                                    imageDataUrl: imageResult.dataUrl,
                                });
                                continue;
                            }
                            catch (error) {
                                const errorMsg = error instanceof Error ? error.message : String(error);
                                updateFileResult(relPath, {
                                    status: "error",
                                    error: `Error reading image file: ${errorMsg}`,
                                    xmlContent: `<file><path>${relPath}</path><error>Error reading image file: ${errorMsg}</error></file>`,
                                    nativeContent: `File: ${relPath}\nError: Error reading image file: ${errorMsg}`,
                                });
                                await task.say("error", `Error reading image file ${relPath}: ${errorMsg}`);
                                continue;
                            }
                        }
                        if (supportedBinaryFormats && supportedBinaryFormats.includes(fileExtension)) {
                            // Fall through to extractTextFromFile
                        }
                        else {
                            const fileFormat = fileExtension.slice(1) || "bin";
                            updateFileResult(relPath, {
                                notice: `Binary file format: ${fileFormat}`,
                                xmlContent: `<file><path>${relPath}</path>\n<binary_file format="${fileFormat}">Binary file - content not displayed</binary_file>\n</file>`,
                                nativeContent: `File: ${relPath}\nBinary file (${fileFormat}) - content not displayed`,
                            });
                            continue;
                        }
                    }
                    if (fileResult.lineRanges && fileResult.lineRanges.length > 0) {
                        const rangeResults = [];
                        const nativeRangeResults = [];
                        for (const range of fileResult.lineRanges) {
                            const content = (0, extract_text_1.addLineNumbers)(await (0, read_lines_1.readLines)(fullPath, range.end - 1, range.start - 1), range.start);
                            const lineRangeAttr = ` lines="${range.start}-${range.end}"`;
                            rangeResults.push(`<content${lineRangeAttr}>\n${content}</content>`);
                            nativeRangeResults.push(`Lines ${range.start}-${range.end}:\n${content}`);
                        }
                        updateFileResult(relPath, {
                            xmlContent: `<file><path>${relPath}</path>\n${rangeResults.join("\n")}\n</file>`,
                            nativeContent: `File: ${relPath}\n${nativeRangeResults.join("\n\n")}`,
                        });
                        continue;
                    }
                    if (maxReadFileLine === 0) {
                        try {
                            const defResult = await (0, tree_sitter_1.parseSourceCodeDefinitionsForFile)(fullPath, task.rooIgnoreController);
                            if (defResult) {
                                const notice = `Showing only ${maxReadFileLine} of ${totalLines} total lines. Use line_range if you need to read more lines`;
                                updateFileResult(relPath, {
                                    xmlContent: `<file><path>${relPath}</path>\n<list_code_definition_names>${defResult}</list_code_definition_names>\n<notice>${notice}</notice>\n</file>`,
                                    nativeContent: `File: ${relPath}\nCode Definitions:\n${defResult}\n\nNote: ${notice}`,
                                });
                            }
                        }
                        catch (error) {
                            if (error instanceof Error && error.message.startsWith("Unsupported language:")) {
                                console.warn(`[read_file] Warning: ${error.message}`);
                            }
                            else {
                                console.error(`[read_file] Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
                            }
                        }
                        continue;
                    }
                    if (maxReadFileLine > 0 && totalLines > maxReadFileLine) {
                        const content = (0, extract_text_1.addLineNumbers)(await (0, read_lines_1.readLines)(fullPath, maxReadFileLine - 1, 0));
                        const lineRangeAttr = ` lines="1-${maxReadFileLine}"`;
                        let xmlInfo = `<content${lineRangeAttr}>\n${content}</content>\n`;
                        let nativeInfo = `Lines 1-${maxReadFileLine}:\n${content}\n`;
                        try {
                            const defResult = await (0, tree_sitter_1.parseSourceCodeDefinitionsForFile)(fullPath, task.rooIgnoreController);
                            if (defResult) {
                                const truncatedDefs = (0, truncateDefinitions_1.truncateDefinitionsToLineLimit)(defResult, maxReadFileLine);
                                xmlInfo += `<list_code_definition_names>${truncatedDefs}</list_code_definition_names>\n`;
                                nativeInfo += `\nCode Definitions:\n${truncatedDefs}\n`;
                            }
                            const notice = `Showing only ${maxReadFileLine} of ${totalLines} total lines. Use line_range if you need to read more lines`;
                            xmlInfo += `<notice>${notice}</notice>\n`;
                            nativeInfo += `\nNote: ${notice}`;
                            updateFileResult(relPath, {
                                xmlContent: `<file><path>${relPath}</path>\n${xmlInfo}</file>`,
                                nativeContent: `File: ${relPath}\n${nativeInfo}`,
                            });
                        }
                        catch (error) {
                            if (error instanceof Error && error.message.startsWith("Unsupported language:")) {
                                console.warn(`[read_file] Warning: ${error.message}`);
                            }
                            else {
                                console.error(`[read_file] Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
                            }
                        }
                        continue;
                    }
                    const modelInfo = task.api.getModel().info;
                    const { contextTokens } = task.getTokenUsage();
                    const contextWindow = modelInfo.contextWindow;
                    const budgetResult = await (0, fileTokenBudget_1.validateFileTokenBudget)(fullPath, contextWindow, contextTokens || 0);
                    let content = await (0, extract_text_1.extractTextFromFile)(fullPath);
                    let xmlInfo = "";
                    let nativeInfo = "";
                    if (budgetResult.shouldTruncate && budgetResult.maxChars !== undefined) {
                        const truncateResult = (0, fileTokenBudget_1.truncateFileContent)(content, budgetResult.maxChars, content.length, budgetResult.isPreview);
                        content = truncateResult.content;
                        let displayedLines = content.length === 0 ? 0 : content.split(/\r?\n/).length;
                        if (displayedLines > 0 && content.endsWith("\n")) {
                            displayedLines--;
                        }
                        const lineRangeAttr = displayedLines > 0 ? ` lines="1-${displayedLines}"` : "";
                        xmlInfo =
                            content.length > 0 ? `<content${lineRangeAttr}>\n${content}</content>\n` : `<content/>`;
                        xmlInfo += `<notice>${truncateResult.notice}</notice>\n`;
                        nativeInfo =
                            content.length > 0
                                ? `Lines 1-${displayedLines}:\n${content}\n\nNote: ${truncateResult.notice}`
                                : `Note: ${truncateResult.notice}`;
                    }
                    else {
                        const lineRangeAttr = ` lines="1-${totalLines}"`;
                        xmlInfo = totalLines > 0 ? `<content${lineRangeAttr}>\n${content}</content>\n` : `<content/>`;
                        if (totalLines === 0) {
                            xmlInfo += `<notice>File is empty</notice>\n`;
                            nativeInfo = "Note: File is empty";
                        }
                        else {
                            nativeInfo = `Lines 1-${totalLines}:\n${content}`;
                        }
                    }
                    await task.fileContextTracker.trackFileContext(relPath, "read_tool");
                    updateFileResult(relPath, {
                        xmlContent: `<file><path>${relPath}</path>\n${xmlInfo}</file>`,
                        nativeContent: `File: ${relPath}\n${nativeInfo}`,
                    });
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    updateFileResult(relPath, {
                        status: "error",
                        error: `Error reading file: ${errorMsg}`,
                        xmlContent: `<file><path>${relPath}</path><error>Error reading file: ${errorMsg}</error></file>`,
                        nativeContent: `File: ${relPath}\nError: Error reading file: ${errorMsg}`,
                    });
                    await task.say("error", `Error reading file ${relPath}: ${errorMsg}`);
                }
            }
            // Build final result based on protocol
            let finalResult;
            if (useNative) {
                const nativeResults = fileResults
                    .filter((result) => result.nativeContent)
                    .map((result) => result.nativeContent);
                finalResult = nativeResults.join("\n\n---\n\n");
            }
            else {
                const xmlResults = fileResults.filter((result) => result.xmlContent).map((result) => result.xmlContent);
                finalResult = `<files>\n${xmlResults.join("\n")}\n</files>`;
            }
            const fileImageUrls = fileResults
                .filter((result) => result.imageDataUrl)
                .map((result) => result.imageDataUrl);
            let statusMessage = "";
            let feedbackImages = [];
            const deniedWithFeedback = fileResults.find((result) => result.status === "denied" && result.feedbackText);
            if (deniedWithFeedback && deniedWithFeedback.feedbackText) {
                statusMessage = responses_1.formatResponse.toolDeniedWithFeedback(deniedWithFeedback.feedbackText);
                feedbackImages = deniedWithFeedback.feedbackImages || [];
            }
            else if (task.didRejectTool) {
                statusMessage = responses_1.formatResponse.toolDenied();
            }
            else {
                const approvedWithFeedback = fileResults.find((result) => result.status === "approved" && result.feedbackText);
                if (approvedWithFeedback && approvedWithFeedback.feedbackText) {
                    statusMessage = responses_1.formatResponse.toolApprovedWithFeedback(approvedWithFeedback.feedbackText);
                    feedbackImages = approvedWithFeedback.feedbackImages || [];
                }
            }
            const allImages = [...feedbackImages, ...fileImageUrls];
            const finalModelSupportsImages = task.api.getModel().info.supportsImages ?? false;
            const imagesToInclude = finalModelSupportsImages ? allImages : [];
            if (statusMessage || imagesToInclude.length > 0) {
                const result = responses_1.formatResponse.toolResult(statusMessage || finalResult, imagesToInclude.length > 0 ? imagesToInclude : undefined);
                if (typeof result === "string") {
                    if (statusMessage) {
                        pushToolResult(`${result}\n${finalResult}`);
                    }
                    else {
                        pushToolResult(result);
                    }
                }
                else {
                    if (statusMessage) {
                        const textBlock = { type: "text", text: finalResult };
                        pushToolResult([...result, textBlock]);
                    }
                    else {
                        pushToolResult(result);
                    }
                }
            }
            else {
                pushToolResult(finalResult);
            }
        }
        catch (error) {
            const relPath = fileEntries[0]?.path || "unknown";
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (fileResults.length > 0) {
                updateFileResult(relPath, {
                    status: "error",
                    error: `Error reading file: ${errorMsg}`,
                    xmlContent: `<file><path>${relPath}</path><error>Error reading file: ${errorMsg}</error></file>`,
                    nativeContent: `File: ${relPath}\nError: Error reading file: ${errorMsg}`,
                });
            }
            await task.say("error", `Error reading file ${relPath}: ${errorMsg}`);
            // Build final error result based on protocol
            let errorResult;
            if (useNative) {
                const nativeResults = fileResults
                    .filter((result) => result.nativeContent)
                    .map((result) => result.nativeContent);
                errorResult = nativeResults.join("\n\n---\n\n");
            }
            else {
                const xmlResults = fileResults.filter((result) => result.xmlContent).map((result) => result.xmlContent);
                errorResult = `<files>\n${xmlResults.join("\n")}\n</files>`;
            }
            pushToolResult(errorResult);
        }
    }
    getReadFileToolDescription(blockName, second) {
        // If native typed args ({ files: FileEntry[] }) were provided
        if (second && typeof second === "object" && "files" in second && Array.isArray(second.files)) {
            const paths = second.files.map((f) => f?.path).filter(Boolean);
            if (paths.length === 0) {
                return `[${blockName} with no valid paths]`;
            }
            else if (paths.length === 1) {
                return `[${blockName} for '${paths[0]}'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.]`;
            }
            else if (paths.length <= 3) {
                const pathList = paths.map((p) => `'${p}'`).join(", ");
                return `[${blockName} for ${pathList}]`;
            }
            else {
                return `[${blockName} for ${paths.length} files]`;
            }
        }
        // Fallback to legacy/XML or synthesized params
        const blockParams = second;
        if (blockParams?.args) {
            try {
                const parsed = (0, xml_1.parseXml)(blockParams.args);
                const files = Array.isArray(parsed.file) ? parsed.file : [parsed.file].filter(Boolean);
                const paths = files.map((f) => f?.path).filter(Boolean);
                if (paths.length === 0) {
                    return `[${blockName} with no valid paths]`;
                }
                else if (paths.length === 1) {
                    return `[${blockName} for '${paths[0]}'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.]`;
                }
                else if (paths.length <= 3) {
                    const pathList = paths.map((p) => `'${p}'`).join(", ");
                    return `[${blockName} for ${pathList}]`;
                }
                else {
                    return `[${blockName} for ${paths.length} files]`;
                }
            }
            catch (error) {
                console.error("Failed to parse read_file args XML for description:", error);
                return `[${blockName} with unparsable args]`;
            }
        }
        else if (blockParams?.path) {
            return `[${blockName} for '${blockParams.path}'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.]`;
        }
        else if (blockParams?.files) {
            // Back-compat: some paths may still synthesize params.files; try to parse if present
            try {
                const files = JSON.parse(blockParams.files);
                if (Array.isArray(files) && files.length > 0) {
                    const paths = files.map((f) => f?.path).filter(Boolean);
                    if (paths.length === 1) {
                        return `[${blockName} for '${paths[0]}'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.]`;
                    }
                    else if (paths.length <= 3) {
                        const pathList = paths.map((p) => `'${p}'`).join(", ");
                        return `[${blockName} for ${pathList}]`;
                    }
                    else {
                        return `[${blockName} for ${paths.length} files]`;
                    }
                }
            }
            catch (error) {
                console.error("Failed to parse native files JSON for description:", error);
                return `[${blockName} with unparsable files]`;
            }
        }
        return `[${blockName} with missing path/args/files]`;
    }
    async handlePartial(task, block) {
        const argsXmlTag = block.params.args;
        const legacyPath = block.params.path;
        let filePath = "";
        if (argsXmlTag) {
            const match = argsXmlTag.match(/<file>.*?<path>([^<]+)<\/path>/s);
            if (match)
                filePath = match[1];
        }
        if (!filePath && legacyPath) {
            filePath = legacyPath;
        }
        const fullPath = filePath ? path_1.default.resolve(task.cwd, filePath) : "";
        const sharedMessageProps = {
            tool: "readFile",
            path: (0, path_2.getReadablePath)(task.cwd, filePath),
            isOutsideWorkspace: filePath ? (0, pathUtils_1.isPathOutsideWorkspace)(fullPath) : false,
        };
        const partialMessage = JSON.stringify({
            ...sharedMessageProps,
            content: undefined,
        });
        await task.ask("tool", partialMessage, block.partial).catch(() => { });
    }
}
exports.ReadFileTool = ReadFileTool;
exports.readFileTool = new ReadFileTool();
//# sourceMappingURL=ReadFileTool.js.map