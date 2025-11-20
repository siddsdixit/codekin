"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installMarketplaceItemWithParametersPayloadSchema = exports.checkoutRestorePayloadSchema = exports.checkoutDiffPayloadSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("@roo-code/types");
exports.checkoutDiffPayloadSchema = zod_1.z.object({
    ts: zod_1.z.number().optional(),
    previousCommitHash: zod_1.z.string().optional(),
    commitHash: zod_1.z.string(),
    mode: zod_1.z.enum(["full", "checkpoint", "from-init", "to-current"]),
});
exports.checkoutRestorePayloadSchema = zod_1.z.object({
    ts: zod_1.z.number(),
    commitHash: zod_1.z.string(),
    mode: zod_1.z.enum(["preview", "restore"]),
});
exports.installMarketplaceItemWithParametersPayloadSchema = zod_1.z.object({
    item: types_1.marketplaceItemSchema,
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
});
//# sourceMappingURL=WebviewMessage.js.map