import { z } from "zod";
import { type RooCodeSettings, type ProviderSettings, type PromptComponent, type ModeConfig, type InstallMarketplaceItemOptions, type MarketplaceItem, type ShareVisibility, type QueuedMessage } from "@roo-code/types";
import { Mode } from "./modes";
export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse" | "objectResponse";
export type PromptMode = Mode | "enhance";
export type AudioType = "notification" | "celebration" | "progress_loop";
export interface UpdateTodoListPayload {
    todos: any[];
}
export type EditQueuedMessagePayload = Pick<QueuedMessage, "id" | "text" | "images">;
export interface WebviewMessage {
    type: "updateTodoList" | "deleteMultipleTasksWithIds" | "currentApiConfigName" | "saveApiConfiguration" | "upsertApiConfiguration" | "deleteApiConfiguration" | "loadApiConfiguration" | "loadApiConfigurationById" | "renameApiConfiguration" | "getListApiConfiguration" | "customInstructions" | "webviewDidLaunch" | "newTask" | "askResponse" | "terminalOperation" | "clearTask" | "didShowAnnouncement" | "selectImages" | "exportCurrentTask" | "shareCurrentTask" | "showTaskWithId" | "deleteTaskWithId" | "exportTaskWithId" | "importSettings" | "exportSettings" | "resetState" | "flushRouterModels" | "requestRouterModels" | "requestOpenAiModels" | "requestOllamaModels" | "requestLmStudioModels" | "requestRooModels" | "requestVsCodeLmModels" | "requestHuggingFaceModels" | "openImage" | "saveImage" | "openFile" | "openMention" | "cancelTask" | "updateVSCodeSetting" | "getVSCodeSetting" | "vsCodeSetting" | "updateCondensingPrompt" | "playSound" | "playTts" | "stopTts" | "ttsEnabled" | "ttsSpeed" | "openKeyboardShortcuts" | "openMcpSettings" | "openProjectMcpSettings" | "restartMcpServer" | "refreshAllMcpServers" | "toggleToolAlwaysAllow" | "toggleToolEnabledForPrompt" | "toggleMcpServer" | "updateMcpTimeout" | "enhancePrompt" | "enhancedPrompt" | "draggedImages" | "deleteMessage" | "deleteMessageConfirm" | "submitEditedMessage" | "editMessageConfirm" | "enableMcpServerCreation" | "remoteControlEnabled" | "taskSyncEnabled" | "searchCommits" | "setApiConfigPassword" | "mode" | "updatePrompt" | "getSystemPrompt" | "copySystemPrompt" | "systemPrompt" | "enhancementApiConfigId" | "autoApprovalEnabled" | "updateCustomMode" | "deleteCustomMode" | "setopenAiCustomModelInfo" | "openCustomModesSettings" | "checkpointDiff" | "checkpointRestore" | "deleteMcpServer" | "humanRelayResponse" | "humanRelayCancel" | "codebaseIndexEnabled" | "telemetrySetting" | "testBrowserConnection" | "browserConnectionResult" | "searchFiles" | "toggleApiConfigPin" | "hasOpenedModeSelector" | "cloudButtonClicked" | "rooCloudSignIn" | "cloudLandingPageSignIn" | "rooCloudSignOut" | "rooCloudManualUrl" | "switchOrganization" | "condenseTaskContextRequest" | "requestIndexingStatus" | "startIndexing" | "clearIndexData" | "indexingStatusUpdate" | "indexCleared" | "focusPanelRequest" | "openExternal" | "filterMarketplaceItems" | "marketplaceButtonClicked" | "installMarketplaceItem" | "installMarketplaceItemWithParameters" | "cancelMarketplaceInstall" | "removeInstalledMarketplaceItem" | "marketplaceInstallResult" | "fetchMarketplaceData" | "switchTab" | "shareTaskSuccess" | "exportMode" | "exportModeResult" | "importMode" | "importModeResult" | "checkRulesDirectory" | "checkRulesDirectoryResult" | "saveCodeIndexSettingsAtomic" | "requestCodeIndexSecretStatus" | "requestCommands" | "openCommandFile" | "deleteCommand" | "createCommand" | "insertTextIntoTextarea" | "showMdmAuthRequiredNotification" | "imageGenerationSettings" | "queueMessage" | "removeQueuedMessage" | "editQueuedMessage" | "dismissUpsell" | "getDismissedUpsells" | "updateSettings";
    text?: string;
    editedMessageContent?: string;
    tab?: "settings" | "history" | "mcp" | "modes" | "chat" | "marketplace" | "cloud";
    disabled?: boolean;
    context?: string;
    dataUri?: string;
    askResponse?: ClineAskResponse;
    apiConfiguration?: ProviderSettings;
    images?: string[];
    bool?: boolean;
    value?: number;
    commands?: string[];
    audioType?: AudioType;
    serverName?: string;
    toolName?: string;
    alwaysAllow?: boolean;
    isEnabled?: boolean;
    mode?: Mode;
    promptMode?: PromptMode;
    customPrompt?: PromptComponent;
    dataUrls?: string[];
    values?: Record<string, any>;
    query?: string;
    setting?: string;
    slug?: string;
    modeConfig?: ModeConfig;
    timeout?: number;
    payload?: WebViewMessagePayload;
    source?: "global" | "project";
    requestId?: string;
    ids?: string[];
    hasSystemPromptOverride?: boolean;
    terminalOperation?: "continue" | "abort";
    messageTs?: number;
    restoreCheckpoint?: boolean;
    historyPreviewCollapsed?: boolean;
    filters?: {
        type?: string;
        search?: string;
        tags?: string[];
    };
    settings?: any;
    url?: string;
    mpItem?: MarketplaceItem;
    mpInstallOptions?: InstallMarketplaceItemOptions;
    config?: Record<string, any>;
    visibility?: ShareVisibility;
    hasContent?: boolean;
    checkOnly?: boolean;
    upsellId?: string;
    list?: string[];
    organizationId?: string | null;
    codeIndexSettings?: {
        codebaseIndexEnabled: boolean;
        codebaseIndexQdrantUrl: string;
        codebaseIndexEmbedderProvider: "openai" | "ollama" | "openai-compatible" | "gemini" | "mistral" | "vercel-ai-gateway" | "openrouter";
        codebaseIndexEmbedderBaseUrl?: string;
        codebaseIndexEmbedderModelId: string;
        codebaseIndexEmbedderModelDimension?: number;
        codebaseIndexOpenAiCompatibleBaseUrl?: string;
        codebaseIndexSearchMaxResults?: number;
        codebaseIndexSearchMinScore?: number;
        codeIndexOpenAiKey?: string;
        codeIndexQdrantApiKey?: string;
        codebaseIndexOpenAiCompatibleApiKey?: string;
        codebaseIndexGeminiApiKey?: string;
        codebaseIndexMistralApiKey?: string;
        codebaseIndexVercelAiGatewayApiKey?: string;
        codebaseIndexOpenRouterApiKey?: string;
    };
    updatedSettings?: RooCodeSettings;
}
export declare const checkoutDiffPayloadSchema: z.ZodObject<{
    ts: z.ZodOptional<z.ZodNumber>;
    previousCommitHash: z.ZodOptional<z.ZodString>;
    commitHash: z.ZodString;
    mode: z.ZodEnum<["full", "checkpoint", "from-init", "to-current"]>;
}, "strip", z.ZodTypeAny, {
    mode: "checkpoint" | "full" | "from-init" | "to-current";
    commitHash: string;
    ts?: number | undefined;
    previousCommitHash?: string | undefined;
}, {
    mode: "checkpoint" | "full" | "from-init" | "to-current";
    commitHash: string;
    ts?: number | undefined;
    previousCommitHash?: string | undefined;
}>;
export type CheckpointDiffPayload = z.infer<typeof checkoutDiffPayloadSchema>;
export declare const checkoutRestorePayloadSchema: z.ZodObject<{
    ts: z.ZodNumber;
    commitHash: z.ZodString;
    mode: z.ZodEnum<["preview", "restore"]>;
}, "strip", z.ZodTypeAny, {
    ts: number;
    mode: "preview" | "restore";
    commitHash: string;
}, {
    ts: number;
    mode: "preview" | "restore";
    commitHash: string;
}>;
export type CheckpointRestorePayload = z.infer<typeof checkoutRestorePayloadSchema>;
export interface IndexingStatusPayload {
    state: "Standby" | "Indexing" | "Indexed" | "Error";
    message: string;
}
export interface IndexClearedPayload {
    success: boolean;
    error?: string;
}
export declare const installMarketplaceItemWithParametersPayloadSchema: z.ZodObject<{
    item: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        author: z.ZodOptional<z.ZodString>;
        authorUrl: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    } & {
        content: z.ZodString;
    } & {
        type: z.ZodLiteral<"mode">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "mode";
        name: string;
        description: string;
        content: string;
        tags?: string[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    }, {
        id: string;
        type: "mode";
        name: string;
        description: string;
        content: string;
        tags?: string[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        author: z.ZodOptional<z.ZodString>;
        authorUrl: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    } & {
        url: z.ZodString;
        content: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            content: z.ZodString;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                key: z.ZodString;
                placeholder: z.ZodOptional<z.ZodString>;
                optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                key: string;
                optional: boolean;
                placeholder?: string | undefined;
            }, {
                name: string;
                key: string;
                placeholder?: string | undefined;
                optional?: boolean | undefined;
            }>, "many">>;
            prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                optional: boolean;
                placeholder?: string | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }, {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                placeholder?: string | undefined;
                optional?: boolean | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }>, "many">]>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            key: z.ZodString;
            placeholder: z.ZodOptional<z.ZodString>;
            optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            key: string;
            optional: boolean;
            placeholder?: string | undefined;
        }, {
            name: string;
            key: string;
            placeholder?: string | undefined;
            optional?: boolean | undefined;
        }>, "many">>;
    } & {
        type: z.ZodLiteral<"mcp">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "mcp";
        name: string;
        description: string;
        url: string;
        content: string | {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                optional: boolean;
                placeholder?: string | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }[];
        tags?: string[] | undefined;
        parameters?: {
            name: string;
            key: string;
            optional: boolean;
            placeholder?: string | undefined;
        }[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    }, {
        id: string;
        type: "mcp";
        name: string;
        description: string;
        url: string;
        content: string | {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                placeholder?: string | undefined;
                optional?: boolean | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }[];
        tags?: string[] | undefined;
        parameters?: {
            name: string;
            key: string;
            placeholder?: string | undefined;
            optional?: boolean | undefined;
        }[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    }>]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    parameters: Record<string, any>;
    item: {
        id: string;
        type: "mode";
        name: string;
        description: string;
        content: string;
        tags?: string[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    } | {
        id: string;
        type: "mcp";
        name: string;
        description: string;
        url: string;
        content: string | {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                optional: boolean;
                placeholder?: string | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }[];
        tags?: string[] | undefined;
        parameters?: {
            name: string;
            key: string;
            optional: boolean;
            placeholder?: string | undefined;
        }[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    };
}, {
    parameters: Record<string, any>;
    item: {
        id: string;
        type: "mode";
        name: string;
        description: string;
        content: string;
        tags?: string[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    } | {
        id: string;
        type: "mcp";
        name: string;
        description: string;
        url: string;
        content: string | {
            name: string;
            content: string;
            parameters?: {
                name: string;
                key: string;
                placeholder?: string | undefined;
                optional?: boolean | undefined;
            }[] | undefined;
            prerequisites?: string[] | undefined;
        }[];
        tags?: string[] | undefined;
        parameters?: {
            name: string;
            key: string;
            placeholder?: string | undefined;
            optional?: boolean | undefined;
        }[] | undefined;
        prerequisites?: string[] | undefined;
        author?: string | undefined;
        authorUrl?: string | undefined;
    };
}>;
export type InstallMarketplaceItemWithParametersPayload = z.infer<typeof installMarketplaceItemWithParametersPayloadSchema>;
export type WebViewMessagePayload = CheckpointDiffPayload | CheckpointRestorePayload | IndexingStatusPayload | IndexClearedPayload | InstallMarketplaceItemWithParametersPayload | UpdateTodoListPayload | EditQueuedMessagePayload;
//# sourceMappingURL=WebviewMessage.d.ts.map