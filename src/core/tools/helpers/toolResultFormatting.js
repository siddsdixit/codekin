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
exports.getCurrentToolProtocol = getCurrentToolProtocol;
exports.formatToolInvocation = formatToolInvocation;
const vscode = __importStar(require("vscode"));
const package_1 = require("../../../shared/package");
const types_1 = require("@roo-code/types");
/**
 * Gets the current tool protocol from workspace configuration.
 */
function getCurrentToolProtocol() {
    return vscode.workspace.getConfiguration(package_1.Package.name).get("toolProtocol", "xml");
}
/**
 * Formats tool invocation parameters for display based on protocol.
 * Used for legacy conversation history conversion.
 */
function formatToolInvocation(toolName, params, protocol) {
    const effectiveProtocol = protocol ?? getCurrentToolProtocol();
    if ((0, types_1.isNativeProtocol)(effectiveProtocol)) {
        // Native protocol: readable format
        const paramsList = Object.entries(params)
            .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
            .join(", ");
        return `Called ${toolName}${paramsList ? ` with ${paramsList}` : ""}`;
    }
    else {
        // XML protocol: preserve XML format
        const paramsXml = Object.entries(params)
            .map(([key, value]) => `<${key}>\n${value}\n</${key}>`)
            .join("\n");
        return `<${toolName}>\n${paramsXml}\n</${toolName}>`;
    }
}
//# sourceMappingURL=toolResultFormatting.js.map