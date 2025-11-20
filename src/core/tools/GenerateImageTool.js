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
exports.generateImageTool = exports.GenerateImageTool = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const vscode = __importStar(require("vscode"));
const responses_1 = require("../prompts/responses");
const fs_1 = require("../../utils/fs");
const path_2 = require("../../utils/path");
const pathUtils_1 = require("../../utils/pathUtils");
const experiments_1 = require("../../shared/experiments");
const openrouter_1 = require("../../api/providers/openrouter");
const BaseTool_1 = require("./BaseTool");
const IMAGE_GENERATION_MODELS = ["google/gemini-2.5-flash-image", "openai/gpt-5-image", "openai/gpt-5-image-mini"];
class GenerateImageTool extends BaseTool_1.BaseTool {
    name = "generate_image";
    parseLegacy(params) {
        return {
            prompt: params.prompt || "",
            path: params.path || "",
            image: params.image,
        };
    }
    async execute(params, task, callbacks) {
        const { prompt, path: relPath, image: inputImagePath } = params;
        const { handleError, pushToolResult, askApproval, removeClosingTag } = callbacks;
        const provider = task.providerRef.deref();
        const state = await provider?.getState();
        const isImageGenerationEnabled = experiments_1.experiments.isEnabled(state?.experiments ?? {}, experiments_1.EXPERIMENT_IDS.IMAGE_GENERATION);
        if (!isImageGenerationEnabled) {
            pushToolResult(responses_1.formatResponse.toolError("Image generation is an experimental feature that must be enabled in settings. Please enable 'Image Generation' in the Experimental Settings section."));
            return;
        }
        if (!prompt) {
            task.consecutiveMistakeCount++;
            task.recordToolError("generate_image");
            pushToolResult(await task.sayAndCreateMissingParamError("generate_image", "prompt"));
            return;
        }
        if (!relPath) {
            task.consecutiveMistakeCount++;
            task.recordToolError("generate_image");
            pushToolResult(await task.sayAndCreateMissingParamError("generate_image", "path"));
            return;
        }
        const accessAllowed = task.rooIgnoreController?.validateAccess(relPath);
        if (!accessAllowed) {
            await task.say("rooignore_error", relPath);
            pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)));
            return;
        }
        let inputImageData;
        if (inputImagePath) {
            const inputImageFullPath = path_1.default.resolve(task.cwd, inputImagePath);
            const inputImageExists = await (0, fs_1.fileExistsAtPath)(inputImageFullPath);
            if (!inputImageExists) {
                await task.say("error", `Input image not found: ${(0, path_2.getReadablePath)(task.cwd, inputImagePath)}`);
                pushToolResult(responses_1.formatResponse.toolError(`Input image not found: ${(0, path_2.getReadablePath)(task.cwd, inputImagePath)}`));
                return;
            }
            const inputImageAccessAllowed = task.rooIgnoreController?.validateAccess(inputImagePath);
            if (!inputImageAccessAllowed) {
                await task.say("rooignore_error", inputImagePath);
                pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(inputImagePath)));
                return;
            }
            try {
                const imageBuffer = await promises_1.default.readFile(inputImageFullPath);
                const imageExtension = path_1.default.extname(inputImageFullPath).toLowerCase().replace(".", "");
                const supportedFormats = ["png", "jpg", "jpeg", "gif", "webp"];
                if (!supportedFormats.includes(imageExtension)) {
                    await task.say("error", `Unsupported image format: ${imageExtension}. Supported formats: ${supportedFormats.join(", ")}`);
                    pushToolResult(responses_1.formatResponse.toolError(`Unsupported image format: ${imageExtension}. Supported formats: ${supportedFormats.join(", ")}`));
                    return;
                }
                const mimeType = imageExtension === "jpg" ? "jpeg" : imageExtension;
                inputImageData = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`;
            }
            catch (error) {
                await task.say("error", `Failed to read input image: ${error instanceof Error ? error.message : "Unknown error"}`);
                pushToolResult(responses_1.formatResponse.toolError(`Failed to read input image: ${error instanceof Error ? error.message : "Unknown error"}`));
                return;
            }
        }
        const isWriteProtected = task.rooProtectedController?.isWriteProtected(relPath) || false;
        const openRouterApiKey = state?.openRouterImageApiKey;
        if (!openRouterApiKey) {
            await task.say("error", "OpenRouter API key is required for image generation. Please configure it in the Image Generation experimental settings.");
            pushToolResult(responses_1.formatResponse.toolError("OpenRouter API key is required for image generation. Please configure it in the Image Generation experimental settings."));
            return;
        }
        const selectedModel = state?.openRouterImageGenerationSelectedModel || IMAGE_GENERATION_MODELS[0];
        const fullPath = path_1.default.resolve(task.cwd, removeClosingTag("path", relPath));
        const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath);
        const sharedMessageProps = {
            tool: "generateImage",
            path: (0, path_2.getReadablePath)(task.cwd, removeClosingTag("path", relPath)),
            content: prompt,
            isOutsideWorkspace,
            isProtected: isWriteProtected,
        };
        try {
            task.consecutiveMistakeCount = 0;
            const approvalMessage = JSON.stringify({
                ...sharedMessageProps,
                content: prompt,
                ...(inputImagePath && { inputImage: (0, path_2.getReadablePath)(task.cwd, inputImagePath) }),
            });
            const didApprove = await askApproval("tool", approvalMessage, undefined, isWriteProtected);
            if (!didApprove) {
                return;
            }
            const openRouterHandler = new openrouter_1.OpenRouterHandler({});
            const result = await openRouterHandler.generateImage(prompt, selectedModel, openRouterApiKey, inputImageData);
            if (!result.success) {
                await task.say("error", result.error || "Failed to generate image");
                pushToolResult(responses_1.formatResponse.toolError(result.error || "Failed to generate image"));
                return;
            }
            if (!result.imageData) {
                const errorMessage = "No image data received";
                await task.say("error", errorMessage);
                pushToolResult(responses_1.formatResponse.toolError(errorMessage));
                return;
            }
            const base64Match = result.imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
            if (!base64Match) {
                const errorMessage = "Invalid image format received";
                await task.say("error", errorMessage);
                pushToolResult(responses_1.formatResponse.toolError(errorMessage));
                return;
            }
            const imageFormat = base64Match[1];
            const base64Data = base64Match[2];
            let finalPath = relPath;
            if (!finalPath.match(/\.(png|jpg|jpeg)$/i)) {
                finalPath = `${finalPath}.${imageFormat === "jpeg" ? "jpg" : imageFormat}`;
            }
            const imageBuffer = Buffer.from(base64Data, "base64");
            const absolutePath = path_1.default.resolve(task.cwd, finalPath);
            const directory = path_1.default.dirname(absolutePath);
            await promises_1.default.mkdir(directory, { recursive: true });
            await promises_1.default.writeFile(absolutePath, imageBuffer);
            if (finalPath) {
                await task.fileContextTracker.trackFileContext(finalPath, "roo_edited");
            }
            task.didEditFile = true;
            task.recordToolUsage("generate_image");
            const fullImagePath = path_1.default.join(task.cwd, finalPath);
            let imageUri = provider?.convertToWebviewUri?.(fullImagePath) ?? vscode.Uri.file(fullImagePath).toString();
            const cacheBuster = Date.now();
            imageUri = imageUri.includes("?") ? `${imageUri}&t=${cacheBuster}` : `${imageUri}?t=${cacheBuster}`;
            await task.say("image", JSON.stringify({ imageUri, imagePath: fullImagePath }));
            pushToolResult(responses_1.formatResponse.toolResult((0, path_2.getReadablePath)(task.cwd, finalPath)));
        }
        catch (error) {
            await handleError("generating image", error);
        }
    }
    async handlePartial(task, block) {
        return;
    }
}
exports.GenerateImageTool = GenerateImageTool;
exports.generateImageTool = new GenerateImageTool();
//# sourceMappingURL=GenerateImageTool.js.map