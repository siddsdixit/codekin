import type { ClineMessage } from "@roo-code/types";
export type TaskMetadataOptions = {
    taskId: string;
    rootTaskId?: string;
    parentTaskId?: string;
    taskNumber: number;
    messages: ClineMessage[];
    globalStoragePath: string;
    workspace: string;
    mode?: string;
};
export declare function taskMetadata({ taskId: id, rootTaskId, parentTaskId, taskNumber, messages, globalStoragePath, workspace, mode, }: TaskMetadataOptions): Promise<{
    historyItem: {
        number: number;
        id: string;
        ts: number;
        totalCost: number;
        task: string;
        tokensIn: number;
        tokensOut: number;
        rootTaskId?: string | undefined;
        parentTaskId?: string | undefined;
        cacheWrites?: number | undefined;
        cacheReads?: number | undefined;
        size?: number | undefined;
        workspace?: string | undefined;
        mode?: string | undefined;
    };
    tokenUsage: {
        totalTokensIn: number;
        totalTokensOut: number;
        totalCost: number;
        contextTokens: number;
        totalCacheWrites?: number | undefined;
        totalCacheReads?: number | undefined;
    };
}>;
//# sourceMappingURL=taskMetadata.d.ts.map