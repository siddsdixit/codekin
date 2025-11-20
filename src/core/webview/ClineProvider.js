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
exports.ClineProvider = void 0;
const os_1 = __importDefault(require("os"));
const path = __importStar(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const events_1 = __importDefault(require("events"));
const delay_1 = __importDefault(require("delay"));
const axios_1 = __importDefault(require("axios"));
const p_wait_for_1 = __importDefault(require("p-wait-for"));
const vscode = __importStar(require("vscode"));
const types_1 = require("@roo-code/types");
const telemetry_1 = require("@roo-code/telemetry");
const cloud_1 = require("@roo-code/cloud");
const package_1 = require("../../shared/package");
const array_1 = require("../../shared/array");
const support_prompt_1 = require("../../shared/support-prompt");
const globalFileNames_1 = require("../../shared/globalFileNames");
const modes_1 = require("../../shared/modes");
const experiments_1 = require("../../shared/experiments");
const language_1 = require("../../shared/language");
const embeddingModels_1 = require("../../shared/embeddingModels");
const ProfileValidator_1 = require("../../shared/ProfileValidator");
const Terminal_1 = require("../../integrations/terminal/Terminal");
const export_markdown_1 = require("../../integrations/misc/export-markdown");
const getTheme_1 = require("../../integrations/theme/getTheme");
const WorkspaceTracker_1 = __importDefault(require("../../integrations/workspace/WorkspaceTracker"));
const McpServerManager_1 = require("../../services/mcp/McpServerManager");
const marketplace_1 = require("../../services/marketplace");
const ShadowCheckpointService_1 = require("../../services/checkpoints/ShadowCheckpointService");
const manager_1 = require("../../services/code-index/manager");
const fs_1 = require("../../utils/fs");
const tts_1 = require("../../utils/tts");
const git_1 = require("../../utils/git");
const path_1 = require("../../utils/path");
const errors_1 = require("../../utils/errors");
const registerCommands_1 = require("../../activate/registerCommands");
const i18n_1 = require("../../i18n");
const api_1 = require("../../api");
const lmstudio_1 = require("../../api/providers/fetchers/lmstudio");
const ProviderSettingsManager_1 = require("../config/ProviderSettingsManager");
const CustomModesManager_1 = require("../config/CustomModesManager");
const Task_1 = require("../task/Task");
const custom_system_prompt_1 = require("../prompts/sections/custom-system-prompt");
const webviewMessageHandler_1 = require("./webviewMessageHandler");
const getNonce_1 = require("./getNonce");
const getUri_1 = require("./getUri");
const requesty_1 = require("../../shared/utils/requesty");
class ClineProvider extends events_1.default {
    context;
    outputChannel;
    renderContext;
    contextProxy;
    // Used in package.json as the view's id. This value cannot be changed due
    // to how VSCode caches views based on their id, and updating the id would
    // break existing instances of the extension.
    static sideBarId = `${package_1.Package.name}.SidebarProvider`;
    static tabPanelId = `${package_1.Package.name}.TabPanelProvider`;
    static activeInstances = new Set();
    disposables = [];
    webviewDisposables = [];
    view;
    clineStack = [];
    codeIndexStatusSubscription;
    codeIndexManager;
    _workspaceTracker; // workSpaceTracker read-only for access outside this class
    mcpHub; // Change from private to protected
    marketplaceManager;
    mdmService;
    taskCreationCallback;
    taskEventListeners = new WeakMap();
    currentWorkspacePath;
    recentTasksCache;
    pendingOperations = new Map();
    static PENDING_OPERATION_TIMEOUT_MS = 30000; // 30 seconds
    cloudOrganizationsCache = null;
    cloudOrganizationsCacheTimestamp = null;
    static CLOUD_ORGANIZATIONS_CACHE_DURATION_MS = 5 * 1000; // 5 seconds
    isViewLaunched = false;
    settingsImportedAt;
    latestAnnouncementId = "nov-2025-v3.30.0-pr-fixer"; // v3.30.0 PR Fixer announcement
    providerSettingsManager;
    customModesManager;
    constructor(context, outputChannel, renderContext = "sidebar", contextProxy, mdmService) {
        super();
        this.context = context;
        this.outputChannel = outputChannel;
        this.renderContext = renderContext;
        this.contextProxy = contextProxy;
        this.currentWorkspacePath = (0, path_1.getWorkspacePath)();
        ClineProvider.activeInstances.add(this);
        this.mdmService = mdmService;
        this.updateGlobalState("codebaseIndexModels", embeddingModels_1.EMBEDDING_MODEL_PROFILES);
        // Start configuration loading (which might trigger indexing) in the background.
        // Don't await, allowing activation to continue immediately.
        // Register this provider with the telemetry service to enable it to add
        // properties like mode and provider.
        telemetry_1.TelemetryService.instance.setProvider(this);
        this._workspaceTracker = new WorkspaceTracker_1.default(this);
        this.providerSettingsManager = new ProviderSettingsManager_1.ProviderSettingsManager(this.context);
        this.customModesManager = new CustomModesManager_1.CustomModesManager(this.context, async () => {
            await this.postStateToWebview();
        });
        // Initialize MCP Hub through the singleton manager
        McpServerManager_1.McpServerManager.getInstance(this.context, this)
            .then((hub) => {
            this.mcpHub = hub;
            this.mcpHub.registerClient();
        })
            .catch((error) => {
            this.log(`Failed to initialize MCP Hub: ${error}`);
        });
        this.marketplaceManager = new marketplace_1.MarketplaceManager(this.context, this.customModesManager);
        // Forward <most> task events to the provider.
        // We do something fairly similar for the IPC-based API.
        this.taskCreationCallback = (instance) => {
            this.emit(types_1.RooCodeEventName.TaskCreated, instance);
            // Create named listener functions so we can remove them later.
            const onTaskStarted = () => this.emit(types_1.RooCodeEventName.TaskStarted, instance.taskId);
            const onTaskCompleted = (taskId, tokenUsage, toolUsage) => this.emit(types_1.RooCodeEventName.TaskCompleted, taskId, tokenUsage, toolUsage);
            const onTaskAborted = async () => {
                this.emit(types_1.RooCodeEventName.TaskAborted, instance.taskId);
                try {
                    // Only rehydrate on genuine streaming failures.
                    // User-initiated cancels are handled by cancelTask().
                    if (instance.abortReason === "streaming_failed") {
                        // Defensive safeguard: if another path already replaced this instance, skip
                        const current = this.getCurrentTask();
                        if (current && current.instanceId !== instance.instanceId) {
                            this.log(`[onTaskAborted] Skipping rehydrate: current instance ${current.instanceId} != aborted ${instance.instanceId}`);
                            return;
                        }
                        const { historyItem } = await this.getTaskWithId(instance.taskId);
                        const rootTask = instance.rootTask;
                        const parentTask = instance.parentTask;
                        await this.createTaskWithHistoryItem({ ...historyItem, rootTask, parentTask });
                    }
                }
                catch (error) {
                    this.log(`[onTaskAborted] Failed to rehydrate after streaming failure: ${error instanceof Error ? error.message : String(error)}`);
                }
            };
            const onTaskFocused = () => this.emit(types_1.RooCodeEventName.TaskFocused, instance.taskId);
            const onTaskUnfocused = () => this.emit(types_1.RooCodeEventName.TaskUnfocused, instance.taskId);
            const onTaskActive = (taskId) => this.emit(types_1.RooCodeEventName.TaskActive, taskId);
            const onTaskInteractive = (taskId) => this.emit(types_1.RooCodeEventName.TaskInteractive, taskId);
            const onTaskResumable = (taskId) => this.emit(types_1.RooCodeEventName.TaskResumable, taskId);
            const onTaskIdle = (taskId) => this.emit(types_1.RooCodeEventName.TaskIdle, taskId);
            const onTaskPaused = (taskId) => this.emit(types_1.RooCodeEventName.TaskPaused, taskId);
            const onTaskUnpaused = (taskId) => this.emit(types_1.RooCodeEventName.TaskUnpaused, taskId);
            const onTaskSpawned = (taskId) => this.emit(types_1.RooCodeEventName.TaskSpawned, taskId);
            const onTaskUserMessage = (taskId) => this.emit(types_1.RooCodeEventName.TaskUserMessage, taskId);
            const onTaskTokenUsageUpdated = (taskId, tokenUsage) => this.emit(types_1.RooCodeEventName.TaskTokenUsageUpdated, taskId, tokenUsage);
            // Attach the listeners.
            instance.on(types_1.RooCodeEventName.TaskStarted, onTaskStarted);
            instance.on(types_1.RooCodeEventName.TaskCompleted, onTaskCompleted);
            instance.on(types_1.RooCodeEventName.TaskAborted, onTaskAborted);
            instance.on(types_1.RooCodeEventName.TaskFocused, onTaskFocused);
            instance.on(types_1.RooCodeEventName.TaskUnfocused, onTaskUnfocused);
            instance.on(types_1.RooCodeEventName.TaskActive, onTaskActive);
            instance.on(types_1.RooCodeEventName.TaskInteractive, onTaskInteractive);
            instance.on(types_1.RooCodeEventName.TaskResumable, onTaskResumable);
            instance.on(types_1.RooCodeEventName.TaskIdle, onTaskIdle);
            instance.on(types_1.RooCodeEventName.TaskPaused, onTaskPaused);
            instance.on(types_1.RooCodeEventName.TaskUnpaused, onTaskUnpaused);
            instance.on(types_1.RooCodeEventName.TaskSpawned, onTaskSpawned);
            instance.on(types_1.RooCodeEventName.TaskUserMessage, onTaskUserMessage);
            instance.on(types_1.RooCodeEventName.TaskTokenUsageUpdated, onTaskTokenUsageUpdated);
            // Store the cleanup functions for later removal.
            this.taskEventListeners.set(instance, [
                () => instance.off(types_1.RooCodeEventName.TaskStarted, onTaskStarted),
                () => instance.off(types_1.RooCodeEventName.TaskCompleted, onTaskCompleted),
                () => instance.off(types_1.RooCodeEventName.TaskAborted, onTaskAborted),
                () => instance.off(types_1.RooCodeEventName.TaskFocused, onTaskFocused),
                () => instance.off(types_1.RooCodeEventName.TaskUnfocused, onTaskUnfocused),
                () => instance.off(types_1.RooCodeEventName.TaskActive, onTaskActive),
                () => instance.off(types_1.RooCodeEventName.TaskInteractive, onTaskInteractive),
                () => instance.off(types_1.RooCodeEventName.TaskResumable, onTaskResumable),
                () => instance.off(types_1.RooCodeEventName.TaskIdle, onTaskIdle),
                () => instance.off(types_1.RooCodeEventName.TaskUserMessage, onTaskUserMessage),
                () => instance.off(types_1.RooCodeEventName.TaskPaused, onTaskPaused),
                () => instance.off(types_1.RooCodeEventName.TaskUnpaused, onTaskUnpaused),
                () => instance.off(types_1.RooCodeEventName.TaskSpawned, onTaskSpawned),
                () => instance.off(types_1.RooCodeEventName.TaskTokenUsageUpdated, onTaskTokenUsageUpdated),
            ]);
        };
        // Initialize Roo Code Cloud profile sync.
        if (cloud_1.CloudService.hasInstance()) {
            this.initializeCloudProfileSync().catch((error) => {
                this.log(`Failed to initialize cloud profile sync: ${error}`);
            });
        }
        else {
            this.log("CloudService not ready, deferring cloud profile sync");
        }
    }
    /**
     * Override EventEmitter's on method to match TaskProviderLike interface
     */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Override EventEmitter's off method to match TaskProviderLike interface
     */
    off(event, listener) {
        return super.off(event, listener);
    }
    /**
     * Initialize cloud profile synchronization
     */
    async initializeCloudProfileSync() {
        try {
            // Check if authenticated and sync profiles
            if (cloud_1.CloudService.hasInstance() && cloud_1.CloudService.instance.isAuthenticated()) {
                await this.syncCloudProfiles();
            }
            // Set up listener for future updates
            if (cloud_1.CloudService.hasInstance()) {
                cloud_1.CloudService.instance.on("settings-updated", this.handleCloudSettingsUpdate);
            }
        }
        catch (error) {
            this.log(`Error in initializeCloudProfileSync: ${error}`);
        }
    }
    /**
     * Handle cloud settings updates
     */
    handleCloudSettingsUpdate = async () => {
        try {
            await this.syncCloudProfiles();
        }
        catch (error) {
            this.log(`Error handling cloud settings update: ${error}`);
        }
    };
    /**
     * Synchronize cloud profiles with local profiles.
     */
    async syncCloudProfiles() {
        try {
            const settings = cloud_1.CloudService.instance.getOrganizationSettings();
            if (!settings?.providerProfiles) {
                return;
            }
            const currentApiConfigName = this.getGlobalState("currentApiConfigName");
            const result = await this.providerSettingsManager.syncCloudProfiles(settings.providerProfiles, currentApiConfigName);
            if (result.hasChanges) {
                // Update list.
                await this.updateGlobalState("listApiConfigMeta", await this.providerSettingsManager.listConfig());
                if (result.activeProfileChanged && result.activeProfileId) {
                    // Reload full settings for new active profile.
                    const profile = await this.providerSettingsManager.getProfile({
                        id: result.activeProfileId,
                    });
                    await this.activateProviderProfile({ name: profile.name });
                }
                await this.postStateToWebview();
            }
        }
        catch (error) {
            this.log(`Error syncing cloud profiles: ${error}`);
        }
    }
    /**
     * Initialize cloud profile synchronization when CloudService is ready
     * This method is called externally after CloudService has been initialized
     */
    async initializeCloudProfileSyncWhenReady() {
        try {
            if (cloud_1.CloudService.hasInstance() && cloud_1.CloudService.instance.isAuthenticated()) {
                await this.syncCloudProfiles();
            }
            if (cloud_1.CloudService.hasInstance()) {
                cloud_1.CloudService.instance.off("settings-updated", this.handleCloudSettingsUpdate);
                cloud_1.CloudService.instance.on("settings-updated", this.handleCloudSettingsUpdate);
            }
        }
        catch (error) {
            this.log(`Failed to initialize cloud profile sync when ready: ${error}`);
        }
    }
    // Adds a new Task instance to clineStack, marking the start of a new task.
    // The instance is pushed to the top of the stack (LIFO order).
    // When the task is completed, the top instance is removed, reactivating the
    // previous task.
    async addClineToStack(task) {
        // Add this cline instance into the stack that represents the order of
        // all the called tasks.
        this.clineStack.push(task);
        task.emit(types_1.RooCodeEventName.TaskFocused);
        // Perform special setup provider specific tasks.
        await this.performPreparationTasks(task);
        // Ensure getState() resolves correctly.
        const state = await this.getState();
        if (!state || typeof state.mode !== "string") {
            throw new Error((0, i18n_1.t)("common:errors.retrieve_current_mode"));
        }
    }
    async performPreparationTasks(cline) {
        // LMStudio: We need to force model loading in order to read its context
        // size; we do it now since we're starting a task with that model selected.
        if (cline.apiConfiguration && cline.apiConfiguration.apiProvider === "lmstudio") {
            try {
                if (!(0, lmstudio_1.hasLoadedFullDetails)(cline.apiConfiguration.lmStudioModelId)) {
                    await (0, lmstudio_1.forceFullModelDetailsLoad)(cline.apiConfiguration.lmStudioBaseUrl ?? "http://localhost:1234", cline.apiConfiguration.lmStudioModelId);
                }
            }
            catch (error) {
                this.log(`Failed to load full model details for LM Studio: ${error}`);
                vscode.window.showErrorMessage(error.message);
            }
        }
    }
    // Removes and destroys the top Cline instance (the current finished task),
    // activating the previous one (resuming the parent task).
    async removeClineFromStack() {
        if (this.clineStack.length === 0) {
            return;
        }
        // Pop the top Cline instance from the stack.
        let task = this.clineStack.pop();
        if (task) {
            task.emit(types_1.RooCodeEventName.TaskUnfocused);
            try {
                // Abort the running task and set isAbandoned to true so
                // all running promises will exit as well.
                await task.abortTask(true);
            }
            catch (e) {
                this.log(`[ClineProvider#removeClineFromStack] abortTask() failed ${task.taskId}.${task.instanceId}: ${e.message}`);
            }
            // Remove event listeners before clearing the reference.
            const cleanupFunctions = this.taskEventListeners.get(task);
            if (cleanupFunctions) {
                cleanupFunctions.forEach((cleanup) => cleanup());
                this.taskEventListeners.delete(task);
            }
            // Make sure no reference kept, once promises end it will be
            // garbage collected.
            task = undefined;
        }
    }
    getTaskStackSize() {
        return this.clineStack.length;
    }
    getCurrentTaskStack() {
        return this.clineStack.map((cline) => cline.taskId);
    }
    // Remove the current task/cline instance (at the top of the stack), so this
    // task is finished and resume the previous task/cline instance (if it
    // exists).
    // This is used when a subtask is finished and the parent task needs to be
    // resumed.
    async finishSubTask(lastMessage) {
        // Remove the last cline instance from the stack (this is the finished
        // subtask).
        await this.removeClineFromStack();
        // Resume the last cline instance in the stack (if it exists - this is
        // the 'parent' calling task).
        await this.getCurrentTask()?.completeSubtask(lastMessage);
    }
    // Pending Edit Operations Management
    /**
     * Sets a pending edit operation with automatic timeout cleanup
     */
    setPendingEditOperation(operationId, editData) {
        // Clear any existing operation with the same ID
        this.clearPendingEditOperation(operationId);
        // Create timeout for automatic cleanup
        const timeoutId = setTimeout(() => {
            this.clearPendingEditOperation(operationId);
            this.log(`[setPendingEditOperation] Automatically cleared stale pending operation: ${operationId}`);
        }, ClineProvider.PENDING_OPERATION_TIMEOUT_MS);
        // Store the operation
        this.pendingOperations.set(operationId, {
            ...editData,
            timeoutId,
            createdAt: Date.now(),
        });
        this.log(`[setPendingEditOperation] Set pending operation: ${operationId}`);
    }
    /**
     * Gets a pending edit operation by ID
     */
    getPendingEditOperation(operationId) {
        return this.pendingOperations.get(operationId);
    }
    /**
     * Clears a specific pending edit operation
     */
    clearPendingEditOperation(operationId) {
        const operation = this.pendingOperations.get(operationId);
        if (operation) {
            clearTimeout(operation.timeoutId);
            this.pendingOperations.delete(operationId);
            this.log(`[clearPendingEditOperation] Cleared pending operation: ${operationId}`);
            return true;
        }
        return false;
    }
    /**
     * Clears all pending edit operations
     */
    clearAllPendingEditOperations() {
        for (const [operationId, operation] of this.pendingOperations) {
            clearTimeout(operation.timeoutId);
        }
        this.pendingOperations.clear();
        this.log(`[clearAllPendingEditOperations] Cleared all pending operations`);
    }
    /*
    VSCode extensions use the disposable pattern to clean up resources when the sidebar/editor tab is closed by the user or system. This applies to event listening, commands, interacting with the UI, etc.
    - https://vscode-docs.readthedocs.io/en/stable/extensions/patterns-and-principles/
    - https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
    */
    clearWebviewResources() {
        while (this.webviewDisposables.length) {
            const x = this.webviewDisposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    async dispose() {
        this.log("Disposing ClineProvider...");
        // Clear all tasks from the stack.
        while (this.clineStack.length > 0) {
            await this.removeClineFromStack();
        }
        this.log("Cleared all tasks");
        // Clear all pending edit operations to prevent memory leaks
        this.clearAllPendingEditOperations();
        this.log("Cleared pending operations");
        if (this.view && "dispose" in this.view) {
            this.view.dispose();
            this.log("Disposed webview");
        }
        this.clearWebviewResources();
        // Clean up cloud service event listener
        if (cloud_1.CloudService.hasInstance()) {
            cloud_1.CloudService.instance.off("settings-updated", this.handleCloudSettingsUpdate);
        }
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        this._workspaceTracker?.dispose();
        this._workspaceTracker = undefined;
        await this.mcpHub?.unregisterClient();
        this.mcpHub = undefined;
        this.marketplaceManager?.cleanup();
        this.customModesManager?.dispose();
        this.log("Disposed all disposables");
        ClineProvider.activeInstances.delete(this);
        // Clean up any event listeners attached to this provider
        this.removeAllListeners();
        McpServerManager_1.McpServerManager.unregisterProvider(this);
    }
    static getVisibleInstance() {
        return (0, array_1.findLast)(Array.from(this.activeInstances), (instance) => instance.view?.visible === true);
    }
    static async getInstance() {
        let visibleProvider = ClineProvider.getVisibleInstance();
        // If no visible provider, try to show the sidebar view
        if (!visibleProvider) {
            await vscode.commands.executeCommand(`${package_1.Package.name}.SidebarProvider.focus`);
            // Wait briefly for the view to become visible
            await (0, delay_1.default)(100);
            visibleProvider = ClineProvider.getVisibleInstance();
        }
        // If still no visible provider, return
        if (!visibleProvider) {
            return;
        }
        return visibleProvider;
    }
    static async isActiveTask() {
        const visibleProvider = await ClineProvider.getInstance();
        if (!visibleProvider) {
            return false;
        }
        // Check if there is a cline instance in the stack (if this provider has an active task)
        if (visibleProvider.getCurrentTask()) {
            return true;
        }
        return false;
    }
    static async handleCodeAction(command, promptType, params) {
        // Capture telemetry for code action usage
        telemetry_1.TelemetryService.instance.captureCodeActionUsed(promptType);
        const visibleProvider = await ClineProvider.getInstance();
        if (!visibleProvider) {
            return;
        }
        const { customSupportPrompts } = await visibleProvider.getState();
        // TODO: Improve type safety for promptType.
        const prompt = support_prompt_1.supportPrompt.create(promptType, params, customSupportPrompts);
        if (command === "addToContext") {
            await visibleProvider.postMessageToWebview({
                type: "invoke",
                invoke: "setChatBoxMessage",
                text: `${prompt}\n\n`,
            });
            await visibleProvider.postMessageToWebview({ type: "action", action: "focusInput" });
            return;
        }
        await visibleProvider.createTask(prompt);
    }
    static async handleTerminalAction(command, promptType, params) {
        telemetry_1.TelemetryService.instance.captureCodeActionUsed(promptType);
        const visibleProvider = await ClineProvider.getInstance();
        if (!visibleProvider) {
            return;
        }
        const { customSupportPrompts } = await visibleProvider.getState();
        const prompt = support_prompt_1.supportPrompt.create(promptType, params, customSupportPrompts);
        if (command === "terminalAddToContext") {
            await visibleProvider.postMessageToWebview({
                type: "invoke",
                invoke: "setChatBoxMessage",
                text: `${prompt}\n\n`,
            });
            await visibleProvider.postMessageToWebview({ type: "action", action: "focusInput" });
            return;
        }
        try {
            await visibleProvider.createTask(prompt);
        }
        catch (error) {
            if (error instanceof errors_1.OrganizationAllowListViolationError) {
                // Errors from terminal commands seem to get swallowed / ignored.
                vscode.window.showErrorMessage(error.message);
            }
            throw error;
        }
    }
    async resolveWebviewView(webviewView) {
        this.view = webviewView;
        const inTabMode = "onDidChangeViewState" in webviewView;
        if (inTabMode) {
            (0, registerCommands_1.setPanel)(webviewView, "tab");
        }
        else if ("onDidChangeVisibility" in webviewView) {
            (0, registerCommands_1.setPanel)(webviewView, "sidebar");
        }
        // Initialize out-of-scope variables that need to receive persistent
        // global state values.
        this.getState().then(({ terminalShellIntegrationTimeout = Terminal_1.Terminal.defaultShellIntegrationTimeout, terminalShellIntegrationDisabled = false, terminalCommandDelay = 0, terminalZshClearEolMark = true, terminalZshOhMy = false, terminalZshP10k = false, terminalPowershellCounter = false, terminalZdotdir = false, }) => {
            Terminal_1.Terminal.setShellIntegrationTimeout(terminalShellIntegrationTimeout);
            Terminal_1.Terminal.setShellIntegrationDisabled(terminalShellIntegrationDisabled);
            Terminal_1.Terminal.setCommandDelay(terminalCommandDelay);
            Terminal_1.Terminal.setTerminalZshClearEolMark(terminalZshClearEolMark);
            Terminal_1.Terminal.setTerminalZshOhMy(terminalZshOhMy);
            Terminal_1.Terminal.setTerminalZshP10k(terminalZshP10k);
            Terminal_1.Terminal.setPowershellCounter(terminalPowershellCounter);
            Terminal_1.Terminal.setTerminalZdotdir(terminalZdotdir);
        });
        this.getState().then(({ ttsEnabled }) => {
            (0, tts_1.setTtsEnabled)(ttsEnabled ?? false);
        });
        this.getState().then(({ ttsSpeed }) => {
            (0, tts_1.setTtsSpeed)(ttsSpeed ?? 1);
        });
        // Set up webview options with proper resource roots
        const resourceRoots = [this.contextProxy.extensionUri];
        // Add workspace folders to allow access to workspace files
        if (vscode.workspace.workspaceFolders) {
            resourceRoots.push(...vscode.workspace.workspaceFolders.map((folder) => folder.uri));
        }
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: resourceRoots,
        };
        webviewView.webview.html =
            this.contextProxy.extensionMode === vscode.ExtensionMode.Development
                ? await this.getHMRHtmlContent(webviewView.webview)
                : await this.getHtmlContent(webviewView.webview);
        // Sets up an event listener to listen for messages passed from the webview view context
        // and executes code based on the message that is received.
        this.setWebviewMessageListener(webviewView.webview);
        // Initialize code index status subscription for the current workspace.
        this.updateCodeIndexStatusSubscription();
        // Listen for active editor changes to update code index status for the
        // current workspace.
        const activeEditorSubscription = vscode.window.onDidChangeActiveTextEditor(() => {
            // Update subscription when workspace might have changed.
            this.updateCodeIndexStatusSubscription();
        });
        this.webviewDisposables.push(activeEditorSubscription);
        // Listen for when the panel becomes visible.
        // https://github.com/microsoft/vscode-discussions/discussions/840
        if ("onDidChangeViewState" in webviewView) {
            // WebviewView and WebviewPanel have all the same properties except
            // for this visibility listener panel.
            const viewStateDisposable = webviewView.onDidChangeViewState(() => {
                if (this.view?.visible) {
                    this.postMessageToWebview({ type: "action", action: "didBecomeVisible" });
                }
            });
            this.webviewDisposables.push(viewStateDisposable);
        }
        else if ("onDidChangeVisibility" in webviewView) {
            // sidebar
            const visibilityDisposable = webviewView.onDidChangeVisibility(() => {
                if (this.view?.visible) {
                    this.postMessageToWebview({ type: "action", action: "didBecomeVisible" });
                }
            });
            this.webviewDisposables.push(visibilityDisposable);
        }
        // Listen for when the view is disposed
        // This happens when the user closes the view or when the view is closed programmatically
        webviewView.onDidDispose(async () => {
            if (inTabMode) {
                this.log("Disposing ClineProvider instance for tab view");
                await this.dispose();
            }
            else {
                this.log("Clearing webview resources for sidebar view");
                this.clearWebviewResources();
                // Reset current workspace manager reference when view is disposed
                this.codeIndexManager = undefined;
            }
        }, null, this.disposables);
        // Listen for when color changes
        const configDisposable = vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e && e.affectsConfiguration("workbench.colorTheme")) {
                // Sends latest theme name to webview
                await this.postMessageToWebview({ type: "theme", text: JSON.stringify(await (0, getTheme_1.getTheme)()) });
            }
        });
        this.webviewDisposables.push(configDisposable);
        // If the extension is starting a new session, clear previous task state.
        await this.removeClineFromStack();
    }
    async createTaskWithHistoryItem(historyItem) {
        // Check if we're rehydrating the current task to avoid flicker
        const currentTask = this.getCurrentTask();
        const isRehydratingCurrentTask = currentTask && currentTask.taskId === historyItem.id;
        if (!isRehydratingCurrentTask) {
            await this.removeClineFromStack();
        }
        // If the history item has a saved mode, restore it and its associated API configuration.
        if (historyItem.mode) {
            // Validate that the mode still exists
            const customModes = await this.customModesManager.getCustomModes();
            const modeExists = (0, modes_1.getModeBySlug)(historyItem.mode, customModes) !== undefined;
            if (!modeExists) {
                // Mode no longer exists, fall back to default mode.
                this.log(`Mode '${historyItem.mode}' from history no longer exists. Falling back to default mode '${modes_1.defaultModeSlug}'.`);
                historyItem.mode = modes_1.defaultModeSlug;
            }
            await this.updateGlobalState("mode", historyItem.mode);
            // Load the saved API config for the restored mode if it exists.
            const savedConfigId = await this.providerSettingsManager.getModeConfigId(historyItem.mode);
            const listApiConfig = await this.providerSettingsManager.listConfig();
            // Update listApiConfigMeta first to ensure UI has latest data.
            await this.updateGlobalState("listApiConfigMeta", listApiConfig);
            // If this mode has a saved config, use it.
            if (savedConfigId) {
                const profile = listApiConfig.find(({ id }) => id === savedConfigId);
                if (profile?.name) {
                    try {
                        await this.activateProviderProfile({ name: profile.name });
                    }
                    catch (error) {
                        // Log the error but continue with task restoration.
                        this.log(`Failed to restore API configuration for mode '${historyItem.mode}': ${error instanceof Error ? error.message : String(error)}. Continuing with default configuration.`);
                        // The task will continue with the current/default configuration.
                    }
                }
            }
        }
        const { apiConfiguration, diffEnabled: enableDiff, enableCheckpoints, checkpointTimeout, fuzzyMatchThreshold, experiments, cloudUserInfo, taskSyncEnabled, } = await this.getState();
        const task = new Task_1.Task({
            provider: this,
            apiConfiguration,
            enableDiff,
            enableCheckpoints,
            checkpointTimeout,
            fuzzyMatchThreshold,
            consecutiveMistakeLimit: apiConfiguration.consecutiveMistakeLimit,
            historyItem,
            experiments,
            rootTask: historyItem.rootTask,
            parentTask: historyItem.parentTask,
            taskNumber: historyItem.number,
            workspacePath: historyItem.workspace,
            onCreated: this.taskCreationCallback,
            enableBridge: cloud_1.BridgeOrchestrator.isEnabled(cloudUserInfo, taskSyncEnabled),
        });
        if (isRehydratingCurrentTask) {
            // Replace the current task in-place to avoid UI flicker
            const stackIndex = this.clineStack.length - 1;
            // Properly dispose of the old task to ensure garbage collection
            const oldTask = this.clineStack[stackIndex];
            // Abort the old task to stop running processes and mark as abandoned
            try {
                await oldTask.abortTask(true);
            }
            catch (e) {
                this.log(`[createTaskWithHistoryItem] abortTask() failed for old task ${oldTask.taskId}.${oldTask.instanceId}: ${e.message}`);
            }
            // Remove event listeners from the old task
            const cleanupFunctions = this.taskEventListeners.get(oldTask);
            if (cleanupFunctions) {
                cleanupFunctions.forEach((cleanup) => cleanup());
                this.taskEventListeners.delete(oldTask);
            }
            // Replace the task in the stack
            this.clineStack[stackIndex] = task;
            task.emit(types_1.RooCodeEventName.TaskFocused);
            // Perform preparation tasks and set up event listeners
            await this.performPreparationTasks(task);
            this.log(`[createTaskWithHistoryItem] rehydrated task ${task.taskId}.${task.instanceId} in-place (flicker-free)`);
        }
        else {
            await this.addClineToStack(task);
            this.log(`[createTaskWithHistoryItem] ${task.parentTask ? "child" : "parent"} task ${task.taskId}.${task.instanceId} instantiated`);
        }
        // Check if there's a pending edit after checkpoint restoration
        const operationId = `task-${task.taskId}`;
        const pendingEdit = this.getPendingEditOperation(operationId);
        if (pendingEdit) {
            this.clearPendingEditOperation(operationId); // Clear the pending edit
            this.log(`[createTaskWithHistoryItem] Processing pending edit after checkpoint restoration`);
            // Process the pending edit after a short delay to ensure the task is fully initialized
            setTimeout(async () => {
                try {
                    // Find the message index in the restored state
                    const { messageIndex, apiConversationHistoryIndex } = (() => {
                        const messageIndex = task.clineMessages.findIndex((msg) => msg.ts === pendingEdit.messageTs);
                        const apiConversationHistoryIndex = task.apiConversationHistory.findIndex((msg) => msg.ts === pendingEdit.messageTs);
                        return { messageIndex, apiConversationHistoryIndex };
                    })();
                    if (messageIndex !== -1) {
                        // Remove the target message and all subsequent messages
                        await task.overwriteClineMessages(task.clineMessages.slice(0, messageIndex));
                        if (apiConversationHistoryIndex !== -1) {
                            await task.overwriteApiConversationHistory(task.apiConversationHistory.slice(0, apiConversationHistoryIndex));
                        }
                        // Process the edited message
                        await task.handleWebviewAskResponse("messageResponse", pendingEdit.editedContent, pendingEdit.images);
                    }
                }
                catch (error) {
                    this.log(`[createTaskWithHistoryItem] Error processing pending edit: ${error}`);
                }
            }, 100); // Small delay to ensure task is fully ready
        }
        return task;
    }
    async postMessageToWebview(message) {
        await this.view?.webview.postMessage(message);
    }
    async getHMRHtmlContent(webview) {
        let localPort = "5173";
        try {
            const fs = require("fs");
            const path = require("path");
            const portFilePath = path.resolve(__dirname, "../../.vite-port");
            if (fs.existsSync(portFilePath)) {
                localPort = fs.readFileSync(portFilePath, "utf8").trim();
                console.log(`[ClineProvider:Vite] Using Vite server port from ${portFilePath}: ${localPort}`);
            }
            else {
                console.log(`[ClineProvider:Vite] Port file not found at ${portFilePath}, using default port: ${localPort}`);
            }
        }
        catch (err) {
            console.error("[ClineProvider:Vite] Failed to read Vite port file:", err);
        }
        const localServerUrl = `localhost:${localPort}`;
        // Check if local dev server is running.
        try {
            await axios_1.default.get(`http://${localServerUrl}`);
        }
        catch (error) {
            vscode.window.showErrorMessage((0, i18n_1.t)("common:errors.hmr_not_running"));
            return this.getHtmlContent(webview);
        }
        const nonce = (0, getNonce_1.getNonce)();
        // Get the OpenRouter base URL from configuration
        const { apiConfiguration } = await this.getState();
        const openRouterBaseUrl = apiConfiguration.openRouterBaseUrl || "https://openrouter.ai";
        // Extract the domain for CSP
        const openRouterDomain = openRouterBaseUrl.match(/^(https?:\/\/[^\/]+)/)?.[1] || "https://openrouter.ai";
        const stylesUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.css",
        ]);
        const codiconsUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["assets", "codicons", "codicon.css"]);
        const materialIconsUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, [
            "assets",
            "vscode-material-icons",
            "icons",
        ]);
        const imagesUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["assets", "images"]);
        const audioUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["webview-ui", "audio"]);
        const file = "src/index.tsx";
        const scriptUri = `http://${localServerUrl}/${file}`;
        const reactRefresh = /*html*/ `
			<script nonce="${nonce}" type="module">
				import RefreshRuntime from "http://localhost:${localPort}/@react-refresh"
				RefreshRuntime.injectIntoGlobalHook(window)
				window.$RefreshReg$ = () => {}
				window.$RefreshSig$ = () => (type) => type
				window.__vite_plugin_react_preamble_installed__ = true
			</script>
		`;
        const csp = [
            "default-src 'none'",
            `font-src ${webview.cspSource} data:`,
            `style-src ${webview.cspSource} 'unsafe-inline' https://* http://${localServerUrl} http://0.0.0.0:${localPort}`,
            `img-src ${webview.cspSource} https://storage.googleapis.com https://img.clerk.com data:`,
            `media-src ${webview.cspSource}`,
            `script-src 'unsafe-eval' ${webview.cspSource} https://* https://*.posthog.com http://${localServerUrl} http://0.0.0.0:${localPort} 'nonce-${nonce}'`,
            `connect-src ${webview.cspSource} ${openRouterDomain} https://* https://*.posthog.com ws://${localServerUrl} ws://0.0.0.0:${localPort} http://${localServerUrl} http://0.0.0.0:${localPort}`,
        ];
        return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
					<meta http-equiv="Content-Security-Policy" content="${csp.join("; ")}">
					<link rel="stylesheet" type="text/css" href="${stylesUri}">
					<link href="${codiconsUri}" rel="stylesheet" />
					<script nonce="${nonce}">
						window.IMAGES_BASE_URI = "${imagesUri}"
						window.AUDIO_BASE_URI = "${audioUri}"
						window.MATERIAL_ICONS_BASE_URI = "${materialIconsUri}"
					</script>
					<title>Roo Code</title>
				</head>
				<body>
					<div id="root"></div>
					${reactRefresh}
					<script type="module" src="${scriptUri}"></script>
				</body>
			</html>
		`;
    }
    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the React webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    async getHtmlContent(webview) {
        // Get the local path to main script run in the webview,
        // then convert it to a uri we can use in the webview.
        // The CSS file from the React build output
        const stylesUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.css",
        ]);
        const scriptUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const codiconsUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["assets", "codicons", "codicon.css"]);
        const materialIconsUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, [
            "assets",
            "vscode-material-icons",
            "icons",
        ]);
        const imagesUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["assets", "images"]);
        const audioUri = (0, getUri_1.getUri)(webview, this.contextProxy.extensionUri, ["webview-ui", "audio"]);
        // Use a nonce to only allow a specific script to be run.
        /*
        content security policy of your webview to only allow scripts that have a specific nonce
        create a content security policy meta tag so that only loading scripts with a nonce is allowed
        As your extension grows you will likely want to add custom styles, fonts, and/or images to your webview. If you do, you will need to update the content security policy meta tag to explicitly allow for these resources. E.g.
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        - 'unsafe-inline' is required for styles due to vscode-webview-toolkit's dynamic style injection
        - since we pass base64 images to the webview, we need to specify img-src ${webview.cspSource} data:;

        in meta tag we add nonce attribute: A cryptographic nonce (only used once) to allow scripts. The server must generate a unique nonce value each time it transmits a policy. It is critical to provide a nonce that cannot be guessed as bypassing a resource's policy is otherwise trivial.
        */
        const nonce = (0, getNonce_1.getNonce)();
        // Get the OpenRouter base URL from configuration
        const { apiConfiguration } = await this.getState();
        const openRouterBaseUrl = apiConfiguration.openRouterBaseUrl || "https://openrouter.ai";
        // Extract the domain for CSP
        const openRouterDomain = openRouterBaseUrl.match(/^(https?:\/\/[^\/]+)/)?.[1] || "https://openrouter.ai";
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
            <meta name="theme-color" content="#000000">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https://storage.googleapis.com https://img.clerk.com data:; media-src ${webview.cspSource}; script-src ${webview.cspSource} 'wasm-unsafe-eval' 'nonce-${nonce}' https://us-assets.i.posthog.com 'strict-dynamic'; connect-src ${webview.cspSource} ${openRouterDomain} https://api.requesty.ai https://us.i.posthog.com https://us-assets.i.posthog.com;">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
			<link href="${codiconsUri}" rel="stylesheet" />
			<script nonce="${nonce}">
				window.IMAGES_BASE_URI = "${imagesUri}"
				window.AUDIO_BASE_URI = "${audioUri}"
				window.MATERIAL_ICONS_BASE_URI = "${materialIconsUri}"
			</script>
            <title>Roo Code</title>
          </head>
          <body>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <div id="root"></div>
            <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
          </body>
        </html>
      `;
    }
    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is received.
     *
     * @param webview A reference to the extension webview
     */
    setWebviewMessageListener(webview) {
        const onReceiveMessage = async (message) => (0, webviewMessageHandler_1.webviewMessageHandler)(this, message, this.marketplaceManager);
        const messageDisposable = webview.onDidReceiveMessage(onReceiveMessage);
        this.webviewDisposables.push(messageDisposable);
    }
    /**
     * Handle switching to a new mode, including updating the associated API configuration
     * @param newMode The mode to switch to
     */
    async handleModeSwitch(newMode) {
        const task = this.getCurrentTask();
        if (task) {
            telemetry_1.TelemetryService.instance.captureModeSwitch(task.taskId, newMode);
            task.emit(types_1.RooCodeEventName.TaskModeSwitched, task.taskId, newMode);
            try {
                // Update the task history with the new mode first.
                const history = this.getGlobalState("taskHistory") ?? [];
                const taskHistoryItem = history.find((item) => item.id === task.taskId);
                if (taskHistoryItem) {
                    taskHistoryItem.mode = newMode;
                    await this.updateTaskHistory(taskHistoryItem);
                }
                // Only update the task's mode after successful persistence.
                ;
                task._taskMode = newMode;
            }
            catch (error) {
                // If persistence fails, log the error but don't update the in-memory state.
                this.log(`Failed to persist mode switch for task ${task.taskId}: ${error instanceof Error ? error.message : String(error)}`);
                // Optionally, we could emit an event to notify about the failure.
                // This ensures the in-memory state remains consistent with persisted state.
                throw error;
            }
        }
        await this.updateGlobalState("mode", newMode);
        this.emit(types_1.RooCodeEventName.ModeChanged, newMode);
        // Load the saved API config for the new mode if it exists.
        const savedConfigId = await this.providerSettingsManager.getModeConfigId(newMode);
        const listApiConfig = await this.providerSettingsManager.listConfig();
        // Update listApiConfigMeta first to ensure UI has latest data.
        await this.updateGlobalState("listApiConfigMeta", listApiConfig);
        // If this mode has a saved config, use it.
        if (savedConfigId) {
            const profile = listApiConfig.find(({ id }) => id === savedConfigId);
            if (profile?.name) {
                await this.activateProviderProfile({ name: profile.name });
            }
        }
        else {
            // If no saved config for this mode, save current config as default.
            const currentApiConfigName = this.getGlobalState("currentApiConfigName");
            if (currentApiConfigName) {
                const config = listApiConfig.find((c) => c.name === currentApiConfigName);
                if (config?.id) {
                    await this.providerSettingsManager.setModeConfig(newMode, config.id);
                }
            }
        }
        await this.postStateToWebview();
    }
    // Provider Profile Management
    /**
     * Updates the current task's API handler.
     * Rebuilds when:
     * - provider or model changes, OR
     * - explicitly forced (e.g., user-initiated profile switch/save to apply changed settings like headers/baseUrl/tier).
     * Always synchronizes task.apiConfiguration with latest provider settings.
     * @param providerSettings The new provider settings to apply
     * @param options.forceRebuild Force rebuilding the API handler regardless of provider/model equality
     */
    updateTaskApiHandlerIfNeeded(providerSettings, options = {}) {
        const task = this.getCurrentTask();
        if (!task)
            return;
        const { forceRebuild = false } = options;
        // Determine if we need to rebuild using the previous configuration snapshot
        const prevConfig = task.apiConfiguration;
        const prevProvider = prevConfig?.apiProvider;
        const prevModelId = prevConfig ? (0, types_1.getModelId)(prevConfig) : undefined;
        const newProvider = providerSettings.apiProvider;
        const newModelId = (0, types_1.getModelId)(providerSettings);
        if (forceRebuild || prevProvider !== newProvider || prevModelId !== newModelId) {
            task.api = (0, api_1.buildApiHandler)(providerSettings);
        }
        // Always sync the task's apiConfiguration with the latest provider settings.
        // Note: Task.apiConfiguration is declared readonly in types, so we cast to any for runtime update.
        ;
        task.apiConfiguration = providerSettings;
    }
    getProviderProfileEntries() {
        return this.contextProxy.getValues().listApiConfigMeta || [];
    }
    getProviderProfileEntry(name) {
        return this.getProviderProfileEntries().find((profile) => profile.name === name);
    }
    hasProviderProfileEntry(name) {
        return !!this.getProviderProfileEntry(name);
    }
    async upsertProviderProfile(name, providerSettings, activate = true) {
        try {
            // TODO: Do we need to be calling `activateProfile`? It's not
            // clear to me what the source of truth should be; in some cases
            // we rely on the `ContextProxy`'s data store and in other cases
            // we rely on the `ProviderSettingsManager`'s data store. It might
            // be simpler to unify these two.
            const id = await this.providerSettingsManager.saveConfig(name, providerSettings);
            if (activate) {
                const { mode } = await this.getState();
                // These promises do the following:
                // 1. Adds or updates the list of provider profiles.
                // 2. Sets the current provider profile.
                // 3. Sets the current mode's provider profile.
                // 4. Copies the provider settings to the context.
                //
                // Note: 1, 2, and 4 can be done in one `ContextProxy` call:
                // this.contextProxy.setValues({ ...providerSettings, listApiConfigMeta: ..., currentApiConfigName: ... })
                // We should probably switch to that and verify that it works.
                // I left the original implementation in just to be safe.
                await Promise.all([
                    this.updateGlobalState("listApiConfigMeta", await this.providerSettingsManager.listConfig()),
                    this.updateGlobalState("currentApiConfigName", name),
                    this.providerSettingsManager.setModeConfig(mode, id),
                    this.contextProxy.setProviderSettings(providerSettings),
                ]);
                // Change the provider for the current task.
                // TODO: We should rename `buildApiHandler` for clarity (e.g. `getProviderClient`).
                this.updateTaskApiHandlerIfNeeded(providerSettings, { forceRebuild: true });
            }
            else {
                await this.updateGlobalState("listApiConfigMeta", await this.providerSettingsManager.listConfig());
            }
            await this.postStateToWebview();
            return id;
        }
        catch (error) {
            this.log(`Error create new api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
            vscode.window.showErrorMessage((0, i18n_1.t)("common:errors.create_api_config"));
            return undefined;
        }
    }
    async deleteProviderProfile(profileToDelete) {
        const globalSettings = this.contextProxy.getValues();
        let profileToActivate = globalSettings.currentApiConfigName;
        if (profileToDelete.name === profileToActivate) {
            profileToActivate = this.getProviderProfileEntries().find(({ name }) => name !== profileToDelete.name)?.name;
        }
        if (!profileToActivate) {
            throw new Error("You cannot delete the last profile");
        }
        const entries = this.getProviderProfileEntries().filter(({ name }) => name !== profileToDelete.name);
        await this.contextProxy.setValues({
            ...globalSettings,
            currentApiConfigName: profileToActivate,
            listApiConfigMeta: entries,
        });
        await this.postStateToWebview();
    }
    async activateProviderProfile(args) {
        const { name, id, ...providerSettings } = await this.providerSettingsManager.activateProfile(args);
        // See `upsertProviderProfile` for a description of what this is doing.
        await Promise.all([
            this.contextProxy.setValue("listApiConfigMeta", await this.providerSettingsManager.listConfig()),
            this.contextProxy.setValue("currentApiConfigName", name),
            this.contextProxy.setProviderSettings(providerSettings),
        ]);
        const { mode } = await this.getState();
        if (id) {
            await this.providerSettingsManager.setModeConfig(mode, id);
        }
        // Change the provider for the current task.
        this.updateTaskApiHandlerIfNeeded(providerSettings, { forceRebuild: true });
        await this.postStateToWebview();
        if (providerSettings.apiProvider) {
            this.emit(types_1.RooCodeEventName.ProviderProfileChanged, { name, provider: providerSettings.apiProvider });
        }
    }
    async updateCustomInstructions(instructions) {
        // User may be clearing the field.
        await this.updateGlobalState("customInstructions", instructions || undefined);
        await this.postStateToWebview();
    }
    // MCP
    async ensureMcpServersDirectoryExists() {
        // Get platform-specific application data directory
        let mcpServersDir;
        if (process.platform === "win32") {
            // Windows: %APPDATA%\Roo-Code\MCP
            mcpServersDir = path.join(os_1.default.homedir(), "AppData", "Roaming", "Roo-Code", "MCP");
        }
        else if (process.platform === "darwin") {
            // macOS: ~/Documents/Cline/MCP
            mcpServersDir = path.join(os_1.default.homedir(), "Documents", "Cline", "MCP");
        }
        else {
            // Linux: ~/.local/share/Cline/MCP
            mcpServersDir = path.join(os_1.default.homedir(), ".local", "share", "Roo-Code", "MCP");
        }
        try {
            await promises_1.default.mkdir(mcpServersDir, { recursive: true });
        }
        catch (error) {
            // Fallback to a relative path if directory creation fails
            return path.join(os_1.default.homedir(), ".roo-code", "mcp");
        }
        return mcpServersDir;
    }
    async ensureSettingsDirectoryExists() {
        const { getSettingsDirectoryPath } = await import("../../utils/storage");
        const globalStoragePath = this.contextProxy.globalStorageUri.fsPath;
        return getSettingsDirectoryPath(globalStoragePath);
    }
    // OpenRouter
    async handleOpenRouterCallback(code) {
        let { apiConfiguration, currentApiConfigName = "default" } = await this.getState();
        let apiKey;
        try {
            const baseUrl = apiConfiguration.openRouterBaseUrl || "https://openrouter.ai/api/v1";
            // Extract the base domain for the auth endpoint.
            const baseUrlDomain = baseUrl.match(/^(https?:\/\/[^\/]+)/)?.[1] || "https://openrouter.ai";
            const response = await axios_1.default.post(`${baseUrlDomain}/api/v1/auth/keys`, { code });
            if (response.data && response.data.key) {
                apiKey = response.data.key;
            }
            else {
                throw new Error("Invalid response from OpenRouter API");
            }
        }
        catch (error) {
            this.log(`Error exchanging code for API key: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
            throw error;
        }
        const newConfiguration = {
            ...apiConfiguration,
            apiProvider: "openrouter",
            openRouterApiKey: apiKey,
            openRouterModelId: apiConfiguration?.openRouterModelId || types_1.openRouterDefaultModelId,
        };
        await this.upsertProviderProfile(currentApiConfigName, newConfiguration);
    }
    // Glama
    async handleGlamaCallback(code) {
        let apiKey;
        try {
            const response = await axios_1.default.post("https://glama.ai/api/gateway/v1/auth/exchange-code", { code });
            if (response.data && response.data.apiKey) {
                apiKey = response.data.apiKey;
            }
            else {
                throw new Error("Invalid response from Glama API");
            }
        }
        catch (error) {
            this.log(`Error exchanging code for API key: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
            throw error;
        }
        const { apiConfiguration, currentApiConfigName = "default" } = await this.getState();
        const newConfiguration = {
            ...apiConfiguration,
            apiProvider: "glama",
            glamaApiKey: apiKey,
            glamaModelId: apiConfiguration?.glamaModelId || types_1.glamaDefaultModelId,
        };
        await this.upsertProviderProfile(currentApiConfigName, newConfiguration);
    }
    // Requesty
    async handleRequestyCallback(code, baseUrl) {
        let { apiConfiguration } = await this.getState();
        const newConfiguration = {
            ...apiConfiguration,
            apiProvider: "requesty",
            requestyApiKey: code,
            requestyModelId: apiConfiguration?.requestyModelId || types_1.requestyDefaultModelId,
        };
        // set baseUrl as undefined if we don't provide one
        // or if it is the default requesty url
        if (!baseUrl || baseUrl === requesty_1.REQUESTY_BASE_URL) {
            newConfiguration.requestyBaseUrl = undefined;
        }
        else {
            newConfiguration.requestyBaseUrl = baseUrl;
        }
        const profileName = `Requesty (${new Date().toLocaleString()})`;
        await this.upsertProviderProfile(profileName, newConfiguration);
    }
    // Task history
    async getTaskWithId(id) {
        const history = this.getGlobalState("taskHistory") ?? [];
        const historyItem = history.find((item) => item.id === id);
        if (historyItem) {
            const { getTaskDirectoryPath } = await import("../../utils/storage");
            const globalStoragePath = this.contextProxy.globalStorageUri.fsPath;
            const taskDirPath = await getTaskDirectoryPath(globalStoragePath, id);
            const apiConversationHistoryFilePath = path.join(taskDirPath, globalFileNames_1.GlobalFileNames.apiConversationHistory);
            const uiMessagesFilePath = path.join(taskDirPath, globalFileNames_1.GlobalFileNames.uiMessages);
            const fileExists = await (0, fs_1.fileExistsAtPath)(apiConversationHistoryFilePath);
            if (fileExists) {
                const apiConversationHistory = JSON.parse(await promises_1.default.readFile(apiConversationHistoryFilePath, "utf8"));
                return {
                    historyItem,
                    taskDirPath,
                    apiConversationHistoryFilePath,
                    uiMessagesFilePath,
                    apiConversationHistory,
                };
            }
        }
        // if we tried to get a task that doesn't exist, remove it from state
        // FIXME: this seems to happen sometimes when the json file doesnt save to disk for some reason
        await this.deleteTaskFromState(id);
        throw new Error("Task not found");
    }
    async showTaskWithId(id) {
        if (id !== this.getCurrentTask()?.taskId) {
            // Non-current task.
            const { historyItem } = await this.getTaskWithId(id);
            await this.createTaskWithHistoryItem(historyItem); // Clears existing task.
        }
        await this.postMessageToWebview({ type: "action", action: "chatButtonClicked" });
    }
    async exportTaskWithId(id) {
        const { historyItem, apiConversationHistory } = await this.getTaskWithId(id);
        await (0, export_markdown_1.downloadTask)(historyItem.ts, apiConversationHistory);
    }
    /* Condenses a task's message history to use fewer tokens. */
    async condenseTaskContext(taskId) {
        let task;
        for (let i = this.clineStack.length - 1; i >= 0; i--) {
            if (this.clineStack[i].taskId === taskId) {
                task = this.clineStack[i];
                break;
            }
        }
        if (!task) {
            throw new Error(`Task with id ${taskId} not found in stack`);
        }
        await task.condenseContext();
        await this.postMessageToWebview({ type: "condenseTaskContextResponse", text: taskId });
    }
    // this function deletes a task from task hidtory, and deletes it's checkpoints and delete the task folder
    async deleteTaskWithId(id) {
        try {
            // get the task directory full path
            const { taskDirPath } = await this.getTaskWithId(id);
            // remove task from stack if it's the current task
            if (id === this.getCurrentTask()?.taskId) {
                // if we found the taskid to delete - call finish to abort this task and allow a new task to be started,
                // if we are deleting a subtask and parent task is still waiting for subtask to finish - it allows the parent to resume (this case should neve exist)
                await this.finishSubTask((0, i18n_1.t)("common:tasks.deleted"));
            }
            // delete task from the task history state
            await this.deleteTaskFromState(id);
            // Delete associated shadow repository or branch.
            // TODO: Store `workspaceDir` in the `HistoryItem` object.
            const globalStorageDir = this.contextProxy.globalStorageUri.fsPath;
            const workspaceDir = this.cwd;
            try {
                await ShadowCheckpointService_1.ShadowCheckpointService.deleteTask({ taskId: id, globalStorageDir, workspaceDir });
            }
            catch (error) {
                console.error(`[deleteTaskWithId${id}] failed to delete associated shadow repository or branch: ${error instanceof Error ? error.message : String(error)}`);
            }
            // delete the entire task directory including checkpoints and all content
            try {
                await promises_1.default.rm(taskDirPath, { recursive: true, force: true });
                console.log(`[deleteTaskWithId${id}] removed task directory`);
            }
            catch (error) {
                console.error(`[deleteTaskWithId${id}] failed to remove task directory: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        catch (error) {
            // If task is not found, just remove it from state
            if (error instanceof Error && error.message === "Task not found") {
                await this.deleteTaskFromState(id);
                return;
            }
            throw error;
        }
    }
    async deleteTaskFromState(id) {
        const taskHistory = this.getGlobalState("taskHistory") ?? [];
        const updatedTaskHistory = taskHistory.filter((task) => task.id !== id);
        await this.updateGlobalState("taskHistory", updatedTaskHistory);
        this.recentTasksCache = undefined;
        await this.postStateToWebview();
    }
    async refreshWorkspace() {
        this.currentWorkspacePath = (0, path_1.getWorkspacePath)();
        await this.postStateToWebview();
    }
    async postStateToWebview() {
        const state = await this.getStateToPostToWebview();
        this.postMessageToWebview({ type: "state", state });
        // Check MDM compliance and send user to account tab if not compliant
        // Only redirect if there's an actual MDM policy requiring authentication
        if (this.mdmService?.requiresCloudAuth() && !this.checkMdmCompliance()) {
            await this.postMessageToWebview({ type: "action", action: "cloudButtonClicked" });
        }
    }
    /**
     * Fetches marketplace data on demand to avoid blocking main state updates
     */
    async fetchMarketplaceData() {
        try {
            const [marketplaceResult, marketplaceInstalledMetadata] = await Promise.all([
                this.marketplaceManager.getMarketplaceItems().catch((error) => {
                    console.error("Failed to fetch marketplace items:", error);
                    return { organizationMcps: [], marketplaceItems: [], errors: [error.message] };
                }),
                this.marketplaceManager.getInstallationMetadata().catch((error) => {
                    console.error("Failed to fetch installation metadata:", error);
                    return { project: {}, global: {} };
                }),
            ]);
            // Send marketplace data separately
            this.postMessageToWebview({
                type: "marketplaceData",
                organizationMcps: marketplaceResult.organizationMcps || [],
                marketplaceItems: marketplaceResult.marketplaceItems || [],
                marketplaceInstalledMetadata: marketplaceInstalledMetadata || { project: {}, global: {} },
                errors: marketplaceResult.errors,
            });
        }
        catch (error) {
            console.error("Failed to fetch marketplace data:", error);
            // Send empty data on error to prevent UI from hanging
            this.postMessageToWebview({
                type: "marketplaceData",
                organizationMcps: [],
                marketplaceItems: [],
                marketplaceInstalledMetadata: { project: {}, global: {} },
                errors: [error instanceof Error ? error.message : String(error)],
            });
            // Show user-friendly error notification for network issues
            if (error instanceof Error && error.message.includes("timeout")) {
                vscode.window.showWarningMessage("Marketplace data could not be loaded due to network restrictions. Core functionality remains available.");
            }
        }
    }
    /**
     * Checks if there is a file-based system prompt override for the given mode
     */
    async hasFileBasedSystemPromptOverride(mode) {
        const promptFilePath = (0, custom_system_prompt_1.getSystemPromptFilePath)(this.cwd, mode);
        return await (0, fs_1.fileExistsAtPath)(promptFilePath);
    }
    /**
     * Merges allowed commands from global state and workspace configuration
     * with proper validation and deduplication
     */
    mergeAllowedCommands(globalStateCommands) {
        return this.mergeCommandLists("allowedCommands", "allowed", globalStateCommands);
    }
    /**
     * Merges denied commands from global state and workspace configuration
     * with proper validation and deduplication
     */
    mergeDeniedCommands(globalStateCommands) {
        return this.mergeCommandLists("deniedCommands", "denied", globalStateCommands);
    }
    /**
     * Common utility for merging command lists from global state and workspace configuration.
     * Implements the Command Denylist feature's merging strategy with proper validation.
     *
     * @param configKey - VSCode workspace configuration key
     * @param commandType - Type of commands for error logging
     * @param globalStateCommands - Commands from global state
     * @returns Merged and deduplicated command list
     */
    mergeCommandLists(configKey, commandType, globalStateCommands) {
        try {
            // Validate and sanitize global state commands
            const validGlobalCommands = Array.isArray(globalStateCommands)
                ? globalStateCommands.filter((cmd) => typeof cmd === "string" && cmd.trim().length > 0)
                : [];
            // Get workspace configuration commands
            const workspaceCommands = vscode.workspace.getConfiguration(package_1.Package.name).get(configKey) || [];
            // Validate and sanitize workspace commands
            const validWorkspaceCommands = Array.isArray(workspaceCommands)
                ? workspaceCommands.filter((cmd) => typeof cmd === "string" && cmd.trim().length > 0)
                : [];
            // Combine and deduplicate commands
            // Global state takes precedence over workspace configuration
            const mergedCommands = [...new Set([...validGlobalCommands, ...validWorkspaceCommands])];
            return mergedCommands;
        }
        catch (error) {
            console.error(`Error merging ${commandType} commands:`, error);
            // Return empty array as fallback to prevent crashes
            return [];
        }
    }
    async getStateToPostToWebview() {
        const { apiConfiguration, lastShownAnnouncementId, customInstructions, alwaysAllowReadOnly, alwaysAllowReadOnlyOutsideWorkspace, alwaysAllowWrite, alwaysAllowWriteOutsideWorkspace, alwaysAllowWriteProtected, alwaysAllowExecute, allowedCommands, deniedCommands, alwaysAllowBrowser, alwaysAllowMcp, alwaysAllowModeSwitch, alwaysAllowSubtasks, alwaysAllowUpdateTodoList, allowedMaxRequests, allowedMaxCost, autoCondenseContext, autoCondenseContextPercent, soundEnabled, ttsEnabled, ttsSpeed, diffEnabled, enableCheckpoints, checkpointTimeout, taskHistory, soundVolume, browserViewportSize, screenshotQuality, remoteBrowserHost, remoteBrowserEnabled, cachedChromeHostUrl, writeDelayMs, terminalOutputLineLimit, terminalOutputCharacterLimit, terminalShellIntegrationTimeout, terminalShellIntegrationDisabled, terminalCommandDelay, terminalPowershellCounter, terminalZshClearEolMark, terminalZshOhMy, terminalZshP10k, terminalZdotdir, fuzzyMatchThreshold, mcpEnabled, enableMcpServerCreation, alwaysApproveResubmit, requestDelaySeconds, currentApiConfigName, listApiConfigMeta, pinnedApiConfigs, mode, customModePrompts, customSupportPrompts, enhancementApiConfigId, autoApprovalEnabled, customModes, experiments, maxOpenTabsContext, maxWorkspaceFiles, browserToolEnabled, telemetrySetting, showRooIgnoredFiles, language, maxReadFileLine, maxImageFileSize, maxTotalImageSize, terminalCompressProgressBar, historyPreviewCollapsed, reasoningBlockCollapsed, cloudUserInfo, cloudIsAuthenticated, sharingEnabled, organizationAllowList, organizationSettingsVersion, maxConcurrentFileReads, condensingApiConfigId, customCondensingPrompt, codebaseIndexConfig, codebaseIndexModels, profileThresholds, alwaysAllowFollowupQuestions, followupAutoApproveTimeoutMs, includeDiagnosticMessages, maxDiagnosticMessages, includeTaskHistoryInEnhance, includeCurrentTime, includeCurrentCost, taskSyncEnabled, remoteControlEnabled, openRouterImageApiKey, openRouterImageGenerationSelectedModel, openRouterUseMiddleOutTransform, featureRoomoteControlEnabled, } = await this.getState();
        let cloudOrganizations = [];
        try {
            if (!cloud_1.CloudService.instance.isCloudAgent) {
                const now = Date.now();
                if (this.cloudOrganizationsCache !== null &&
                    this.cloudOrganizationsCacheTimestamp !== null &&
                    now - this.cloudOrganizationsCacheTimestamp < ClineProvider.CLOUD_ORGANIZATIONS_CACHE_DURATION_MS) {
                    cloudOrganizations = this.cloudOrganizationsCache;
                }
                else {
                    cloudOrganizations = await cloud_1.CloudService.instance.getOrganizationMemberships();
                    this.cloudOrganizationsCache = cloudOrganizations;
                    this.cloudOrganizationsCacheTimestamp = now;
                }
            }
        }
        catch (error) {
            // Ignore this error.
        }
        const telemetryKey = process.env.POSTHOG_API_KEY;
        const machineId = vscode.env.machineId;
        const mergedAllowedCommands = this.mergeAllowedCommands(allowedCommands);
        const mergedDeniedCommands = this.mergeDeniedCommands(deniedCommands);
        const cwd = this.cwd;
        // Check if there's a system prompt override for the current mode
        const currentMode = mode ?? modes_1.defaultModeSlug;
        const hasSystemPromptOverride = await this.hasFileBasedSystemPromptOverride(currentMode);
        return {
            version: this.context.extension?.packageJSON?.version ?? "",
            apiConfiguration,
            customInstructions,
            alwaysAllowReadOnly: alwaysAllowReadOnly ?? false,
            alwaysAllowReadOnlyOutsideWorkspace: alwaysAllowReadOnlyOutsideWorkspace ?? false,
            alwaysAllowWrite: alwaysAllowWrite ?? false,
            alwaysAllowWriteOutsideWorkspace: alwaysAllowWriteOutsideWorkspace ?? false,
            alwaysAllowWriteProtected: alwaysAllowWriteProtected ?? false,
            alwaysAllowExecute: alwaysAllowExecute ?? false,
            alwaysAllowBrowser: alwaysAllowBrowser ?? false,
            alwaysAllowMcp: alwaysAllowMcp ?? false,
            alwaysAllowModeSwitch: alwaysAllowModeSwitch ?? false,
            alwaysAllowSubtasks: alwaysAllowSubtasks ?? false,
            alwaysAllowUpdateTodoList: alwaysAllowUpdateTodoList ?? false,
            allowedMaxRequests,
            allowedMaxCost,
            autoCondenseContext: autoCondenseContext ?? true,
            autoCondenseContextPercent: autoCondenseContextPercent ?? 100,
            uriScheme: vscode.env.uriScheme,
            currentTaskItem: this.getCurrentTask()?.taskId
                ? (taskHistory || []).find((item) => item.id === this.getCurrentTask()?.taskId)
                : undefined,
            clineMessages: this.getCurrentTask()?.clineMessages || [],
            currentTaskTodos: this.getCurrentTask()?.todoList || [],
            messageQueue: this.getCurrentTask()?.messageQueueService?.messages,
            taskHistory: (taskHistory || [])
                .filter((item) => item.ts && item.task)
                .sort((a, b) => b.ts - a.ts),
            soundEnabled: soundEnabled ?? false,
            ttsEnabled: ttsEnabled ?? false,
            ttsSpeed: ttsSpeed ?? 1.0,
            diffEnabled: diffEnabled ?? true,
            enableCheckpoints: enableCheckpoints ?? true,
            checkpointTimeout: checkpointTimeout ?? types_1.DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
            shouldShowAnnouncement: telemetrySetting !== "unset" && lastShownAnnouncementId !== this.latestAnnouncementId,
            allowedCommands: mergedAllowedCommands,
            deniedCommands: mergedDeniedCommands,
            soundVolume: soundVolume ?? 0.5,
            browserViewportSize: browserViewportSize ?? "900x600",
            screenshotQuality: screenshotQuality ?? 75,
            remoteBrowserHost,
            remoteBrowserEnabled: remoteBrowserEnabled ?? false,
            cachedChromeHostUrl: cachedChromeHostUrl,
            writeDelayMs: writeDelayMs ?? types_1.DEFAULT_WRITE_DELAY_MS,
            terminalOutputLineLimit: terminalOutputLineLimit ?? 500,
            terminalOutputCharacterLimit: terminalOutputCharacterLimit ?? types_1.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
            terminalShellIntegrationTimeout: terminalShellIntegrationTimeout ?? Terminal_1.Terminal.defaultShellIntegrationTimeout,
            terminalShellIntegrationDisabled: terminalShellIntegrationDisabled ?? false,
            terminalCommandDelay: terminalCommandDelay ?? 0,
            terminalPowershellCounter: terminalPowershellCounter ?? false,
            terminalZshClearEolMark: terminalZshClearEolMark ?? true,
            terminalZshOhMy: terminalZshOhMy ?? false,
            terminalZshP10k: terminalZshP10k ?? false,
            terminalZdotdir: terminalZdotdir ?? false,
            fuzzyMatchThreshold: fuzzyMatchThreshold ?? 1.0,
            mcpEnabled: mcpEnabled ?? true,
            enableMcpServerCreation: enableMcpServerCreation ?? true,
            alwaysApproveResubmit: alwaysApproveResubmit ?? false,
            requestDelaySeconds: requestDelaySeconds ?? 10,
            currentApiConfigName: currentApiConfigName ?? "default",
            listApiConfigMeta: listApiConfigMeta ?? [],
            pinnedApiConfigs: pinnedApiConfigs ?? {},
            mode: mode ?? modes_1.defaultModeSlug,
            customModePrompts: customModePrompts ?? {},
            customSupportPrompts: customSupportPrompts ?? {},
            enhancementApiConfigId,
            autoApprovalEnabled: autoApprovalEnabled ?? false,
            customModes,
            experiments: experiments ?? experiments_1.experimentDefault,
            mcpServers: this.mcpHub?.getAllServers() ?? [],
            maxOpenTabsContext: maxOpenTabsContext ?? 20,
            maxWorkspaceFiles: maxWorkspaceFiles ?? 200,
            cwd,
            browserToolEnabled: browserToolEnabled ?? true,
            telemetrySetting,
            telemetryKey,
            machineId,
            showRooIgnoredFiles: showRooIgnoredFiles ?? false,
            language: language ?? (0, language_1.formatLanguage)(vscode.env.language),
            renderContext: this.renderContext,
            maxReadFileLine: maxReadFileLine ?? -1,
            maxImageFileSize: maxImageFileSize ?? 5,
            maxTotalImageSize: maxTotalImageSize ?? 20,
            maxConcurrentFileReads: maxConcurrentFileReads ?? 5,
            settingsImportedAt: this.settingsImportedAt,
            terminalCompressProgressBar: terminalCompressProgressBar ?? true,
            hasSystemPromptOverride,
            historyPreviewCollapsed: historyPreviewCollapsed ?? false,
            reasoningBlockCollapsed: reasoningBlockCollapsed ?? true,
            cloudUserInfo,
            cloudIsAuthenticated: cloudIsAuthenticated ?? false,
            cloudOrganizations,
            sharingEnabled: sharingEnabled ?? false,
            organizationAllowList,
            organizationSettingsVersion,
            condensingApiConfigId,
            customCondensingPrompt,
            codebaseIndexModels: codebaseIndexModels ?? embeddingModels_1.EMBEDDING_MODEL_PROFILES,
            codebaseIndexConfig: {
                codebaseIndexEnabled: codebaseIndexConfig?.codebaseIndexEnabled ?? true,
                codebaseIndexQdrantUrl: codebaseIndexConfig?.codebaseIndexQdrantUrl ?? "http://localhost:6333",
                codebaseIndexEmbedderProvider: codebaseIndexConfig?.codebaseIndexEmbedderProvider ?? "openai",
                codebaseIndexEmbedderBaseUrl: codebaseIndexConfig?.codebaseIndexEmbedderBaseUrl ?? "",
                codebaseIndexEmbedderModelId: codebaseIndexConfig?.codebaseIndexEmbedderModelId ?? "",
                codebaseIndexEmbedderModelDimension: codebaseIndexConfig?.codebaseIndexEmbedderModelDimension ?? 1536,
                codebaseIndexOpenAiCompatibleBaseUrl: codebaseIndexConfig?.codebaseIndexOpenAiCompatibleBaseUrl,
                codebaseIndexSearchMaxResults: codebaseIndexConfig?.codebaseIndexSearchMaxResults,
                codebaseIndexSearchMinScore: codebaseIndexConfig?.codebaseIndexSearchMinScore,
            },
            // Only set mdmCompliant if there's an actual MDM policy
            // undefined means no MDM policy, true means compliant, false means non-compliant
            mdmCompliant: this.mdmService?.requiresCloudAuth() ? this.checkMdmCompliance() : undefined,
            profileThresholds: profileThresholds ?? {},
            cloudApiUrl: (0, cloud_1.getRooCodeApiUrl)(),
            hasOpenedModeSelector: this.getGlobalState("hasOpenedModeSelector") ?? false,
            alwaysAllowFollowupQuestions: alwaysAllowFollowupQuestions ?? false,
            followupAutoApproveTimeoutMs: followupAutoApproveTimeoutMs ?? 60000,
            includeDiagnosticMessages: includeDiagnosticMessages ?? true,
            maxDiagnosticMessages: maxDiagnosticMessages ?? 50,
            includeTaskHistoryInEnhance: includeTaskHistoryInEnhance ?? true,
            includeCurrentTime: includeCurrentTime ?? true,
            includeCurrentCost: includeCurrentCost ?? true,
            taskSyncEnabled,
            remoteControlEnabled,
            openRouterImageApiKey,
            openRouterImageGenerationSelectedModel,
            openRouterUseMiddleOutTransform,
            featureRoomoteControlEnabled,
        };
    }
    /**
     * Storage
     * https://dev.to/kompotkot/how-to-use-secretstorage-in-your-vscode-extensions-2hco
     * https://www.eliostruyf.com/devhack-code-extension-storage-options/
     */
    async getState() {
        const stateValues = this.contextProxy.getValues();
        const customModes = await this.customModesManager.getCustomModes();
        // Determine apiProvider with the same logic as before.
        const apiProvider = stateValues.apiProvider ? stateValues.apiProvider : "anthropic";
        // Build the apiConfiguration object combining state values and secrets.
        const providerSettings = this.contextProxy.getProviderSettings();
        // Ensure apiProvider is set properly if not already in state
        if (!providerSettings.apiProvider) {
            providerSettings.apiProvider = apiProvider;
        }
        let organizationAllowList = types_1.ORGANIZATION_ALLOW_ALL;
        try {
            organizationAllowList = await cloud_1.CloudService.instance.getAllowList();
        }
        catch (error) {
            console.error(`[getState] failed to get organization allow list: ${error instanceof Error ? error.message : String(error)}`);
        }
        let cloudUserInfo = null;
        try {
            cloudUserInfo = cloud_1.CloudService.instance.getUserInfo();
        }
        catch (error) {
            console.error(`[getState] failed to get cloud user info: ${error instanceof Error ? error.message : String(error)}`);
        }
        let cloudIsAuthenticated = false;
        try {
            cloudIsAuthenticated = cloud_1.CloudService.instance.isAuthenticated();
        }
        catch (error) {
            console.error(`[getState] failed to get cloud authentication state: ${error instanceof Error ? error.message : String(error)}`);
        }
        let sharingEnabled = false;
        try {
            sharingEnabled = await cloud_1.CloudService.instance.canShareTask();
        }
        catch (error) {
            console.error(`[getState] failed to get sharing enabled state: ${error instanceof Error ? error.message : String(error)}`);
        }
        let organizationSettingsVersion = -1;
        try {
            if (cloud_1.CloudService.hasInstance()) {
                const settings = cloud_1.CloudService.instance.getOrganizationSettings();
                organizationSettingsVersion = settings?.version ?? -1;
            }
        }
        catch (error) {
            console.error(`[getState] failed to get organization settings version: ${error instanceof Error ? error.message : String(error)}`);
        }
        let taskSyncEnabled = false;
        try {
            taskSyncEnabled = cloud_1.CloudService.instance.isTaskSyncEnabled();
        }
        catch (error) {
            console.error(`[getState] failed to get task sync enabled state: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Return the same structure as before.
        return {
            apiConfiguration: providerSettings,
            lastShownAnnouncementId: stateValues.lastShownAnnouncementId,
            customInstructions: stateValues.customInstructions,
            apiModelId: stateValues.apiModelId,
            alwaysAllowReadOnly: stateValues.alwaysAllowReadOnly ?? false,
            alwaysAllowReadOnlyOutsideWorkspace: stateValues.alwaysAllowReadOnlyOutsideWorkspace ?? false,
            alwaysAllowWrite: stateValues.alwaysAllowWrite ?? false,
            alwaysAllowWriteOutsideWorkspace: stateValues.alwaysAllowWriteOutsideWorkspace ?? false,
            alwaysAllowWriteProtected: stateValues.alwaysAllowWriteProtected ?? false,
            alwaysAllowExecute: stateValues.alwaysAllowExecute ?? false,
            alwaysAllowBrowser: stateValues.alwaysAllowBrowser ?? false,
            alwaysAllowMcp: stateValues.alwaysAllowMcp ?? false,
            alwaysAllowModeSwitch: stateValues.alwaysAllowModeSwitch ?? false,
            alwaysAllowSubtasks: stateValues.alwaysAllowSubtasks ?? false,
            alwaysAllowFollowupQuestions: stateValues.alwaysAllowFollowupQuestions ?? false,
            alwaysAllowUpdateTodoList: stateValues.alwaysAllowUpdateTodoList ?? false,
            followupAutoApproveTimeoutMs: stateValues.followupAutoApproveTimeoutMs ?? 60000,
            diagnosticsEnabled: stateValues.diagnosticsEnabled ?? true,
            allowedMaxRequests: stateValues.allowedMaxRequests,
            allowedMaxCost: stateValues.allowedMaxCost,
            autoCondenseContext: stateValues.autoCondenseContext ?? true,
            autoCondenseContextPercent: stateValues.autoCondenseContextPercent ?? 100,
            taskHistory: stateValues.taskHistory ?? [],
            allowedCommands: stateValues.allowedCommands,
            deniedCommands: stateValues.deniedCommands,
            soundEnabled: stateValues.soundEnabled ?? false,
            ttsEnabled: stateValues.ttsEnabled ?? false,
            ttsSpeed: stateValues.ttsSpeed ?? 1.0,
            diffEnabled: stateValues.diffEnabled ?? true,
            enableCheckpoints: stateValues.enableCheckpoints ?? true,
            checkpointTimeout: stateValues.checkpointTimeout ?? types_1.DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
            soundVolume: stateValues.soundVolume,
            browserViewportSize: stateValues.browserViewportSize ?? "900x600",
            screenshotQuality: stateValues.screenshotQuality ?? 75,
            remoteBrowserHost: stateValues.remoteBrowserHost,
            remoteBrowserEnabled: stateValues.remoteBrowserEnabled ?? false,
            cachedChromeHostUrl: stateValues.cachedChromeHostUrl,
            fuzzyMatchThreshold: stateValues.fuzzyMatchThreshold ?? 1.0,
            writeDelayMs: stateValues.writeDelayMs ?? types_1.DEFAULT_WRITE_DELAY_MS,
            terminalOutputLineLimit: stateValues.terminalOutputLineLimit ?? 500,
            terminalOutputCharacterLimit: stateValues.terminalOutputCharacterLimit ?? types_1.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
            terminalShellIntegrationTimeout: stateValues.terminalShellIntegrationTimeout ?? Terminal_1.Terminal.defaultShellIntegrationTimeout,
            terminalShellIntegrationDisabled: stateValues.terminalShellIntegrationDisabled ?? false,
            terminalCommandDelay: stateValues.terminalCommandDelay ?? 0,
            terminalPowershellCounter: stateValues.terminalPowershellCounter ?? false,
            terminalZshClearEolMark: stateValues.terminalZshClearEolMark ?? true,
            terminalZshOhMy: stateValues.terminalZshOhMy ?? false,
            terminalZshP10k: stateValues.terminalZshP10k ?? false,
            terminalZdotdir: stateValues.terminalZdotdir ?? false,
            terminalCompressProgressBar: stateValues.terminalCompressProgressBar ?? true,
            mode: stateValues.mode ?? modes_1.defaultModeSlug,
            language: stateValues.language ?? (0, language_1.formatLanguage)(vscode.env.language),
            mcpEnabled: stateValues.mcpEnabled ?? true,
            enableMcpServerCreation: stateValues.enableMcpServerCreation ?? true,
            mcpServers: this.mcpHub?.getAllServers() ?? [],
            alwaysApproveResubmit: stateValues.alwaysApproveResubmit ?? false,
            requestDelaySeconds: Math.max(5, stateValues.requestDelaySeconds ?? 10),
            currentApiConfigName: stateValues.currentApiConfigName ?? "default",
            listApiConfigMeta: stateValues.listApiConfigMeta ?? [],
            pinnedApiConfigs: stateValues.pinnedApiConfigs ?? {},
            modeApiConfigs: stateValues.modeApiConfigs ?? {},
            customModePrompts: stateValues.customModePrompts ?? {},
            customSupportPrompts: stateValues.customSupportPrompts ?? {},
            enhancementApiConfigId: stateValues.enhancementApiConfigId,
            experiments: stateValues.experiments ?? experiments_1.experimentDefault,
            autoApprovalEnabled: stateValues.autoApprovalEnabled ?? false,
            customModes,
            maxOpenTabsContext: stateValues.maxOpenTabsContext ?? 20,
            maxWorkspaceFiles: stateValues.maxWorkspaceFiles ?? 200,
            openRouterUseMiddleOutTransform: stateValues.openRouterUseMiddleOutTransform,
            browserToolEnabled: stateValues.browserToolEnabled ?? true,
            telemetrySetting: stateValues.telemetrySetting || "unset",
            showRooIgnoredFiles: stateValues.showRooIgnoredFiles ?? false,
            maxReadFileLine: stateValues.maxReadFileLine ?? -1,
            maxImageFileSize: stateValues.maxImageFileSize ?? 5,
            maxTotalImageSize: stateValues.maxTotalImageSize ?? 20,
            maxConcurrentFileReads: stateValues.maxConcurrentFileReads ?? 5,
            historyPreviewCollapsed: stateValues.historyPreviewCollapsed ?? false,
            reasoningBlockCollapsed: stateValues.reasoningBlockCollapsed ?? true,
            cloudUserInfo,
            cloudIsAuthenticated,
            sharingEnabled,
            organizationAllowList,
            organizationSettingsVersion,
            condensingApiConfigId: stateValues.condensingApiConfigId,
            customCondensingPrompt: stateValues.customCondensingPrompt,
            codebaseIndexModels: stateValues.codebaseIndexModels ?? embeddingModels_1.EMBEDDING_MODEL_PROFILES,
            codebaseIndexConfig: {
                codebaseIndexEnabled: stateValues.codebaseIndexConfig?.codebaseIndexEnabled ?? true,
                codebaseIndexQdrantUrl: stateValues.codebaseIndexConfig?.codebaseIndexQdrantUrl ?? "http://localhost:6333",
                codebaseIndexEmbedderProvider: stateValues.codebaseIndexConfig?.codebaseIndexEmbedderProvider ?? "openai",
                codebaseIndexEmbedderBaseUrl: stateValues.codebaseIndexConfig?.codebaseIndexEmbedderBaseUrl ?? "",
                codebaseIndexEmbedderModelId: stateValues.codebaseIndexConfig?.codebaseIndexEmbedderModelId ?? "",
                codebaseIndexEmbedderModelDimension: stateValues.codebaseIndexConfig?.codebaseIndexEmbedderModelDimension,
                codebaseIndexOpenAiCompatibleBaseUrl: stateValues.codebaseIndexConfig?.codebaseIndexOpenAiCompatibleBaseUrl,
                codebaseIndexSearchMaxResults: stateValues.codebaseIndexConfig?.codebaseIndexSearchMaxResults,
                codebaseIndexSearchMinScore: stateValues.codebaseIndexConfig?.codebaseIndexSearchMinScore,
            },
            profileThresholds: stateValues.profileThresholds ?? {},
            includeDiagnosticMessages: stateValues.includeDiagnosticMessages ?? true,
            maxDiagnosticMessages: stateValues.maxDiagnosticMessages ?? 50,
            includeTaskHistoryInEnhance: stateValues.includeTaskHistoryInEnhance ?? true,
            includeCurrentTime: stateValues.includeCurrentTime ?? true,
            includeCurrentCost: stateValues.includeCurrentCost ?? true,
            taskSyncEnabled,
            remoteControlEnabled: (() => {
                try {
                    const cloudSettings = cloud_1.CloudService.instance.getUserSettings();
                    return cloudSettings?.settings?.extensionBridgeEnabled ?? false;
                }
                catch (error) {
                    console.error(`[getState] failed to get remote control setting from cloud: ${error instanceof Error ? error.message : String(error)}`);
                    return false;
                }
            })(),
            openRouterImageApiKey: stateValues.openRouterImageApiKey,
            openRouterImageGenerationSelectedModel: stateValues.openRouterImageGenerationSelectedModel,
            featureRoomoteControlEnabled: (() => {
                try {
                    const userSettings = cloud_1.CloudService.instance.getUserSettings();
                    const hasOrganization = cloudUserInfo?.organizationId != null;
                    return hasOrganization || (userSettings?.features?.roomoteControlEnabled ?? false);
                }
                catch (error) {
                    console.error(`[getState] failed to get featureRoomoteControlEnabled: ${error instanceof Error ? error.message : String(error)}`);
                    return false;
                }
            })(),
        };
    }
    async updateTaskHistory(item) {
        const history = this.getGlobalState("taskHistory") || [];
        const existingItemIndex = history.findIndex((h) => h.id === item.id);
        if (existingItemIndex !== -1) {
            history[existingItemIndex] = item;
        }
        else {
            history.push(item);
        }
        await this.updateGlobalState("taskHistory", history);
        this.recentTasksCache = undefined;
        return history;
    }
    // ContextProxy
    // @deprecated - Use `ContextProxy#setValue` instead.
    async updateGlobalState(key, value) {
        await this.contextProxy.setValue(key, value);
    }
    // @deprecated - Use `ContextProxy#getValue` instead.
    getGlobalState(key) {
        return this.contextProxy.getValue(key);
    }
    async setValue(key, value) {
        await this.contextProxy.setValue(key, value);
    }
    getValue(key) {
        return this.contextProxy.getValue(key);
    }
    getValues() {
        return this.contextProxy.getValues();
    }
    async setValues(values) {
        await this.contextProxy.setValues(values);
    }
    // dev
    async resetState() {
        const answer = await vscode.window.showInformationMessage((0, i18n_1.t)("common:confirmation.reset_state"), { modal: true }, (0, i18n_1.t)("common:answers.yes"));
        if (answer !== (0, i18n_1.t)("common:answers.yes")) {
            return;
        }
        // Log out from cloud if authenticated
        if (cloud_1.CloudService.hasInstance()) {
            try {
                await cloud_1.CloudService.instance.logout();
            }
            catch (error) {
                this.log(`Failed to logout from cloud during reset: ${error instanceof Error ? error.message : String(error)}`);
                // Continue with reset even if logout fails
            }
        }
        await this.contextProxy.resetAllState();
        await this.providerSettingsManager.resetAllConfigs();
        await this.customModesManager.resetCustomModes();
        await this.removeClineFromStack();
        await this.postStateToWebview();
        await this.postMessageToWebview({ type: "action", action: "chatButtonClicked" });
    }
    // logging
    log(message) {
        this.outputChannel.appendLine(message);
        console.log(message);
    }
    // getters
    get workspaceTracker() {
        return this._workspaceTracker;
    }
    get viewLaunched() {
        return this.isViewLaunched;
    }
    get messages() {
        return this.getCurrentTask()?.clineMessages || [];
    }
    getMcpHub() {
        return this.mcpHub;
    }
    /**
     * Check if the current state is compliant with MDM policy
     * @returns true if compliant or no MDM policy exists, false if MDM policy exists and user is non-compliant
     */
    checkMdmCompliance() {
        if (!this.mdmService) {
            return true; // No MDM service, allow operation
        }
        const compliance = this.mdmService.isCompliant();
        if (!compliance.compliant) {
            return false;
        }
        return true;
    }
    async remoteControlEnabled(enabled) {
        if (!enabled) {
            await cloud_1.BridgeOrchestrator.disconnect();
            return;
        }
        const userInfo = cloud_1.CloudService.instance.getUserInfo();
        if (!userInfo) {
            this.log("[ClineProvider#remoteControlEnabled] Failed to get user info, disconnecting");
            await cloud_1.BridgeOrchestrator.disconnect();
            return;
        }
        const config = await cloud_1.CloudService.instance.cloudAPI?.bridgeConfig().catch(() => undefined);
        if (!config) {
            this.log("[ClineProvider#remoteControlEnabled] Failed to get bridge config");
            return;
        }
        await cloud_1.BridgeOrchestrator.connectOrDisconnect(userInfo, enabled, {
            ...config,
            provider: this,
            sessionId: vscode.env.sessionId,
            isCloudAgent: cloud_1.CloudService.instance.isCloudAgent,
        });
        const bridge = cloud_1.BridgeOrchestrator.getInstance();
        if (bridge) {
            const currentTask = this.getCurrentTask();
            if (currentTask && !currentTask.enableBridge) {
                try {
                    currentTask.enableBridge = true;
                    await cloud_1.BridgeOrchestrator.subscribeToTask(currentTask);
                }
                catch (error) {
                    const message = `[ClineProvider#remoteControlEnabled] BridgeOrchestrator.subscribeToTask() failed: ${error instanceof Error ? error.message : String(error)}`;
                    this.log(message);
                    console.error(message);
                }
            }
        }
        else {
            for (const task of this.clineStack) {
                if (task.enableBridge) {
                    try {
                        await cloud_1.BridgeOrchestrator.getInstance()?.unsubscribeFromTask(task.taskId);
                    }
                    catch (error) {
                        const message = `[ClineProvider#remoteControlEnabled] BridgeOrchestrator#unsubscribeFromTask() failed: ${error instanceof Error ? error.message : String(error)}`;
                        this.log(message);
                        console.error(message);
                    }
                }
            }
        }
    }
    /**
     * Gets the CodeIndexManager for the current active workspace
     * @returns CodeIndexManager instance for the current workspace or the default one
     */
    getCurrentWorkspaceCodeIndexManager() {
        return manager_1.CodeIndexManager.getInstance(this.context);
    }
    /**
     * Updates the code index status subscription to listen to the current workspace manager
     */
    updateCodeIndexStatusSubscription() {
        // Get the current workspace manager
        const currentManager = this.getCurrentWorkspaceCodeIndexManager();
        // If the manager hasn't changed, no need to update subscription
        if (currentManager === this.codeIndexManager) {
            return;
        }
        // Dispose the old subscription if it exists
        if (this.codeIndexStatusSubscription) {
            this.codeIndexStatusSubscription.dispose();
            this.codeIndexStatusSubscription = undefined;
        }
        // Update the current workspace manager reference
        this.codeIndexManager = currentManager;
        // Subscribe to the new manager's progress updates if it exists
        if (currentManager) {
            this.codeIndexStatusSubscription = currentManager.onProgressUpdate((update) => {
                // Only send updates if this manager is still the current one
                if (currentManager === this.getCurrentWorkspaceCodeIndexManager()) {
                    // Get the full status from the manager to ensure we have all fields correctly formatted
                    const fullStatus = currentManager.getCurrentStatus();
                    this.postMessageToWebview({
                        type: "indexingStatusUpdate",
                        values: fullStatus,
                    });
                }
            });
            if (this.view) {
                this.webviewDisposables.push(this.codeIndexStatusSubscription);
            }
            // Send initial status for the current workspace
            this.postMessageToWebview({
                type: "indexingStatusUpdate",
                values: currentManager.getCurrentStatus(),
            });
        }
    }
    /**
     * TaskProviderLike, TelemetryPropertiesProvider
     */
    getCurrentTask() {
        if (this.clineStack.length === 0) {
            return undefined;
        }
        return this.clineStack[this.clineStack.length - 1];
    }
    getRecentTasks() {
        if (this.recentTasksCache) {
            return this.recentTasksCache;
        }
        const history = this.getGlobalState("taskHistory") ?? [];
        const workspaceTasks = [];
        for (const item of history) {
            if (!item.ts || !item.task || item.workspace !== this.cwd) {
                continue;
            }
            workspaceTasks.push(item);
        }
        if (workspaceTasks.length === 0) {
            this.recentTasksCache = [];
            return this.recentTasksCache;
        }
        workspaceTasks.sort((a, b) => b.ts - a.ts);
        let recentTaskIds = [];
        if (workspaceTasks.length >= 100) {
            // If we have at least 100 tasks, return tasks from the last 7 days.
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            for (const item of workspaceTasks) {
                // Stop when we hit tasks older than 7 days.
                if (item.ts < sevenDaysAgo) {
                    break;
                }
                recentTaskIds.push(item.id);
            }
        }
        else {
            // Otherwise, return the most recent 100 tasks (or all if less than 100).
            recentTaskIds = workspaceTasks.slice(0, Math.min(100, workspaceTasks.length)).map((item) => item.id);
        }
        this.recentTasksCache = recentTaskIds;
        return this.recentTasksCache;
    }
    // When initializing a new task, (not from history but from a tool command
    // new_task) there is no need to remove the previous task since the new
    // task is a subtask of the previous one, and when it finishes it is removed
    // from the stack and the caller is resumed in this way we can have a chain
    // of tasks, each one being a sub task of the previous one until the main
    // task is finished.
    async createTask(text, images, parentTask, options = {}, configuration = {}) {
        if (configuration) {
            await this.setValues(configuration);
            if (configuration.allowedCommands) {
                await vscode.workspace
                    .getConfiguration(package_1.Package.name)
                    .update("allowedCommands", configuration.allowedCommands, vscode.ConfigurationTarget.Global);
            }
            if (configuration.deniedCommands) {
                await vscode.workspace
                    .getConfiguration(package_1.Package.name)
                    .update("deniedCommands", configuration.deniedCommands, vscode.ConfigurationTarget.Global);
            }
            if (configuration.commandExecutionTimeout !== undefined) {
                await vscode.workspace
                    .getConfiguration(package_1.Package.name)
                    .update("commandExecutionTimeout", configuration.commandExecutionTimeout, vscode.ConfigurationTarget.Global);
            }
            if (configuration.currentApiConfigName) {
                await this.setProviderProfile(configuration.currentApiConfigName);
            }
        }
        const { apiConfiguration, organizationAllowList, diffEnabled: enableDiff, enableCheckpoints, checkpointTimeout, fuzzyMatchThreshold, experiments, cloudUserInfo, remoteControlEnabled, } = await this.getState();
        if (!ProfileValidator_1.ProfileValidator.isProfileAllowed(apiConfiguration, organizationAllowList)) {
            throw new errors_1.OrganizationAllowListViolationError((0, i18n_1.t)("common:errors.violated_organization_allowlist"));
        }
        const task = new Task_1.Task({
            provider: this,
            apiConfiguration,
            enableDiff,
            enableCheckpoints,
            checkpointTimeout,
            fuzzyMatchThreshold,
            consecutiveMistakeLimit: apiConfiguration.consecutiveMistakeLimit,
            task: text,
            images,
            experiments,
            rootTask: this.clineStack.length > 0 ? this.clineStack[0] : undefined,
            parentTask,
            taskNumber: this.clineStack.length + 1,
            onCreated: this.taskCreationCallback,
            enableBridge: cloud_1.BridgeOrchestrator.isEnabled(cloudUserInfo, remoteControlEnabled),
            initialTodos: options.initialTodos,
            ...options,
        });
        await this.addClineToStack(task);
        this.log(`[createTask] ${task.parentTask ? "child" : "parent"} task ${task.taskId}.${task.instanceId} instantiated`);
        return task;
    }
    async cancelTask() {
        const task = this.getCurrentTask();
        if (!task) {
            return;
        }
        console.log(`[cancelTask] cancelling task ${task.taskId}.${task.instanceId}`);
        const { historyItem, uiMessagesFilePath } = await this.getTaskWithId(task.taskId);
        // Preserve parent and root task information for history item.
        const rootTask = task.rootTask;
        const parentTask = task.parentTask;
        // Mark this as a user-initiated cancellation so provider-only rehydration can occur
        task.abortReason = "user_cancelled";
        // Capture the current instance to detect if rehydrate already occurred elsewhere
        const originalInstanceId = task.instanceId;
        // Begin abort (non-blocking)
        task.abortTask();
        // Immediately mark the original instance as abandoned to prevent any residual activity
        task.abandoned = true;
        await (0, p_wait_for_1.default)(() => this.getCurrentTask() === undefined ||
            this.getCurrentTask().isStreaming === false ||
            this.getCurrentTask().didFinishAbortingStream ||
            // If only the first chunk is processed, then there's no
            // need to wait for graceful abort (closes edits, browser,
            // etc).
            this.getCurrentTask().isWaitingForFirstChunk, {
            timeout: 3_000,
        }).catch(() => {
            console.error("Failed to abort task");
        });
        // Defensive safeguard: if current instance already changed, skip rehydrate
        const current = this.getCurrentTask();
        if (current && current.instanceId !== originalInstanceId) {
            this.log(`[cancelTask] Skipping rehydrate: current instance ${current.instanceId} != original ${originalInstanceId}`);
            return;
        }
        // Final race check before rehydrate to avoid duplicate rehydration
        {
            const currentAfterCheck = this.getCurrentTask();
            if (currentAfterCheck && currentAfterCheck.instanceId !== originalInstanceId) {
                this.log(`[cancelTask] Skipping rehydrate after final check: current instance ${currentAfterCheck.instanceId} != original ${originalInstanceId}`);
                return;
            }
        }
        // Clears task again, so we need to abortTask manually above.
        await this.createTaskWithHistoryItem({ ...historyItem, rootTask, parentTask });
    }
    // Clear the current task without treating it as a subtask.
    // This is used when the user cancels a task that is not a subtask.
    async clearTask() {
        if (this.clineStack.length > 0) {
            const task = this.clineStack[this.clineStack.length - 1];
            console.log(`[clearTask] clearing task ${task.taskId}.${task.instanceId}`);
            await this.removeClineFromStack();
        }
    }
    resumeTask(taskId) {
        // Use the existing showTaskWithId method which handles both current and
        // historical tasks.
        this.showTaskWithId(taskId).catch((error) => {
            this.log(`Failed to resume task ${taskId}: ${error.message}`);
        });
    }
    // Modes
    async getModes() {
        try {
            const customModes = await this.customModesManager.getCustomModes();
            return [...types_1.DEFAULT_MODES, ...customModes].map(({ slug, name }) => ({ slug, name }));
        }
        catch (error) {
            return types_1.DEFAULT_MODES.map(({ slug, name }) => ({ slug, name }));
        }
    }
    async getMode() {
        const { mode } = await this.getState();
        return mode;
    }
    async setMode(mode) {
        await this.setValues({ mode });
    }
    // Provider Profiles
    async getProviderProfiles() {
        const { listApiConfigMeta = [] } = await this.getState();
        return listApiConfigMeta.map((profile) => ({ name: profile.name, provider: profile.apiProvider }));
    }
    async getProviderProfile() {
        const { currentApiConfigName = "default" } = await this.getState();
        return currentApiConfigName;
    }
    async setProviderProfile(name) {
        await this.activateProviderProfile({ name });
    }
    // Telemetry
    _appProperties;
    _gitProperties;
    getAppProperties() {
        if (!this._appProperties) {
            const packageJSON = this.context.extension?.packageJSON;
            this._appProperties = {
                appName: packageJSON?.name ?? package_1.Package.name,
                appVersion: packageJSON?.version ?? package_1.Package.version,
                vscodeVersion: vscode.version,
                platform: process.platform,
                editorName: vscode.env.appName,
            };
        }
        return this._appProperties;
    }
    get appProperties() {
        return this._appProperties ?? this.getAppProperties();
    }
    getCloudProperties() {
        let cloudIsAuthenticated;
        try {
            if (cloud_1.CloudService.hasInstance()) {
                cloudIsAuthenticated = cloud_1.CloudService.instance.isAuthenticated();
            }
        }
        catch (error) {
            // Silently handle errors to avoid breaking telemetry collection.
            this.log(`[getTelemetryProperties] Failed to get cloud auth state: ${error}`);
        }
        return {
            cloudIsAuthenticated,
        };
    }
    async getTaskProperties() {
        const { language = "en", mode, apiConfiguration } = await this.getState();
        const task = this.getCurrentTask();
        const todoList = task?.todoList;
        let todos;
        if (todoList && todoList.length > 0) {
            todos = {
                total: todoList.length,
                completed: todoList.filter((todo) => todo.status === "completed").length,
                inProgress: todoList.filter((todo) => todo.status === "in_progress").length,
                pending: todoList.filter((todo) => todo.status === "pending").length,
            };
        }
        return {
            language,
            mode,
            taskId: task?.taskId,
            parentTaskId: task?.parentTask?.taskId,
            apiProvider: apiConfiguration?.apiProvider,
            modelId: task?.api?.getModel().id,
            diffStrategy: task?.diffStrategy?.getName(),
            isSubtask: task ? !!task.parentTask : undefined,
            ...(todos && { todos }),
        };
    }
    async getGitProperties() {
        if (!this._gitProperties) {
            this._gitProperties = await (0, git_1.getWorkspaceGitInfo)();
        }
        return this._gitProperties;
    }
    get gitProperties() {
        return this._gitProperties;
    }
    async getTelemetryProperties() {
        return {
            ...this.getAppProperties(),
            ...this.getCloudProperties(),
            ...(await this.getTaskProperties()),
            ...(await this.getGitProperties()),
        };
    }
    get cwd() {
        return this.currentWorkspacePath || (0, path_1.getWorkspacePath)();
    }
    /**
     * Convert a file path to a webview-accessible URI
     * This method safely converts file paths to URIs that can be loaded in the webview
     *
     * @param filePath - The absolute file path to convert
     * @returns The webview URI string, or the original file URI if conversion fails
     * @throws {Error} When webview is not available
     * @throws {TypeError} When file path is invalid
     */
    convertToWebviewUri(filePath) {
        try {
            const fileUri = vscode.Uri.file(filePath);
            // Check if we have a webview available
            if (this.view?.webview) {
                const webviewUri = this.view.webview.asWebviewUri(fileUri);
                return webviewUri.toString();
            }
            // Specific error for no webview available
            const error = new Error("No webview available for URI conversion");
            console.error(error.message);
            // Fallback to file URI if no webview available
            return fileUri.toString();
        }
        catch (error) {
            // More specific error handling
            if (error instanceof TypeError) {
                console.error("Invalid file path provided for URI conversion:", error);
            }
            else {
                console.error("Failed to convert to webview URI:", error);
            }
            // Return file URI as fallback
            return vscode.Uri.file(filePath).toString();
        }
    }
}
exports.ClineProvider = ClineProvider;
//# sourceMappingURL=ClineProvider.js.map