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
exports.Task = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const events_1 = __importDefault(require("events"));
const delay_1 = __importDefault(require("delay"));
const p_wait_for_1 = __importDefault(require("p-wait-for"));
const serialize_error_1 = require("serialize-error");
const package_1 = require("../../shared/package");
const toolResultFormatting_1 = require("../tools/helpers/toolResultFormatting");
const types_1 = require("@roo-code/types");
const telemetry_1 = require("@roo-code/telemetry");
const cloud_1 = require("@roo-code/cloud");
const resolveToolProtocol_1 = require("../../utils/resolveToolProtocol");
// api
const api_1 = require("../../api");
const image_cleaning_1 = require("../../api/transform/image-cleaning");
// shared
const array_1 = require("../../shared/array");
const combineApiRequests_1 = require("../../shared/combineApiRequests");
const combineCommandSequences_1 = require("../../shared/combineCommandSequences");
const i18n_1 = require("../../i18n");
const getApiMetrics_1 = require("../../shared/getApiMetrics");
const modes_1 = require("../../shared/modes");
const experiments_1 = require("../../shared/experiments");
const api_2 = require("../../shared/api");
// services
const UrlContentFetcher_1 = require("../../services/browser/UrlContentFetcher");
const BrowserSession_1 = require("../../services/browser/BrowserSession");
const McpServerManager_1 = require("../../services/mcp/McpServerManager");
// integrations
const DiffViewProvider_1 = require("../../integrations/editor/DiffViewProvider");
const export_markdown_1 = require("../../integrations/misc/export-markdown");
const TerminalRegistry_1 = require("../../integrations/terminal/TerminalRegistry");
// utils
const cost_1 = require("../../shared/cost");
const path_1 = require("../../utils/path");
const logger_1 = require("../../utils/logger");
// prompts
const responses_1 = require("../prompts/responses");
const system_1 = require("../prompts/system");
const native_tools_1 = require("../prompts/tools/native-tools");
const filter_tools_for_mode_1 = require("../prompts/tools/filter-tools-for-mode");
// core modules
const ToolRepetitionDetector_1 = require("../tools/ToolRepetitionDetector");
const UpdateTodoListTool_1 = require("../tools/UpdateTodoListTool");
const FileContextTracker_1 = require("../context-tracking/FileContextTracker");
const RooIgnoreController_1 = require("../ignore/RooIgnoreController");
const RooProtectedController_1 = require("../protect/RooProtectedController");
const assistant_message_1 = require("../assistant-message");
const AssistantMessageParser_1 = require("../assistant-message/AssistantMessageParser");
const NativeToolCallParser_1 = require("../assistant-message/NativeToolCallParser");
const context_management_1 = require("../context-management");
const multi_search_replace_1 = require("../diff/strategies/multi-search-replace");
const multi_file_search_replace_1 = require("../diff/strategies/multi-file-search-replace");
const task_persistence_1 = require("../task-persistence");
const getEnvironmentDetails_1 = require("../environment/getEnvironmentDetails");
const context_error_handling_1 = require("../context/context-management/context-error-handling");
const checkpoints_1 = require("../checkpoints");
const processUserContentMentions_1 = require("../mentions/processUserContentMentions");
const condense_1 = require("../condense");
const MessageQueueService_1 = require("../message-queue/MessageQueueService");
const auto_approval_1 = require("../auto-approval");
const MAX_EXPONENTIAL_BACKOFF_SECONDS = 600; // 10 minutes
const DEFAULT_USAGE_COLLECTION_TIMEOUT_MS = 5000; // 5 seconds
const FORCED_CONTEXT_REDUCTION_PERCENT = 75; // Keep 75% of context (remove 25%) on context window errors
const MAX_CONTEXT_WINDOW_RETRIES = 3; // Maximum retries for context window errors
class Task extends events_1.default {
    taskId;
    rootTaskId;
    parentTaskId;
    childTaskId;
    instanceId;
    metadata;
    todoList;
    rootTask = undefined;
    parentTask = undefined;
    taskNumber;
    workspacePath;
    /**
     * The mode associated with this task. Persisted across sessions
     * to maintain user context when reopening tasks from history.
     *
     * ## Lifecycle
     *
     * ### For new tasks:
     * 1. Initially `undefined` during construction
     * 2. Asynchronously initialized from provider state via `initializeTaskMode()`
     * 3. Falls back to `defaultModeSlug` if provider state is unavailable
     *
     * ### For history items:
     * 1. Immediately set from `historyItem.mode` during construction
     * 2. Falls back to `defaultModeSlug` if mode is not stored in history
     *
     * ## Important
     * This property should NOT be accessed directly until `taskModeReady` promise resolves.
     * Use `getTaskMode()` for async access or `taskMode` getter for sync access after initialization.
     *
     * @private
     * @see {@link getTaskMode} - For safe async access
     * @see {@link taskMode} - For sync access after initialization
     * @see {@link waitForModeInitialization} - To ensure initialization is complete
     */
    _taskMode;
    /**
     * Promise that resolves when the task mode has been initialized.
     * This ensures async mode initialization completes before the task is used.
     *
     * ## Purpose
     * - Prevents race conditions when accessing task mode
     * - Ensures provider state is properly loaded before mode-dependent operations
     * - Provides a synchronization point for async initialization
     *
     * ## Resolution timing
     * - For history items: Resolves immediately (sync initialization)
     * - For new tasks: Resolves after provider state is fetched (async initialization)
     *
     * @private
     * @see {@link waitForModeInitialization} - Public method to await this promise
     */
    taskModeReady;
    providerRef;
    globalStoragePath;
    abort = false;
    // TaskStatus
    idleAsk;
    resumableAsk;
    interactiveAsk;
    didFinishAbortingStream = false;
    abandoned = false;
    abortReason;
    isInitialized = false;
    isPaused = false;
    pausedModeSlug = modes_1.defaultModeSlug;
    pauseInterval;
    // API
    apiConfiguration;
    api;
    static lastGlobalApiRequestTime;
    autoApprovalHandler;
    /**
     * Reset the global API request timestamp. This should only be used for testing.
     * @internal
     */
    static resetGlobalApiRequestTime() {
        Task.lastGlobalApiRequestTime = undefined;
    }
    toolRepetitionDetector;
    rooIgnoreController;
    rooProtectedController;
    fileContextTracker;
    urlContentFetcher;
    terminalProcess;
    // Computer User
    browserSession;
    // Editing
    diffViewProvider;
    diffStrategy;
    diffEnabled = false;
    fuzzyMatchThreshold;
    didEditFile = false;
    // LLM Messages & Chat Messages
    apiConversationHistory = [];
    clineMessages = [];
    // Ask
    askResponse;
    askResponseText;
    askResponseImages;
    lastMessageTs;
    // Tool Use
    consecutiveMistakeCount = 0;
    consecutiveMistakeLimit;
    consecutiveMistakeCountForApplyDiff = new Map();
    toolUsage = {};
    // Checkpoints
    enableCheckpoints;
    checkpointTimeout;
    checkpointService;
    checkpointServiceInitializing = false;
    // Task Bridge
    enableBridge;
    // Message Queue Service
    messageQueueService;
    messageQueueStateChangedHandler;
    // Streaming
    isWaitingForFirstChunk = false;
    isStreaming = false;
    currentStreamingContentIndex = 0;
    currentStreamingDidCheckpoint = false;
    assistantMessageContent = [];
    presentAssistantMessageLocked = false;
    presentAssistantMessageHasPendingUpdates = false;
    userMessageContent = [];
    userMessageContentReady = false;
    didRejectTool = false;
    didAlreadyUseTool = false;
    didCompleteReadingStream = false;
    assistantMessageParser;
    // Token Usage Cache
    tokenUsageSnapshot;
    tokenUsageSnapshotAt;
    constructor({ provider, apiConfiguration, enableDiff = false, enableCheckpoints = true, checkpointTimeout = types_1.DEFAULT_CHECKPOINT_TIMEOUT_SECONDS, enableBridge = false, fuzzyMatchThreshold = 1.0, consecutiveMistakeLimit = types_1.DEFAULT_CONSECUTIVE_MISTAKE_LIMIT, task, images, historyItem, startTask = true, rootTask, parentTask, taskNumber = -1, onCreated, initialTodos, workspacePath, }) {
        super();
        if (startTask && !task && !images && !historyItem) {
            throw new Error("Either historyItem or task/images must be provided");
        }
        if (!checkpointTimeout ||
            checkpointTimeout > types_1.MAX_CHECKPOINT_TIMEOUT_SECONDS ||
            checkpointTimeout < types_1.MIN_CHECKPOINT_TIMEOUT_SECONDS) {
            throw new Error("checkpointTimeout must be between " +
                types_1.MIN_CHECKPOINT_TIMEOUT_SECONDS +
                " and " +
                types_1.MAX_CHECKPOINT_TIMEOUT_SECONDS +
                " seconds");
        }
        this.taskId = historyItem ? historyItem.id : crypto_1.default.randomUUID();
        this.rootTaskId = historyItem ? historyItem.rootTaskId : rootTask?.taskId;
        this.parentTaskId = historyItem ? historyItem.parentTaskId : parentTask?.taskId;
        this.childTaskId = undefined;
        this.metadata = {
            task: historyItem ? historyItem.task : task,
            images: historyItem ? [] : images,
        };
        // Normal use-case is usually retry similar history task with new workspace.
        this.workspacePath = parentTask
            ? parentTask.workspacePath
            : (workspacePath ?? (0, path_1.getWorkspacePath)(path.join(os_1.default.homedir(), "Desktop")));
        this.instanceId = crypto_1.default.randomUUID().slice(0, 8);
        this.taskNumber = -1;
        this.rooIgnoreController = new RooIgnoreController_1.RooIgnoreController(this.cwd);
        this.rooProtectedController = new RooProtectedController_1.RooProtectedController(this.cwd);
        this.fileContextTracker = new FileContextTracker_1.FileContextTracker(provider, this.taskId);
        this.rooIgnoreController.initialize().catch((error) => {
            console.error("Failed to initialize RooIgnoreController:", error);
        });
        this.apiConfiguration = apiConfiguration;
        this.api = (0, api_1.buildApiHandler)(apiConfiguration);
        this.autoApprovalHandler = new auto_approval_1.AutoApprovalHandler();
        this.urlContentFetcher = new UrlContentFetcher_1.UrlContentFetcher(provider.context);
        this.browserSession = new BrowserSession_1.BrowserSession(provider.context);
        this.diffEnabled = enableDiff;
        this.fuzzyMatchThreshold = fuzzyMatchThreshold;
        this.consecutiveMistakeLimit = consecutiveMistakeLimit ?? types_1.DEFAULT_CONSECUTIVE_MISTAKE_LIMIT;
        this.providerRef = new WeakRef(provider);
        this.globalStoragePath = provider.context.globalStorageUri.fsPath;
        this.diffViewProvider = new DiffViewProvider_1.DiffViewProvider(this.cwd, this);
        this.enableCheckpoints = enableCheckpoints;
        this.checkpointTimeout = checkpointTimeout;
        this.enableBridge = enableBridge;
        this.parentTask = parentTask;
        this.taskNumber = taskNumber;
        // Store the task's mode when it's created.
        // For history items, use the stored mode; for new tasks, we'll set it
        // after getting state.
        if (historyItem) {
            this._taskMode = historyItem.mode || modes_1.defaultModeSlug;
            this.taskModeReady = Promise.resolve();
            telemetry_1.TelemetryService.instance.captureTaskRestarted(this.taskId);
        }
        else {
            // For new tasks, don't set the mode yet - wait for async initialization.
            this._taskMode = undefined;
            this.taskModeReady = this.initializeTaskMode(provider);
            telemetry_1.TelemetryService.instance.captureTaskCreated(this.taskId);
        }
        // Initialize the assistant message parser only for XML protocol.
        // For native protocol, tool calls come as tool_call chunks, not XML.
        const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, this.api.getModel().info, this.apiConfiguration.apiProvider);
        this.assistantMessageParser = toolProtocol === "xml" ? new AssistantMessageParser_1.AssistantMessageParser() : undefined;
        this.messageQueueService = new MessageQueueService_1.MessageQueueService();
        this.messageQueueStateChangedHandler = () => {
            this.emit(types_1.RooCodeEventName.TaskUserMessage, this.taskId);
            this.providerRef.deref()?.postStateToWebview();
        };
        this.messageQueueService.on("stateChanged", this.messageQueueStateChangedHandler);
        // Only set up diff strategy if diff is enabled.
        if (this.diffEnabled) {
            // Default to old strategy, will be updated if experiment is enabled.
            this.diffStrategy = new multi_search_replace_1.MultiSearchReplaceDiffStrategy(this.fuzzyMatchThreshold);
            // Check experiment asynchronously and update strategy if needed.
            provider.getState().then((state) => {
                const isMultiFileApplyDiffEnabled = experiments_1.experiments.isEnabled(state.experiments ?? {}, experiments_1.EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF);
                if (isMultiFileApplyDiffEnabled) {
                    this.diffStrategy = new multi_file_search_replace_1.MultiFileSearchReplaceDiffStrategy(this.fuzzyMatchThreshold);
                }
            });
        }
        this.toolRepetitionDetector = new ToolRepetitionDetector_1.ToolRepetitionDetector(this.consecutiveMistakeLimit);
        // Initialize todo list if provided
        if (initialTodos && initialTodos.length > 0) {
            this.todoList = initialTodos;
        }
        onCreated?.(this);
        logger_1.logger.debug("Task created", {
            taskId: this.taskId,
            instanceId: this.instanceId,
            parentTaskId: this.parentTaskId,
            rootTaskId: this.rootTaskId,
            workspacePath: this.workspacePath,
            diffEnabled: this.diffEnabled,
            enableCheckpoints: this.enableCheckpoints,
            enableBridge: this.enableBridge,
        });
        if (startTask) {
            if (task || images) {
                this.startTask(task, images);
            }
            else if (historyItem) {
                this.resumeTaskFromHistory();
            }
            else {
                throw new Error("Either historyItem or task/images must be provided");
            }
        }
    }
    /**
     * Initialize the task mode from the provider state.
     * This method handles async initialization with proper error handling.
     *
     * ## Flow
     * 1. Attempts to fetch the current mode from provider state
     * 2. Sets `_taskMode` to the fetched mode or `defaultModeSlug` if unavailable
     * 3. Handles errors gracefully by falling back to default mode
     * 4. Logs any initialization errors for debugging
     *
     * ## Error handling
     * - Network failures when fetching provider state
     * - Provider not yet initialized
     * - Invalid state structure
     *
     * All errors result in fallback to `defaultModeSlug` to ensure task can proceed.
     *
     * @private
     * @param provider - The ClineProvider instance to fetch state from
     * @returns Promise that resolves when initialization is complete
     */
    async initializeTaskMode(provider) {
        try {
            const state = await provider.getState();
            this._taskMode = state?.mode || modes_1.defaultModeSlug;
        }
        catch (error) {
            // If there's an error getting state, use the default mode
            this._taskMode = modes_1.defaultModeSlug;
            // Use the provider's log method for better error visibility
            const errorMessage = `Failed to initialize task mode: ${error instanceof Error ? error.message : String(error)}`;
            provider.log(errorMessage);
        }
    }
    /**
     * Wait for the task mode to be initialized before proceeding.
     * This method ensures that any operations depending on the task mode
     * will have access to the correct mode value.
     *
     * ## When to use
     * - Before accessing mode-specific configurations
     * - When switching between tasks with different modes
     * - Before operations that depend on mode-based permissions
     *
     * ## Example usage
     * ```typescript
     * // Wait for mode initialization before mode-dependent operations
     * await task.waitForModeInitialization();
     * const mode = task.taskMode; // Now safe to access synchronously
     *
     * // Or use with getTaskMode() for a one-liner
     * const mode = await task.getTaskMode(); // Internally waits for initialization
     * ```
     *
     * @returns Promise that resolves when the task mode is initialized
     * @public
     */
    async waitForModeInitialization() {
        return this.taskModeReady;
    }
    /**
     * Get the task mode asynchronously, ensuring it's properly initialized.
     * This is the recommended way to access the task mode as it guarantees
     * the mode is available before returning.
     *
     * ## Async behavior
     * - Internally waits for `taskModeReady` promise to resolve
     * - Returns the initialized mode or `defaultModeSlug` as fallback
     * - Safe to call multiple times - subsequent calls return immediately if already initialized
     *
     * ## Example usage
     * ```typescript
     * // Safe async access
     * const mode = await task.getTaskMode();
     * console.log(`Task is running in ${mode} mode`);
     *
     * // Use in conditional logic
     * if (await task.getTaskMode() === 'architect') {
     *   // Perform architect-specific operations
     * }
     * ```
     *
     * @returns Promise resolving to the task mode string
     * @public
     */
    async getTaskMode() {
        await this.taskModeReady;
        return this._taskMode || modes_1.defaultModeSlug;
    }
    /**
     * Get the task mode synchronously. This should only be used when you're certain
     * that the mode has already been initialized (e.g., after waitForModeInitialization).
     *
     * ## When to use
     * - In synchronous contexts where async/await is not available
     * - After explicitly waiting for initialization via `waitForModeInitialization()`
     * - In event handlers or callbacks where mode is guaranteed to be initialized
     *
     * ## Example usage
     * ```typescript
     * // After ensuring initialization
     * await task.waitForModeInitialization();
     * const mode = task.taskMode; // Safe synchronous access
     *
     * // In an event handler after task is started
     * task.on('taskStarted', () => {
     *   console.log(`Task started in ${task.taskMode} mode`); // Safe here
     * });
     * ```
     *
     * @throws {Error} If the mode hasn't been initialized yet
     * @returns The task mode string
     * @public
     */
    get taskMode() {
        if (this._taskMode === undefined) {
            throw new Error("Task mode accessed before initialization. Use getTaskMode() or wait for taskModeReady.");
        }
        return this._taskMode;
    }
    static create(options) {
        const instance = new Task({ ...options, startTask: false });
        const { images, task, historyItem } = options;
        let promise;
        if (images || task) {
            promise = instance.startTask(task, images);
        }
        else if (historyItem) {
            promise = instance.resumeTaskFromHistory();
        }
        else {
            throw new Error("Either historyItem or task/images must be provided");
        }
        return [instance, promise];
    }
    // API Messages
    async getSavedApiConversationHistory() {
        return (0, task_persistence_1.readApiMessages)({ taskId: this.taskId, globalStoragePath: this.globalStoragePath });
    }
    async addToApiConversationHistory(message) {
        // Capture the encrypted_content from the provider (e.g., OpenAI Responses API) if present.
        // We only persist data reported by the current response body.
        const handler = this.api;
        if (message.role === "assistant") {
            const responseId = handler.getResponseId?.();
            const reasoningData = handler.getEncryptedContent?.();
            // Start from the original assistant message
            const messageWithTs = {
                ...message,
                ...(responseId ? { id: responseId } : {}),
                ts: Date.now(),
            };
            // If we have encrypted_content, embed it as the first content block on the assistant message.
            // This keeps reasoning + assistant atomic for context management while still allowing providers
            // to receive a separate reasoning item when we build the request.
            if (reasoningData?.encrypted_content) {
                const reasoningBlock = {
                    type: "reasoning",
                    summary: [],
                    encrypted_content: reasoningData.encrypted_content,
                    ...(reasoningData.id ? { id: reasoningData.id } : {}),
                };
                if (typeof messageWithTs.content === "string") {
                    messageWithTs.content = [
                        reasoningBlock,
                        { type: "text", text: messageWithTs.content },
                    ];
                }
                else if (Array.isArray(messageWithTs.content)) {
                    messageWithTs.content = [reasoningBlock, ...messageWithTs.content];
                }
                else if (!messageWithTs.content) {
                    messageWithTs.content = [reasoningBlock];
                }
            }
            this.apiConversationHistory.push(messageWithTs);
        }
        else {
            const messageWithTs = { ...message, ts: Date.now() };
            this.apiConversationHistory.push(messageWithTs);
        }
        await this.saveApiConversationHistory();
    }
    async overwriteApiConversationHistory(newHistory) {
        this.apiConversationHistory = newHistory;
        await this.saveApiConversationHistory();
    }
    async saveApiConversationHistory() {
        try {
            await (0, task_persistence_1.saveApiMessages)({
                messages: this.apiConversationHistory,
                taskId: this.taskId,
                globalStoragePath: this.globalStoragePath,
            });
        }
        catch (error) {
            // In the off chance this fails, we don't want to stop the task.
            console.error("Failed to save API conversation history:", error);
        }
    }
    // Cline Messages
    async getSavedClineMessages() {
        return (0, task_persistence_1.readTaskMessages)({ taskId: this.taskId, globalStoragePath: this.globalStoragePath });
    }
    async addToClineMessages(message) {
        this.clineMessages.push(message);
        const provider = this.providerRef.deref();
        await provider?.postStateToWebview();
        this.emit(types_1.RooCodeEventName.Message, { action: "created", message });
        await this.saveClineMessages();
        const shouldCaptureMessage = message.partial !== true && cloud_1.CloudService.isEnabled();
        if (shouldCaptureMessage) {
            cloud_1.CloudService.instance.captureEvent({
                event: types_1.TelemetryEventName.TASK_MESSAGE,
                properties: { taskId: this.taskId, message },
            });
        }
    }
    async overwriteClineMessages(newMessages) {
        this.clineMessages = newMessages;
        (0, UpdateTodoListTool_1.restoreTodoListForTask)(this);
        await this.saveClineMessages();
    }
    async updateClineMessage(message) {
        const provider = this.providerRef.deref();
        await provider?.postMessageToWebview({ type: "messageUpdated", clineMessage: message });
        this.emit(types_1.RooCodeEventName.Message, { action: "updated", message });
        const shouldCaptureMessage = message.partial !== true && cloud_1.CloudService.isEnabled();
        if (shouldCaptureMessage) {
            cloud_1.CloudService.instance.captureEvent({
                event: types_1.TelemetryEventName.TASK_MESSAGE,
                properties: { taskId: this.taskId, message },
            });
        }
    }
    async saveClineMessages() {
        try {
            await (0, task_persistence_1.saveTaskMessages)({
                messages: this.clineMessages,
                taskId: this.taskId,
                globalStoragePath: this.globalStoragePath,
            });
            const { historyItem, tokenUsage } = await (0, task_persistence_1.taskMetadata)({
                taskId: this.taskId,
                rootTaskId: this.rootTaskId,
                parentTaskId: this.parentTaskId,
                taskNumber: this.taskNumber,
                messages: this.clineMessages,
                globalStoragePath: this.globalStoragePath,
                workspace: this.cwd,
                mode: this._taskMode || modes_1.defaultModeSlug, // Use the task's own mode, not the current provider mode.
            });
            if ((0, getApiMetrics_1.hasTokenUsageChanged)(tokenUsage, this.tokenUsageSnapshot)) {
                this.emit(types_1.RooCodeEventName.TaskTokenUsageUpdated, this.taskId, tokenUsage);
                this.tokenUsageSnapshot = undefined;
                this.tokenUsageSnapshotAt = undefined;
            }
            await this.providerRef.deref()?.updateTaskHistory(historyItem);
        }
        catch (error) {
            console.error("Failed to save Roo messages:", error);
        }
    }
    findMessageByTimestamp(ts) {
        for (let i = this.clineMessages.length - 1; i >= 0; i--) {
            if (this.clineMessages[i].ts === ts) {
                return this.clineMessages[i];
            }
        }
        return undefined;
    }
    // Note that `partial` has three valid states true (partial message),
    // false (completion of partial message), undefined (individual complete
    // message).
    async ask(type, text, partial, progressStatus, isProtected) {
        // If this Cline instance was aborted by the provider, then the only
        // thing keeping us alive is a promise still running in the background,
        // in which case we don't want to send its result to the webview as it
        // is attached to a new instance of Cline now. So we can safely ignore
        // the result of any active promises, and this class will be
        // deallocated. (Although we set Cline = undefined in provider, that
        // simply removes the reference to this instance, but the instance is
        // still alive until this promise resolves or rejects.)
        if (this.abort) {
            throw new Error(`[RooCode#ask] task ${this.taskId}.${this.instanceId} aborted`);
        }
        let askTs;
        if (partial !== undefined) {
            const lastMessage = this.clineMessages.at(-1);
            const isUpdatingPreviousPartial = lastMessage && lastMessage.partial && lastMessage.type === "ask" && lastMessage.ask === type;
            if (partial) {
                if (isUpdatingPreviousPartial) {
                    // Existing partial message, so update it.
                    lastMessage.text = text;
                    lastMessage.partial = partial;
                    lastMessage.progressStatus = progressStatus;
                    lastMessage.isProtected = isProtected;
                    // TODO: Be more efficient about saving and posting only new
                    // data or one whole message at a time so ignore partial for
                    // saves, and only post parts of partial message instead of
                    // whole array in new listener.
                    this.updateClineMessage(lastMessage);
                    // console.log("Task#ask: current ask promise was ignored (#1)")
                    throw new Error("Current ask promise was ignored (#1)");
                }
                else {
                    // This is a new partial message, so add it with partial
                    // state.
                    askTs = Date.now();
                    this.lastMessageTs = askTs;
                    console.log(`Task#ask: new partial ask -> ${type} @ ${askTs}`);
                    await this.addToClineMessages({ ts: askTs, type: "ask", ask: type, text, partial, isProtected });
                    // console.log("Task#ask: current ask promise was ignored (#2)")
                    throw new Error("Current ask promise was ignored (#2)");
                }
            }
            else {
                if (isUpdatingPreviousPartial) {
                    // This is the complete version of a previously partial
                    // message, so replace the partial with the complete version.
                    this.askResponse = undefined;
                    this.askResponseText = undefined;
                    this.askResponseImages = undefined;
                    // Bug for the history books:
                    // In the webview we use the ts as the chatrow key for the
                    // virtuoso list. Since we would update this ts right at the
                    // end of streaming, it would cause the view to flicker. The
                    // key prop has to be stable otherwise react has trouble
                    // reconciling items between renders, causing unmounting and
                    // remounting of components (flickering).
                    // The lesson here is if you see flickering when rendering
                    // lists, it's likely because the key prop is not stable.
                    // So in this case we must make sure that the message ts is
                    // never altered after first setting it.
                    askTs = lastMessage.ts;
                    console.log(`Task#ask: updating previous partial ask -> ${type} @ ${askTs}`);
                    this.lastMessageTs = askTs;
                    lastMessage.text = text;
                    lastMessage.partial = false;
                    lastMessage.progressStatus = progressStatus;
                    lastMessage.isProtected = isProtected;
                    await this.saveClineMessages();
                    this.updateClineMessage(lastMessage);
                }
                else {
                    // This is a new and complete message, so add it like normal.
                    this.askResponse = undefined;
                    this.askResponseText = undefined;
                    this.askResponseImages = undefined;
                    askTs = Date.now();
                    console.log(`Task#ask: new complete ask -> ${type} @ ${askTs}`);
                    this.lastMessageTs = askTs;
                    await this.addToClineMessages({ ts: askTs, type: "ask", ask: type, text, isProtected });
                }
            }
        }
        else {
            // This is a new non-partial message, so add it like normal.
            this.askResponse = undefined;
            this.askResponseText = undefined;
            this.askResponseImages = undefined;
            askTs = Date.now();
            console.log(`Task#ask: new complete ask -> ${type} @ ${askTs}`);
            this.lastMessageTs = askTs;
            await this.addToClineMessages({ ts: askTs, type: "ask", ask: type, text, isProtected });
        }
        let timeouts = [];
        // Automatically approve if the ask according to the user's settings.
        const provider = this.providerRef.deref();
        const state = provider ? await provider.getState() : undefined;
        const approval = await (0, auto_approval_1.checkAutoApproval)({ state, ask: type, text, isProtected });
        if (approval.decision === "approve") {
            this.approveAsk();
        }
        else if (approval.decision === "deny") {
            this.denyAsk();
        }
        else if (approval.decision === "timeout") {
            timeouts.push(setTimeout(() => {
                const { askResponse, text, images } = approval.fn();
                this.handleWebviewAskResponse(askResponse, text, images);
            }, approval.timeout));
        }
        // The state is mutable if the message is complete and the task will
        // block (via the `pWaitFor`).
        const isBlocking = !(this.askResponse !== undefined || this.lastMessageTs !== askTs);
        const isMessageQueued = !this.messageQueueService.isEmpty();
        const isStatusMutable = !partial && isBlocking && !isMessageQueued && approval.decision === "ask";
        if (isBlocking) {
            console.log(`Task#ask will block -> type: ${type}`);
        }
        if (isStatusMutable) {
            console.log(`Task#ask: status is mutable -> type: ${type}`);
            const statusMutationTimeout = 2_000;
            if ((0, types_1.isInteractiveAsk)(type)) {
                timeouts.push(setTimeout(() => {
                    const message = this.findMessageByTimestamp(askTs);
                    if (message) {
                        this.interactiveAsk = message;
                        this.emit(types_1.RooCodeEventName.TaskInteractive, this.taskId);
                        provider?.postMessageToWebview({ type: "interactionRequired" });
                    }
                }, statusMutationTimeout));
            }
            else if ((0, types_1.isResumableAsk)(type)) {
                timeouts.push(setTimeout(() => {
                    const message = this.findMessageByTimestamp(askTs);
                    if (message) {
                        this.resumableAsk = message;
                        this.emit(types_1.RooCodeEventName.TaskResumable, this.taskId);
                    }
                }, statusMutationTimeout));
            }
            else if ((0, types_1.isIdleAsk)(type)) {
                timeouts.push(setTimeout(() => {
                    const message = this.findMessageByTimestamp(askTs);
                    if (message) {
                        this.idleAsk = message;
                        this.emit(types_1.RooCodeEventName.TaskIdle, this.taskId);
                    }
                }, statusMutationTimeout));
            }
        }
        else if (isMessageQueued) {
            console.log(`Task#ask: will process message queue -> type: ${type}`);
            const message = this.messageQueueService.dequeueMessage();
            if (message) {
                // Check if this is a tool approval ask that needs to be handled.
                if (type === "tool" ||
                    type === "command" ||
                    type === "browser_action_launch" ||
                    type === "use_mcp_server") {
                    // For tool approvals, we need to approve first, then send
                    // the message if there's text/images.
                    this.handleWebviewAskResponse("yesButtonClicked", message.text, message.images);
                }
                else {
                    // For other ask types (like followup or command_output), fulfill the ask
                    // directly.
                    this.handleWebviewAskResponse("messageResponse", message.text, message.images);
                }
            }
        }
        // Wait for askResponse to be set
        await (0, p_wait_for_1.default)(() => this.askResponse !== undefined || this.lastMessageTs !== askTs, { interval: 100 });
        if (this.lastMessageTs !== askTs) {
            // Could happen if we send multiple asks in a row i.e. with
            // command_output. It's important that when we know an ask could
            // fail, it is handled gracefully.
            console.log("Task#ask: current ask promise was ignored");
            throw new Error("Current ask promise was ignored");
        }
        const result = { response: this.askResponse, text: this.askResponseText, images: this.askResponseImages };
        this.askResponse = undefined;
        this.askResponseText = undefined;
        this.askResponseImages = undefined;
        // Cancel the timeouts if they are still running.
        timeouts.forEach((timeout) => clearTimeout(timeout));
        // Switch back to an active state.
        if (this.idleAsk || this.resumableAsk || this.interactiveAsk) {
            this.idleAsk = undefined;
            this.resumableAsk = undefined;
            this.interactiveAsk = undefined;
            this.emit(types_1.RooCodeEventName.TaskActive, this.taskId);
        }
        this.emit(types_1.RooCodeEventName.TaskAskResponded);
        return result;
    }
    handleWebviewAskResponse(askResponse, text, images) {
        this.askResponse = askResponse;
        this.askResponseText = text;
        this.askResponseImages = images;
        // Create a checkpoint whenever the user sends a message.
        // Use allowEmpty=true to ensure a checkpoint is recorded even if there are no file changes.
        // Suppress the checkpoint_saved chat row for this particular checkpoint to keep the timeline clean.
        if (askResponse === "messageResponse") {
            void this.checkpointSave(false, true);
        }
        // Mark the last follow-up question as answered
        if (askResponse === "messageResponse" || askResponse === "yesButtonClicked") {
            // Find the last unanswered follow-up message using findLastIndex
            const lastFollowUpIndex = (0, array_1.findLastIndex)(this.clineMessages, (msg) => msg.type === "ask" && msg.ask === "followup" && !msg.isAnswered);
            if (lastFollowUpIndex !== -1) {
                // Mark this follow-up as answered
                this.clineMessages[lastFollowUpIndex].isAnswered = true;
                // Save the updated messages
                this.saveClineMessages().catch((error) => {
                    console.error("Failed to save answered follow-up state:", error);
                });
            }
        }
    }
    approveAsk({ text, images } = {}) {
        this.handleWebviewAskResponse("yesButtonClicked", text, images);
    }
    denyAsk({ text, images } = {}) {
        this.handleWebviewAskResponse("noButtonClicked", text, images);
    }
    async submitUserMessage(text, images, mode, providerProfile) {
        try {
            text = (text ?? "").trim();
            images = images ?? [];
            if (text.length === 0 && images.length === 0) {
                return;
            }
            const provider = this.providerRef.deref();
            if (provider) {
                if (mode) {
                    await provider.setMode(mode);
                }
                if (providerProfile) {
                    await provider.setProviderProfile(providerProfile);
                }
                this.emit(types_1.RooCodeEventName.TaskUserMessage, this.taskId);
                provider.postMessageToWebview({ type: "invoke", invoke: "sendMessage", text, images });
            }
            else {
                console.error("[Task#submitUserMessage] Provider reference lost");
            }
        }
        catch (error) {
            console.error("[Task#submitUserMessage] Failed to submit user message:", error);
        }
    }
    async handleTerminalOperation(terminalOperation) {
        if (terminalOperation === "continue") {
            this.terminalProcess?.continue();
        }
        else if (terminalOperation === "abort") {
            this.terminalProcess?.abort();
        }
    }
    async condenseContext() {
        const systemPrompt = await this.getSystemPrompt();
        // Get condensing configuration
        const state = await this.providerRef.deref()?.getState();
        // These properties may not exist in the state type yet, but are used for condensing configuration
        const customCondensingPrompt = state?.customCondensingPrompt;
        const condensingApiConfigId = state?.condensingApiConfigId;
        const listApiConfigMeta = state?.listApiConfigMeta;
        // Determine API handler to use
        let condensingApiHandler;
        if (condensingApiConfigId && listApiConfigMeta && Array.isArray(listApiConfigMeta)) {
            // Find matching config by ID
            const matchingConfig = listApiConfigMeta.find((config) => config.id === condensingApiConfigId);
            if (matchingConfig) {
                const profile = await this.providerRef.deref()?.providerSettingsManager.getProfile({
                    id: condensingApiConfigId,
                });
                // Ensure profile and apiProvider exist before trying to build handler
                if (profile && profile.apiProvider) {
                    condensingApiHandler = (0, api_1.buildApiHandler)(profile);
                }
            }
        }
        const { contextTokens: prevContextTokens } = this.getTokenUsage();
        const { messages, summary, cost, newContextTokens = 0, error, } = await (0, condense_1.summarizeConversation)(this.apiConversationHistory, this.api, // Main API handler (fallback)
        systemPrompt, // Default summarization prompt (fallback)
        this.taskId, prevContextTokens, false, // manual trigger
        customCondensingPrompt, // User's custom prompt
        condensingApiHandler);
        if (error) {
            this.say("condense_context_error", error, undefined /* images */, false /* partial */, undefined /* checkpoint */, undefined /* progressStatus */, { isNonInteractive: true } /* options */);
            return;
        }
        await this.overwriteApiConversationHistory(messages);
        const contextCondense = { summary, cost, newContextTokens, prevContextTokens };
        await this.say("condense_context", undefined /* text */, undefined /* images */, false /* partial */, undefined /* checkpoint */, undefined /* progressStatus */, { isNonInteractive: true } /* options */, contextCondense);
        // Process any queued messages after condensing completes
        this.processQueuedMessages();
    }
    async say(type, text, images, partial, checkpoint, progressStatus, options = {}, contextCondense) {
        if (this.abort) {
            throw new Error(`[RooCode#say] task ${this.taskId}.${this.instanceId} aborted`);
        }
        if (partial !== undefined) {
            const lastMessage = this.clineMessages.at(-1);
            const isUpdatingPreviousPartial = lastMessage && lastMessage.partial && lastMessage.type === "say" && lastMessage.say === type;
            if (partial) {
                if (isUpdatingPreviousPartial) {
                    // Existing partial message, so update it.
                    lastMessage.text = text;
                    lastMessage.images = images;
                    lastMessage.partial = partial;
                    lastMessage.progressStatus = progressStatus;
                    this.updateClineMessage(lastMessage);
                }
                else {
                    // This is a new partial message, so add it with partial state.
                    const sayTs = Date.now();
                    if (!options.isNonInteractive) {
                        this.lastMessageTs = sayTs;
                    }
                    await this.addToClineMessages({
                        ts: sayTs,
                        type: "say",
                        say: type,
                        text,
                        images,
                        partial,
                        contextCondense,
                    });
                }
            }
            else {
                // New now have a complete version of a previously partial message.
                // This is the complete version of a previously partial
                // message, so replace the partial with the complete version.
                if (isUpdatingPreviousPartial) {
                    if (!options.isNonInteractive) {
                        this.lastMessageTs = lastMessage.ts;
                    }
                    lastMessage.text = text;
                    lastMessage.images = images;
                    lastMessage.partial = false;
                    lastMessage.progressStatus = progressStatus;
                    // Instead of streaming partialMessage events, we do a save
                    // and post like normal to persist to disk.
                    await this.saveClineMessages();
                    // More performant than an entire `postStateToWebview`.
                    this.updateClineMessage(lastMessage);
                }
                else {
                    // This is a new and complete message, so add it like normal.
                    const sayTs = Date.now();
                    if (!options.isNonInteractive) {
                        this.lastMessageTs = sayTs;
                    }
                    await this.addToClineMessages({
                        ts: sayTs,
                        type: "say",
                        say: type,
                        text,
                        images,
                        contextCondense,
                    });
                }
            }
        }
        else {
            // This is a new non-partial message, so add it like normal.
            const sayTs = Date.now();
            // A "non-interactive" message is a message is one that the user
            // does not need to respond to. We don't want these message types
            // to trigger an update to `lastMessageTs` since they can be created
            // asynchronously and could interrupt a pending ask.
            if (!options.isNonInteractive) {
                this.lastMessageTs = sayTs;
            }
            await this.addToClineMessages({
                ts: sayTs,
                type: "say",
                say: type,
                text,
                images,
                checkpoint,
                contextCondense,
            });
        }
    }
    async sayAndCreateMissingParamError(toolName, paramName, relPath) {
        await this.say("error", `Roo tried to use ${toolName}${relPath ? ` for '${relPath.toPosix()}'` : ""} without value for required parameter '${paramName}'. Retrying...`);
        const modelInfo = this.api.getModel().info;
        const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, modelInfo, this.apiConfiguration.apiProvider);
        return responses_1.formatResponse.toolError(responses_1.formatResponse.missingToolParameterError(paramName, toolProtocol));
    }
    // Lifecycle
    // Start / Resume / Abort / Dispose
    async startTask(task, images) {
        if (this.enableBridge) {
            try {
                await cloud_1.BridgeOrchestrator.subscribeToTask(this);
            }
            catch (error) {
                console.error(`[Task#startTask] BridgeOrchestrator.subscribeToTask() failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // `conversationHistory` (for API) and `clineMessages` (for webview)
        // need to be in sync.
        // If the extension process were killed, then on restart the
        // `clineMessages` might not be empty, so we need to set it to [] when
        // we create a new Cline client (otherwise webview would show stale
        // messages from previous session).
        this.clineMessages = [];
        this.apiConversationHistory = [];
        // The todo list is already set in the constructor if initialTodos were provided
        // No need to add any messages - the todoList property is already set
        await this.providerRef.deref()?.postStateToWebview();
        await this.say("text", task, images);
        this.isInitialized = true;
        let imageBlocks = responses_1.formatResponse.imageBlocks(images);
        // Task starting
        await this.initiateTaskLoop([
            {
                type: "text",
                text: `<task>\n${task}\n</task>`,
            },
            ...imageBlocks,
        ]);
    }
    async resumeTaskFromHistory() {
        if (this.enableBridge) {
            try {
                await cloud_1.BridgeOrchestrator.subscribeToTask(this);
            }
            catch (error) {
                console.error(`[Task#resumeTaskFromHistory] BridgeOrchestrator.subscribeToTask() failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const modifiedClineMessages = await this.getSavedClineMessages();
        // Remove any resume messages that may have been added before.
        const lastRelevantMessageIndex = (0, array_1.findLastIndex)(modifiedClineMessages, (m) => !(m.ask === "resume_task" || m.ask === "resume_completed_task"));
        if (lastRelevantMessageIndex !== -1) {
            modifiedClineMessages.splice(lastRelevantMessageIndex + 1);
        }
        // Remove any trailing reasoning-only UI messages that were not part of the persisted API conversation
        while (modifiedClineMessages.length > 0) {
            const last = modifiedClineMessages[modifiedClineMessages.length - 1];
            if (last.type === "say" && last.say === "reasoning") {
                modifiedClineMessages.pop();
            }
            else {
                break;
            }
        }
        // Since we don't use `api_req_finished` anymore, we need to check if the
        // last `api_req_started` has a cost value, if it doesn't and no
        // cancellation reason to present, then we remove it since it indicates
        // an api request without any partial content streamed.
        const lastApiReqStartedIndex = (0, array_1.findLastIndex)(modifiedClineMessages, (m) => m.type === "say" && m.say === "api_req_started");
        if (lastApiReqStartedIndex !== -1) {
            const lastApiReqStarted = modifiedClineMessages[lastApiReqStartedIndex];
            const { cost, cancelReason } = JSON.parse(lastApiReqStarted.text || "{}");
            if (cost === undefined && cancelReason === undefined) {
                modifiedClineMessages.splice(lastApiReqStartedIndex, 1);
            }
        }
        await this.overwriteClineMessages(modifiedClineMessages);
        this.clineMessages = await this.getSavedClineMessages();
        // Now present the cline messages to the user and ask if they want to
        // resume (NOTE: we ran into a bug before where the
        // apiConversationHistory wouldn't be initialized when opening a old
        // task, and it was because we were waiting for resume).
        // This is important in case the user deletes messages without resuming
        // the task first.
        this.apiConversationHistory = await this.getSavedApiConversationHistory();
        const lastClineMessage = this.clineMessages
            .slice()
            .reverse()
            .find((m) => !(m.ask === "resume_task" || m.ask === "resume_completed_task")); // Could be multiple resume tasks.
        let askType;
        if (lastClineMessage?.ask === "completion_result") {
            askType = "resume_completed_task";
        }
        else {
            askType = "resume_task";
        }
        this.isInitialized = true;
        const { response, text, images } = await this.ask(askType); // Calls `postStateToWebview`.
        let responseText;
        let responseImages;
        if (response === "messageResponse") {
            await this.say("user_feedback", text, images);
            responseText = text;
            responseImages = images;
        }
        // Make sure that the api conversation history can be resumed by the API,
        // even if it goes out of sync with cline messages.
        let existingApiConversationHistory = await this.getSavedApiConversationHistory();
        // v2.0 xml tags refactor caveat: since we don't use tools anymore, we need to replace all tool use blocks with a text block since the API disallows conversations with tool uses and no tool schema
        // Now also protocol-aware: format according to current protocol setting
        const protocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, this.api.getModel().info, this.apiConfiguration.apiProvider);
        const useNative = (0, types_1.isNativeProtocol)(protocol);
        const conversationWithoutToolBlocks = existingApiConversationHistory.map((message) => {
            if (Array.isArray(message.content)) {
                const newContent = message.content.map((block) => {
                    if (block.type === "tool_use") {
                        // Format tool invocation based on protocol
                        const params = block.input;
                        const formattedText = (0, toolResultFormatting_1.formatToolInvocation)(block.name, params, protocol);
                        return {
                            type: "text",
                            text: formattedText,
                        };
                    }
                    else if (block.type === "tool_result") {
                        // Convert block.content to text block array, removing images
                        const contentAsTextBlocks = Array.isArray(block.content)
                            ? block.content.filter((item) => item.type === "text")
                            : [{ type: "text", text: block.content }];
                        const textContent = contentAsTextBlocks.map((item) => item.text).join("\n\n");
                        const toolName = (0, export_markdown_1.findToolName)(block.tool_use_id, existingApiConversationHistory);
                        return {
                            type: "text",
                            text: `[${toolName} Result]\n\n${textContent}`,
                        };
                    }
                    return block;
                });
                return { ...message, content: newContent };
            }
            return message;
        });
        existingApiConversationHistory = conversationWithoutToolBlocks;
        // FIXME: remove tool use blocks altogether
        // if the last message is an assistant message, we need to check if there's tool use since every tool use has to have a tool response
        // if there's no tool use and only a text block, then we can just add a user message
        // (note this isn't relevant anymore since we use custom tool prompts instead of tool use blocks, but this is here for legacy purposes in case users resume old tasks)
        // if the last message is a user message, we can need to get the assistant message before it to see if it made tool calls, and if so, fill in the remaining tool responses with 'interrupted'
        let modifiedOldUserContent; // either the last message if its user message, or the user message before the last (assistant) message
        let modifiedApiConversationHistory; // need to remove the last user message to replace with new modified user message
        if (existingApiConversationHistory.length > 0) {
            const lastMessage = existingApiConversationHistory[existingApiConversationHistory.length - 1];
            if (lastMessage.role === "assistant") {
                const content = Array.isArray(lastMessage.content)
                    ? lastMessage.content
                    : [{ type: "text", text: lastMessage.content }];
                const hasToolUse = content.some((block) => block.type === "tool_use");
                if (hasToolUse) {
                    const toolUseBlocks = content.filter((block) => block.type === "tool_use");
                    const toolResponses = toolUseBlocks.map((block) => ({
                        type: "tool_result",
                        tool_use_id: block.id,
                        content: "Task was interrupted before this tool call could be completed.",
                    }));
                    modifiedApiConversationHistory = [...existingApiConversationHistory]; // no changes
                    modifiedOldUserContent = [...toolResponses];
                }
                else {
                    modifiedApiConversationHistory = [...existingApiConversationHistory];
                    modifiedOldUserContent = [];
                }
            }
            else if (lastMessage.role === "user") {
                const previousAssistantMessage = existingApiConversationHistory[existingApiConversationHistory.length - 2];
                const existingUserContent = Array.isArray(lastMessage.content)
                    ? lastMessage.content
                    : [{ type: "text", text: lastMessage.content }];
                if (previousAssistantMessage && previousAssistantMessage.role === "assistant") {
                    const assistantContent = Array.isArray(previousAssistantMessage.content)
                        ? previousAssistantMessage.content
                        : [{ type: "text", text: previousAssistantMessage.content }];
                    const toolUseBlocks = assistantContent.filter((block) => block.type === "tool_use");
                    if (toolUseBlocks.length > 0) {
                        const existingToolResults = existingUserContent.filter((block) => block.type === "tool_result");
                        const missingToolResponses = toolUseBlocks
                            .filter((toolUse) => !existingToolResults.some((result) => result.tool_use_id === toolUse.id))
                            .map((toolUse) => ({
                            type: "tool_result",
                            tool_use_id: toolUse.id,
                            content: "Task was interrupted before this tool call could be completed.",
                        }));
                        modifiedApiConversationHistory = existingApiConversationHistory.slice(0, -1); // removes the last user message
                        modifiedOldUserContent = [...existingUserContent, ...missingToolResponses];
                    }
                    else {
                        modifiedApiConversationHistory = existingApiConversationHistory.slice(0, -1);
                        modifiedOldUserContent = [...existingUserContent];
                    }
                }
                else {
                    modifiedApiConversationHistory = existingApiConversationHistory.slice(0, -1);
                    modifiedOldUserContent = [...existingUserContent];
                }
            }
            else {
                throw new Error("Unexpected: Last message is not a user or assistant message");
            }
        }
        else {
            throw new Error("Unexpected: No existing API conversation history");
        }
        let newUserContent = [...modifiedOldUserContent];
        const agoText = (() => {
            const timestamp = lastClineMessage?.ts ?? Date.now();
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            if (days > 0) {
                return `${days} day${days > 1 ? "s" : ""} ago`;
            }
            if (hours > 0) {
                return `${hours} hour${hours > 1 ? "s" : ""} ago`;
            }
            if (minutes > 0) {
                return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
            }
            return "just now";
        })();
        if (responseText) {
            newUserContent.push({
                type: "text",
                text: `\n\nNew instructions for task continuation:\n<user_message>\n${responseText}\n</user_message>`,
            });
        }
        if (responseImages && responseImages.length > 0) {
            newUserContent.push(...responses_1.formatResponse.imageBlocks(responseImages));
        }
        // Ensure we have at least some content to send to the API.
        // If newUserContent is empty, add a minimal resumption message.
        if (newUserContent.length === 0) {
            newUserContent.push({
                type: "text",
                text: "[TASK RESUMPTION] Resuming task...",
            });
        }
        await this.overwriteApiConversationHistory(modifiedApiConversationHistory);
        // Task resuming from history item.
        await this.initiateTaskLoop(newUserContent);
    }
    async abortTask(isAbandoned = false) {
        // Aborting task
        // Will stop any autonomously running promises.
        if (isAbandoned) {
            this.abandoned = true;
        }
        this.abort = true;
        this.emit(types_1.RooCodeEventName.TaskAborted);
        try {
            this.dispose(); // Call the centralized dispose method
        }
        catch (error) {
            console.error(`Error during task ${this.taskId}.${this.instanceId} disposal:`, error);
            // Don't rethrow - we want abort to always succeed
        }
        // Save the countdown message in the automatic retry or other content.
        try {
            // Save the countdown message in the automatic retry or other content.
            await this.saveClineMessages();
        }
        catch (error) {
            console.error(`Error saving messages during abort for task ${this.taskId}.${this.instanceId}:`, error);
        }
    }
    dispose() {
        console.log(`[Task#dispose] disposing task ${this.taskId}.${this.instanceId}`);
        // Dispose message queue and remove event listeners.
        try {
            if (this.messageQueueStateChangedHandler) {
                this.messageQueueService.removeListener("stateChanged", this.messageQueueStateChangedHandler);
                this.messageQueueStateChangedHandler = undefined;
            }
            this.messageQueueService.dispose();
        }
        catch (error) {
            console.error("Error disposing message queue:", error);
        }
        // Remove all event listeners to prevent memory leaks.
        try {
            this.removeAllListeners();
        }
        catch (error) {
            console.error("Error removing event listeners:", error);
        }
        // Stop waiting for child task completion.
        if (this.pauseInterval) {
            clearInterval(this.pauseInterval);
            this.pauseInterval = undefined;
        }
        if (this.enableBridge) {
            cloud_1.BridgeOrchestrator.getInstance()
                ?.unsubscribeFromTask(this.taskId)
                .catch((error) => console.error(`[Task#dispose] BridgeOrchestrator#unsubscribeFromTask() failed: ${error instanceof Error ? error.message : String(error)}`));
        }
        // Release any terminals associated with this task.
        try {
            // Release any terminals associated with this task.
            TerminalRegistry_1.TerminalRegistry.releaseTerminalsForTask(this.taskId);
        }
        catch (error) {
            console.error("Error releasing terminals:", error);
        }
        try {
            this.urlContentFetcher.closeBrowser();
        }
        catch (error) {
            console.error("Error closing URL content fetcher browser:", error);
        }
        try {
            this.browserSession.closeBrowser();
        }
        catch (error) {
            console.error("Error closing browser session:", error);
        }
        try {
            if (this.rooIgnoreController) {
                this.rooIgnoreController.dispose();
                this.rooIgnoreController = undefined;
            }
        }
        catch (error) {
            console.error("Error disposing RooIgnoreController:", error);
            // This is the critical one for the leak fix.
        }
        try {
            this.fileContextTracker.dispose();
        }
        catch (error) {
            console.error("Error disposing file context tracker:", error);
        }
        try {
            // If we're not streaming then `abortStream` won't be called.
            if (this.isStreaming && this.diffViewProvider.isEditing) {
                this.diffViewProvider.revertChanges().catch(console.error);
            }
        }
        catch (error) {
            console.error("Error reverting diff changes:", error);
        }
    }
    // Subtasks
    // Spawn / Wait / Complete
    async startSubtask(message, initialTodos, mode) {
        const provider = this.providerRef.deref();
        if (!provider) {
            throw new Error("Provider not available");
        }
        const newTask = await provider.createTask(message, undefined, this, { initialTodos });
        if (newTask) {
            this.isPaused = true; // Pause parent.
            this.childTaskId = newTask.taskId;
            await provider.handleModeSwitch(mode); // Set child's mode.
            await (0, delay_1.default)(500); // Allow mode change to take effect.
            this.emit(types_1.RooCodeEventName.TaskPaused, this.taskId);
            this.emit(types_1.RooCodeEventName.TaskSpawned, newTask.taskId);
        }
        return newTask;
    }
    // Used when a sub-task is launched and the parent task is waiting for it to
    // finish.
    // TBD: Add a timeout to prevent infinite waiting.
    async waitForSubtask() {
        await new Promise((resolve) => {
            this.pauseInterval = setInterval(() => {
                if (!this.isPaused) {
                    clearInterval(this.pauseInterval);
                    this.pauseInterval = undefined;
                    resolve();
                }
            }, 1000);
        });
    }
    async completeSubtask(lastMessage) {
        this.isPaused = false;
        this.childTaskId = undefined;
        this.emit(types_1.RooCodeEventName.TaskUnpaused, this.taskId);
        // Fake an answer from the subtask that it has completed running and
        // this is the result of what it has done add the message to the chat
        // history and to the webview ui.
        try {
            await this.say("subtask_result", lastMessage);
            await this.addToApiConversationHistory({
                role: "user",
                content: [{ type: "text", text: `[new_task completed] Result: ${lastMessage}` }],
            });
        }
        catch (error) {
            this.providerRef
                .deref()
                ?.log(`Error failed to add reply from subtask into conversation of parent task, error: ${error}`);
            throw error;
        }
    }
    // Task Loop
    async initiateTaskLoop(userContent) {
        // Kicks off the checkpoints initialization process in the background.
        (0, checkpoints_1.getCheckpointService)(this);
        let nextUserContent = userContent;
        let includeFileDetails = true;
        this.emit(types_1.RooCodeEventName.TaskStarted);
        while (!this.abort) {
            const didEndLoop = await this.recursivelyMakeClineRequests(nextUserContent, includeFileDetails);
            includeFileDetails = false; // We only need file details the first time.
            // The way this agentic loop works is that cline will be given a
            // task that he then calls tools to complete. Unless there's an
            // attempt_completion call, we keep responding back to him with his
            // tool's responses until he either attempt_completion or does not
            // use anymore tools. If he does not use anymore tools, we ask him
            // to consider if he's completed the task and then call
            // attempt_completion, otherwise proceed with completing the task.
            // There is a MAX_REQUESTS_PER_TASK limit to prevent infinite
            // requests, but Cline is prompted to finish the task as efficiently
            // as he can.
            if (didEndLoop) {
                // For now a task never 'completes'. This will only happen if
                // the user hits max requests and denies resetting the count.
                break;
            }
            else {
                const modelInfo = this.api.getModel().info;
                const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, modelInfo, this.apiConfiguration.apiProvider);
                nextUserContent = [{ type: "text", text: responses_1.formatResponse.noToolsUsed(toolProtocol) }];
                this.consecutiveMistakeCount++;
            }
        }
    }
    async recursivelyMakeClineRequests(userContent, includeFileDetails = false) {
        const stack = [{ userContent, includeFileDetails, retryAttempt: 0 }];
        logger_1.logger.debug("Starting agent loop iteration", {
            taskId: this.taskId,
            instanceId: this.instanceId,
            includeFileDetails,
            apiProvider: this.apiConfiguration.apiProvider,
            modelId: (0, types_1.getModelId)(this.apiConfiguration),
        });
        while (stack.length > 0) {
            const currentItem = stack.pop();
            const currentUserContent = currentItem.userContent;
            const currentIncludeFileDetails = currentItem.includeFileDetails;
            if (this.abort) {
                throw new Error(`[RooCode#recursivelyMakeRooRequests] task ${this.taskId}.${this.instanceId} aborted`);
            }
            if (this.consecutiveMistakeLimit > 0 && this.consecutiveMistakeCount >= this.consecutiveMistakeLimit) {
                const { response, text, images } = await this.ask("mistake_limit_reached", (0, i18n_1.t)("common:errors.mistake_limit_guidance"));
                if (response === "messageResponse") {
                    currentUserContent.push(...[
                        { type: "text", text: responses_1.formatResponse.tooManyMistakes(text) },
                        ...responses_1.formatResponse.imageBlocks(images),
                    ]);
                    await this.say("user_feedback", text, images);
                    // Track consecutive mistake errors in telemetry.
                    telemetry_1.TelemetryService.instance.captureConsecutiveMistakeError(this.taskId);
                }
                this.consecutiveMistakeCount = 0;
            }
            // In this Cline request loop, we need to check if this task instance
            // has been asked to wait for a subtask to finish before continuing.
            const provider = this.providerRef.deref();
            if (this.isPaused && provider) {
                provider.log(`[subtasks] paused ${this.taskId}.${this.instanceId}`);
                await this.waitForSubtask();
                provider.log(`[subtasks] resumed ${this.taskId}.${this.instanceId}`);
                const currentMode = (await provider.getState())?.mode ?? modes_1.defaultModeSlug;
                if (currentMode !== this.pausedModeSlug) {
                    // The mode has changed, we need to switch back to the paused mode.
                    await provider.handleModeSwitch(this.pausedModeSlug);
                    // Delay to allow mode change to take effect before next tool is executed.
                    await (0, delay_1.default)(500);
                    provider.log(`[subtasks] task ${this.taskId}.${this.instanceId} has switched back to '${this.pausedModeSlug}' from '${currentMode}'`);
                }
            }
            // Getting verbose details is an expensive operation, it uses ripgrep to
            // top-down build file structure of project which for large projects can
            // take a few seconds. For the best UX we show a placeholder api_req_started
            // message with a loading spinner as this happens.
            // Determine API protocol based on provider and model
            const modelId = (0, types_1.getModelId)(this.apiConfiguration);
            const apiProtocol = (0, types_1.getApiProtocol)(this.apiConfiguration.apiProvider, modelId);
            await this.say("api_req_started", JSON.stringify({
                apiProtocol,
            }));
            const { showRooIgnoredFiles = false, includeDiagnosticMessages = true, maxDiagnosticMessages = 50, maxReadFileLine = -1, } = (await this.providerRef.deref()?.getState()) ?? {};
            const parsedUserContent = await (0, processUserContentMentions_1.processUserContentMentions)({
                userContent: currentUserContent,
                cwd: this.cwd,
                urlContentFetcher: this.urlContentFetcher,
                fileContextTracker: this.fileContextTracker,
                rooIgnoreController: this.rooIgnoreController,
                showRooIgnoredFiles,
                includeDiagnosticMessages,
                maxDiagnosticMessages,
                maxReadFileLine,
            });
            const environmentDetails = await (0, getEnvironmentDetails_1.getEnvironmentDetails)(this, currentIncludeFileDetails);
            // Add environment details as its own text block, separate from tool
            // results.
            const finalUserContent = [...parsedUserContent, { type: "text", text: environmentDetails }];
            // Only add user message to conversation history if:
            // 1. This is the first attempt (retryAttempt === 0), OR
            // 2. The message was removed in a previous iteration (userMessageWasRemoved === true)
            // This prevents consecutive user messages while allowing re-add when needed
            if ((currentItem.retryAttempt ?? 0) === 0 || currentItem.userMessageWasRemoved) {
                await this.addToApiConversationHistory({ role: "user", content: finalUserContent });
                telemetry_1.TelemetryService.instance.captureConversationMessage(this.taskId, "user");
            }
            // Since we sent off a placeholder api_req_started message to update the
            // webview while waiting to actually start the API request (to load
            // potential details for example), we need to update the text of that
            // message.
            const lastApiReqIndex = (0, array_1.findLastIndex)(this.clineMessages, (m) => m.say === "api_req_started");
            this.clineMessages[lastApiReqIndex].text = JSON.stringify({
                apiProtocol,
            });
            await this.saveClineMessages();
            await provider?.postStateToWebview();
            try {
                let cacheWriteTokens = 0;
                let cacheReadTokens = 0;
                let inputTokens = 0;
                let outputTokens = 0;
                let totalCost;
                // We can't use `api_req_finished` anymore since it's a unique case
                // where it could come after a streaming message (i.e. in the middle
                // of being updated or executed).
                // Fortunately `api_req_finished` was always parsed out for the GUI
                // anyways, so it remains solely for legacy purposes to keep track
                // of prices in tasks from history (it's worth removing a few months
                // from now).
                const updateApiReqMsg = (cancelReason, streamingFailedMessage) => {
                    if (lastApiReqIndex < 0 || !this.clineMessages[lastApiReqIndex]) {
                        return;
                    }
                    const existingData = JSON.parse(this.clineMessages[lastApiReqIndex].text || "{}");
                    // Calculate total tokens and cost using provider-aware function
                    const modelId = (0, types_1.getModelId)(this.apiConfiguration);
                    const apiProtocol = (0, types_1.getApiProtocol)(this.apiConfiguration.apiProvider, modelId);
                    const costResult = apiProtocol === "anthropic"
                        ? (0, cost_1.calculateApiCostAnthropic)(this.api.getModel().info, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens)
                        : (0, cost_1.calculateApiCostOpenAI)(this.api.getModel().info, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens);
                    this.clineMessages[lastApiReqIndex].text = JSON.stringify({
                        ...existingData,
                        tokensIn: costResult.totalInputTokens,
                        tokensOut: costResult.totalOutputTokens,
                        cacheWrites: cacheWriteTokens,
                        cacheReads: cacheReadTokens,
                        cost: totalCost ?? costResult.totalCost,
                        cancelReason,
                        streamingFailedMessage,
                    });
                };
                const abortStream = async (cancelReason, streamingFailedMessage) => {
                    if (this.diffViewProvider.isEditing) {
                        await this.diffViewProvider.revertChanges(); // closes diff view
                    }
                    // if last message is a partial we need to update and save it
                    const lastMessage = this.clineMessages.at(-1);
                    if (lastMessage && lastMessage.partial) {
                        // lastMessage.ts = Date.now() DO NOT update ts since it is used as a key for virtuoso list
                        lastMessage.partial = false;
                        // instead of streaming partialMessage events, we do a save and post like normal to persist to disk
                        console.log("updating partial message", lastMessage);
                    }
                    // Update `api_req_started` to have cancelled and cost, so that
                    // we can display the cost of the partial stream and the cancellation reason
                    updateApiReqMsg(cancelReason, streamingFailedMessage);
                    await this.saveClineMessages();
                    // Signals to provider that it can retrieve the saved messages
                    // from disk, as abortTask can not be awaited on in nature.
                    this.didFinishAbortingStream = true;
                };
                // Reset streaming state for each new API request
                this.currentStreamingContentIndex = 0;
                this.currentStreamingDidCheckpoint = false;
                this.assistantMessageContent = [];
                this.didCompleteReadingStream = false;
                this.userMessageContent = [];
                this.userMessageContentReady = false;
                this.didRejectTool = false;
                this.didAlreadyUseTool = false;
                this.presentAssistantMessageLocked = false;
                this.presentAssistantMessageHasPendingUpdates = false;
                this.assistantMessageParser?.reset();
                await this.diffViewProvider.reset();
                // Yields only if the first chunk is successful, otherwise will
                // allow the user to retry the request (most likely due to rate
                // limit error, which gets thrown on the first chunk).
                const stream = this.attemptApiRequest();
                let assistantMessage = "";
                let reasoningMessage = "";
                let pendingGroundingSources = [];
                this.isStreaming = true;
                try {
                    const iterator = stream[Symbol.asyncIterator]();
                    let item = await iterator.next();
                    while (!item.done) {
                        const chunk = item.value;
                        item = await iterator.next();
                        if (!chunk) {
                            // Sometimes chunk is undefined, no idea that can cause
                            // it, but this workaround seems to fix it.
                            continue;
                        }
                        switch (chunk.type) {
                            case "reasoning": {
                                reasoningMessage += chunk.text;
                                // Only apply formatting if the message contains sentence-ending punctuation followed by **
                                let formattedReasoning = reasoningMessage;
                                if (reasoningMessage.includes("**")) {
                                    // Add line breaks before **Title** patterns that appear after sentence endings
                                    // This targets section headers like "...end of sentence.**Title Here**"
                                    // Handles periods, exclamation marks, and question marks
                                    formattedReasoning = reasoningMessage.replace(/([.!?])\*\*([^*\n]+)\*\*/g, "$1\n\n**$2**");
                                }
                                await this.say("reasoning", formattedReasoning, undefined, true);
                                break;
                            }
                            case "usage":
                                inputTokens += chunk.inputTokens;
                                outputTokens += chunk.outputTokens;
                                cacheWriteTokens += chunk.cacheWriteTokens ?? 0;
                                cacheReadTokens += chunk.cacheReadTokens ?? 0;
                                totalCost = chunk.totalCost;
                                break;
                            case "grounding":
                                // Handle grounding sources separately from regular content
                                // to prevent state persistence issues - store them separately
                                if (chunk.sources && chunk.sources.length > 0) {
                                    pendingGroundingSources.push(...chunk.sources);
                                }
                                break;
                            case "tool_call": {
                                // Convert native tool call to ToolUse format
                                const toolUse = NativeToolCallParser_1.NativeToolCallParser.parseToolCall({
                                    id: chunk.id,
                                    name: chunk.name,
                                    arguments: chunk.arguments,
                                });
                                if (!toolUse) {
                                    console.error(`Failed to parse tool call for task ${this.taskId}:`, chunk);
                                    break;
                                }
                                // Store the tool call ID on the ToolUse object for later reference
                                // This is needed to create tool_result blocks that reference the correct tool_use_id
                                toolUse.id = chunk.id;
                                // Add the tool use to assistant message content
                                this.assistantMessageContent.push(toolUse);
                                // Mark that we have new content to process
                                this.userMessageContentReady = false;
                                // Present the tool call to user
                                (0, assistant_message_1.presentAssistantMessage)(this);
                                break;
                            }
                            case "text": {
                                assistantMessage += chunk.text;
                                if (this.assistantMessageParser) {
                                    // XML protocol: Parse raw assistant message chunk into content blocks
                                    const prevLength = this.assistantMessageContent.length;
                                    this.assistantMessageContent = this.assistantMessageParser.processChunk(chunk.text);
                                    if (this.assistantMessageContent.length > prevLength) {
                                        // New content we need to present, reset to
                                        // false in case previous content set this to true.
                                        this.userMessageContentReady = false;
                                    }
                                    // Present content to user.
                                    (0, assistant_message_1.presentAssistantMessage)(this);
                                }
                                else {
                                    // Native protocol: Text chunks are plain text, not XML tool calls
                                    // Create or update a text content block directly
                                    const lastBlock = this.assistantMessageContent[this.assistantMessageContent.length - 1];
                                    if (lastBlock?.type === "text" && lastBlock.partial) {
                                        // Update existing partial text block
                                        lastBlock.content = assistantMessage;
                                    }
                                    else {
                                        // Create new text block
                                        this.assistantMessageContent.push({
                                            type: "text",
                                            content: assistantMessage,
                                            partial: true,
                                        });
                                        this.userMessageContentReady = false;
                                    }
                                    // Present content to user
                                    (0, assistant_message_1.presentAssistantMessage)(this);
                                }
                                break;
                            }
                        }
                        if (this.abort) {
                            console.log(`aborting stream, this.abandoned = ${this.abandoned}`);
                            if (!this.abandoned) {
                                // Only need to gracefully abort if this instance
                                // isn't abandoned (sometimes OpenRouter stream
                                // hangs, in which case this would affect future
                                // instances of Cline).
                                await abortStream("user_cancelled");
                            }
                            break; // Aborts the stream.
                        }
                        if (this.didRejectTool) {
                            // `userContent` has a tool rejection, so interrupt the
                            // assistant's response to present the user's feedback.
                            assistantMessage += "\n\n[Response interrupted by user feedback]";
                            // Instead of setting this preemptively, we allow the
                            // present iterator to finish and set
                            // userMessageContentReady when its ready.
                            // this.userMessageContentReady = true
                            break;
                        }
                        if (this.didAlreadyUseTool) {
                            assistantMessage +=
                                "\n\n[Response interrupted by a tool use result. Only one tool may be used at a time and should be placed at the end of the message.]";
                            break;
                        }
                    }
                    // Create a copy of current token values to avoid race conditions
                    const currentTokens = {
                        input: inputTokens,
                        output: outputTokens,
                        cacheWrite: cacheWriteTokens,
                        cacheRead: cacheReadTokens,
                        total: totalCost,
                    };
                    const drainStreamInBackgroundToFindAllUsage = async (apiReqIndex) => {
                        const timeoutMs = DEFAULT_USAGE_COLLECTION_TIMEOUT_MS;
                        const startTime = performance.now();
                        const modelId = (0, types_1.getModelId)(this.apiConfiguration);
                        // Local variables to accumulate usage data without affecting the main flow
                        let bgInputTokens = currentTokens.input;
                        let bgOutputTokens = currentTokens.output;
                        let bgCacheWriteTokens = currentTokens.cacheWrite;
                        let bgCacheReadTokens = currentTokens.cacheRead;
                        let bgTotalCost = currentTokens.total;
                        // Helper function to capture telemetry and update messages
                        const captureUsageData = async (tokens, messageIndex = apiReqIndex) => {
                            if (tokens.input > 0 ||
                                tokens.output > 0 ||
                                tokens.cacheWrite > 0 ||
                                tokens.cacheRead > 0) {
                                // Update the shared variables atomically
                                inputTokens = tokens.input;
                                outputTokens = tokens.output;
                                cacheWriteTokens = tokens.cacheWrite;
                                cacheReadTokens = tokens.cacheRead;
                                totalCost = tokens.total;
                                // Update the API request message with the latest usage data
                                updateApiReqMsg();
                                await this.saveClineMessages();
                                // Update the specific message in the webview
                                const apiReqMessage = this.clineMessages[messageIndex];
                                if (apiReqMessage) {
                                    await this.updateClineMessage(apiReqMessage);
                                }
                                // Capture telemetry with provider-aware cost calculation
                                const modelId = (0, types_1.getModelId)(this.apiConfiguration);
                                const apiProtocol = (0, types_1.getApiProtocol)(this.apiConfiguration.apiProvider, modelId);
                                // Use the appropriate cost function based on the API protocol
                                const costResult = apiProtocol === "anthropic"
                                    ? (0, cost_1.calculateApiCostAnthropic)(this.api.getModel().info, tokens.input, tokens.output, tokens.cacheWrite, tokens.cacheRead)
                                    : (0, cost_1.calculateApiCostOpenAI)(this.api.getModel().info, tokens.input, tokens.output, tokens.cacheWrite, tokens.cacheRead);
                                telemetry_1.TelemetryService.instance.captureLlmCompletion(this.taskId, {
                                    inputTokens: costResult.totalInputTokens,
                                    outputTokens: costResult.totalOutputTokens,
                                    cacheWriteTokens: tokens.cacheWrite,
                                    cacheReadTokens: tokens.cacheRead,
                                    cost: tokens.total ?? costResult.totalCost,
                                });
                            }
                        };
                        try {
                            // Continue processing the original stream from where the main loop left off
                            let usageFound = false;
                            let chunkCount = 0;
                            // Use the same iterator that the main loop was using
                            while (!item.done) {
                                // Check for timeout
                                if (performance.now() - startTime > timeoutMs) {
                                    console.warn(`[Background Usage Collection] Timed out after ${timeoutMs}ms for model: ${modelId}, processed ${chunkCount} chunks`);
                                    // Clean up the iterator before breaking
                                    if (iterator.return) {
                                        await iterator.return(undefined);
                                    }
                                    break;
                                }
                                const chunk = item.value;
                                item = await iterator.next();
                                chunkCount++;
                                if (chunk && chunk.type === "usage") {
                                    usageFound = true;
                                    bgInputTokens += chunk.inputTokens;
                                    bgOutputTokens += chunk.outputTokens;
                                    bgCacheWriteTokens += chunk.cacheWriteTokens ?? 0;
                                    bgCacheReadTokens += chunk.cacheReadTokens ?? 0;
                                    bgTotalCost = chunk.totalCost;
                                }
                            }
                            if (usageFound ||
                                bgInputTokens > 0 ||
                                bgOutputTokens > 0 ||
                                bgCacheWriteTokens > 0 ||
                                bgCacheReadTokens > 0) {
                                // We have usage data either from a usage chunk or accumulated tokens
                                await captureUsageData({
                                    input: bgInputTokens,
                                    output: bgOutputTokens,
                                    cacheWrite: bgCacheWriteTokens,
                                    cacheRead: bgCacheReadTokens,
                                    total: bgTotalCost,
                                }, lastApiReqIndex);
                            }
                            else {
                                console.warn(`[Background Usage Collection] Suspicious: request ${apiReqIndex} is complete, but no usage info was found. Model: ${modelId}`);
                            }
                        }
                        catch (error) {
                            console.error("Error draining stream for usage data:", error);
                            // Still try to capture whatever usage data we have collected so far
                            if (bgInputTokens > 0 ||
                                bgOutputTokens > 0 ||
                                bgCacheWriteTokens > 0 ||
                                bgCacheReadTokens > 0) {
                                await captureUsageData({
                                    input: bgInputTokens,
                                    output: bgOutputTokens,
                                    cacheWrite: bgCacheWriteTokens,
                                    cacheRead: bgCacheReadTokens,
                                    total: bgTotalCost,
                                }, lastApiReqIndex);
                            }
                        }
                    };
                    // Start the background task and handle any errors
                    drainStreamInBackgroundToFindAllUsage(lastApiReqIndex).catch((error) => {
                        console.error("Background usage collection failed:", error);
                    });
                }
                catch (error) {
                    // Abandoned happens when extension is no longer waiting for the
                    // Cline instance to finish aborting (error is thrown here when
                    // any function in the for loop throws due to this.abort).
                    if (!this.abandoned) {
                        // Determine cancellation reason
                        const cancelReason = this.abort ? "user_cancelled" : "streaming_failed";
                        const streamingFailedMessage = this.abort
                            ? undefined
                            : (error.message ?? JSON.stringify((0, serialize_error_1.serializeError)(error), null, 2));
                        // Clean up partial state
                        await abortStream(cancelReason, streamingFailedMessage);
                        if (this.abort) {
                            // User cancelled - abort the entire task
                            this.abortReason = cancelReason;
                            await this.abortTask();
                        }
                        else {
                            // Stream failed - log the error and retry with the same content
                            // The existing rate limiting will prevent rapid retries
                            console.error(`[Task#${this.taskId}.${this.instanceId}] Stream failed, will retry: ${streamingFailedMessage}`);
                            // Apply exponential backoff similar to first-chunk errors when auto-resubmit is enabled
                            const stateForBackoff = await this.providerRef.deref()?.getState();
                            if (stateForBackoff?.autoApprovalEnabled && stateForBackoff?.alwaysApproveResubmit) {
                                await this.backoffAndAnnounce(currentItem.retryAttempt ?? 0, error, streamingFailedMessage);
                                // Check if task was aborted during the backoff
                                if (this.abort) {
                                    console.log(`[Task#${this.taskId}.${this.instanceId}] Task aborted during mid-stream retry backoff`);
                                    // Abort the entire task
                                    this.abortReason = "user_cancelled";
                                    await this.abortTask();
                                    break;
                                }
                            }
                            // Push the same content back onto the stack to retry, incrementing the retry attempt counter
                            stack.push({
                                userContent: currentUserContent,
                                includeFileDetails: false,
                                retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
                            });
                            // Continue to retry the request
                            continue;
                        }
                    }
                }
                finally {
                    this.isStreaming = false;
                }
                // Need to call here in case the stream was aborted.
                if (this.abort || this.abandoned) {
                    throw new Error(`[RooCode#recursivelyMakeRooRequests] task ${this.taskId}.${this.instanceId} aborted`);
                }
                this.didCompleteReadingStream = true;
                // Set any blocks to be complete to allow `presentAssistantMessage`
                // to finish and set `userMessageContentReady` to true.
                // (Could be a text block that had no subsequent tool uses, or a
                // text block at the very end, or an invalid tool use, etc. Whatever
                // the case, `presentAssistantMessage` relies on these blocks either
                // to be completed or the user to reject a block in order to proceed
                // and eventually set userMessageContentReady to true.)
                const partialBlocks = this.assistantMessageContent.filter((block) => block.partial);
                partialBlocks.forEach((block) => (block.partial = false));
                // Can't just do this b/c a tool could be in the middle of executing.
                // this.assistantMessageContent.forEach((e) => (e.partial = false))
                // Now that the stream is complete, finalize any remaining partial content blocks (XML protocol only)
                if (this.assistantMessageParser) {
                    this.assistantMessageParser.finalizeContentBlocks();
                    const parsedBlocks = this.assistantMessageParser.getContentBlocks();
                    // Check if we're using native protocol
                    const isNative = (0, types_1.isNativeProtocol)((0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, this.api.getModel().info, this.apiConfiguration.apiProvider));
                    if (isNative) {
                        // For native protocol: Preserve tool_use blocks that were added via tool_call chunks
                        // These are added directly to assistantMessageContent and have an 'id' property
                        const nativeToolBlocks = this.assistantMessageContent.filter((block) => block.type === "tool_use" && block.id !== undefined);
                        // Merge: parser blocks (text) + native tool blocks (tools with IDs)
                        this.assistantMessageContent = [...parsedBlocks, ...nativeToolBlocks];
                    }
                    else {
                        // For XML protocol: Use only parsed blocks (includes both text and tool_use parsed from XML)
                        this.assistantMessageContent = parsedBlocks;
                    }
                }
                if (partialBlocks.length > 0) {
                    // If there is content to update then it will complete and
                    // update `this.userMessageContentReady` to true, which we
                    // `pWaitFor` before making the next request. All this is really
                    // doing is presenting the last partial message that we just set
                    // to complete.
                    (0, assistant_message_1.presentAssistantMessage)(this);
                }
                // Note: updateApiReqMsg() is now called from within drainStreamInBackgroundToFindAllUsage
                // to ensure usage data is captured even when the stream is interrupted. The background task
                // uses local variables to accumulate usage data before atomically updating the shared state.
                // Complete the reasoning message if it exists
                // We can't use say() here because the reasoning message may not be the last message
                // (other messages like text blocks or tool uses may have been added after it during streaming)
                if (reasoningMessage) {
                    const lastReasoningIndex = (0, array_1.findLastIndex)(this.clineMessages, (m) => m.type === "say" && m.say === "reasoning");
                    if (lastReasoningIndex !== -1 && this.clineMessages[lastReasoningIndex].partial) {
                        this.clineMessages[lastReasoningIndex].partial = false;
                        await this.updateClineMessage(this.clineMessages[lastReasoningIndex]);
                    }
                }
                await this.saveClineMessages();
                await this.providerRef.deref()?.postStateToWebview();
                // Reset parser after each complete conversation round (XML protocol only)
                this.assistantMessageParser?.reset();
                // Now add to apiConversationHistory.
                // Need to save assistant responses to file before proceeding to
                // tool use since user can exit at any moment and we wouldn't be
                // able to save the assistant's response.
                let didEndLoop = false;
                // Check if we have any content to process (text or tool uses)
                const hasTextContent = assistantMessage.length > 0;
                const hasToolUses = this.assistantMessageContent.some((block) => block.type === "tool_use");
                if (hasTextContent || hasToolUses) {
                    // Display grounding sources to the user if they exist
                    if (pendingGroundingSources.length > 0) {
                        const citationLinks = pendingGroundingSources.map((source, i) => `[${i + 1}](${source.url})`);
                        const sourcesText = `${(0, i18n_1.t)("common:gemini.sources")} ${citationLinks.join(", ")}`;
                        await this.say("text", sourcesText, undefined, false, undefined, undefined, {
                            isNonInteractive: true,
                        });
                    }
                    // Check if we should preserve reasoning in the assistant message
                    let finalAssistantMessage = assistantMessage;
                    if (reasoningMessage && this.api.getModel().info.preserveReasoning) {
                        // Prepend reasoning in XML tags to the assistant message so it's included in API history
                        finalAssistantMessage = `<think>${reasoningMessage}</think>\n${assistantMessage}`;
                    }
                    // Build the assistant message content array
                    const assistantContent = [];
                    // Add text content if present
                    if (finalAssistantMessage) {
                        assistantContent.push({
                            type: "text",
                            text: finalAssistantMessage,
                        });
                    }
                    // Add tool_use blocks with their IDs for native protocol
                    const toolUseBlocks = this.assistantMessageContent.filter((block) => block.type === "tool_use");
                    for (const toolUse of toolUseBlocks) {
                        // Get the tool call ID that was stored during parsing
                        const toolCallId = toolUse.id;
                        if (toolCallId) {
                            // nativeArgs is already in the correct API format for all tools
                            const input = toolUse.nativeArgs || toolUse.params;
                            assistantContent.push({
                                type: "tool_use",
                                id: toolCallId,
                                name: toolUse.name,
                                input,
                            });
                        }
                    }
                    await this.addToApiConversationHistory({
                        role: "assistant",
                        content: assistantContent,
                    });
                    telemetry_1.TelemetryService.instance.captureConversationMessage(this.taskId, "assistant");
                    // NOTE: This comment is here for future reference - this was a
                    // workaround for `userMessageContent` not getting set to true.
                    // It was due to it not recursively calling for partial blocks
                    // when `didRejectTool`, so it would get stuck waiting for a
                    // partial block to complete before it could continue.
                    // In case the content blocks finished it may be the api stream
                    // finished after the last parsed content block was executed, so
                    // we are able to detect out of bounds and set
                    // `userMessageContentReady` to true (note you should not call
                    // `presentAssistantMessage` since if the last block i
                    //  completed it will be presented again).
                    // const completeBlocks = this.assistantMessageContent.filter((block) => !block.partial) // If there are any partial blocks after the stream ended we can consider them invalid.
                    // if (this.currentStreamingContentIndex >= completeBlocks.length) {
                    // 	this.userMessageContentReady = true
                    // }
                    await (0, p_wait_for_1.default)(() => this.userMessageContentReady);
                    // If the model did not tool use, then we need to tell it to
                    // either use a tool or attempt_completion.
                    const didToolUse = this.assistantMessageContent.some((block) => block.type === "tool_use");
                    if (!didToolUse) {
                        const modelInfo = this.api.getModel().info;
                        const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, modelInfo, this.apiConfiguration.apiProvider);
                        this.userMessageContent.push({ type: "text", text: responses_1.formatResponse.noToolsUsed(toolProtocol) });
                        this.consecutiveMistakeCount++;
                    }
                    if (this.userMessageContent.length > 0) {
                        stack.push({
                            userContent: [...this.userMessageContent], // Create a copy to avoid mutation issues
                            includeFileDetails: false, // Subsequent iterations don't need file details
                        });
                        // Add periodic yielding to prevent blocking
                        await new Promise((resolve) => setImmediate(resolve));
                    }
                    // Continue to next iteration instead of setting didEndLoop from recursive call
                    continue;
                }
                else {
                    // If there's no assistant_responses, that means we got no text
                    // or tool_use content blocks from API which we should assume is
                    // an error.
                    // IMPORTANT: For native tool protocol, we already added the user message to
                    // apiConversationHistory at line 1876. Since the assistant failed to respond,
                    // we need to remove that message before retrying to avoid having two consecutive
                    // user messages (which would cause tool_result validation errors).
                    if ((0, types_1.isNativeProtocol)((0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, this.api.getModel().info, this.apiConfiguration.apiProvider)) &&
                        this.apiConversationHistory.length > 0) {
                        const lastMessage = this.apiConversationHistory[this.apiConversationHistory.length - 1];
                        if (lastMessage.role === "user") {
                            // Remove the last user message that we added earlier
                            this.apiConversationHistory.pop();
                        }
                    }
                    // Check if we should auto-retry or prompt the user
                    const state = await this.providerRef.deref()?.getState();
                    if (state?.autoApprovalEnabled && state?.alwaysApproveResubmit) {
                        // Auto-retry with backoff - don't persist failure message when retrying
                        const errorMsg = "Unexpected API Response: The language model did not provide any assistant messages. This may indicate an issue with the API or the model's output.";
                        await this.backoffAndAnnounce(currentItem.retryAttempt ?? 0, new Error("Empty assistant response"), errorMsg);
                        // Check if task was aborted during the backoff
                        if (this.abort) {
                            console.log(`[Task#${this.taskId}.${this.instanceId}] Task aborted during empty-assistant retry backoff`);
                            break;
                        }
                        // Push the same content back onto the stack to retry, incrementing the retry attempt counter
                        // Mark that user message was removed so it gets re-added on retry
                        stack.push({
                            userContent: currentUserContent,
                            includeFileDetails: false,
                            retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
                            userMessageWasRemoved: true,
                        });
                        // Continue to retry the request
                        continue;
                    }
                    else {
                        // Prompt the user for retry decision
                        const { response } = await this.ask("api_req_failed", "The model returned no assistant messages. This may indicate an issue with the API or the model's output.");
                        if (response === "yesButtonClicked") {
                            await this.say("api_req_retried");
                            // Push the same content back to retry
                            stack.push({
                                userContent: currentUserContent,
                                includeFileDetails: false,
                                retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
                            });
                            // Continue to retry the request
                            continue;
                        }
                        else {
                            // User declined to retry
                            // For native protocol, re-add the user message we removed
                            if ((0, types_1.isNativeProtocol)((0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, this.api.getModel().info, this.apiConfiguration.apiProvider))) {
                                await this.addToApiConversationHistory({
                                    role: "user",
                                    content: currentUserContent,
                                });
                            }
                            await this.say("error", "Unexpected API Response: The language model did not provide any assistant messages. This may indicate an issue with the API or the model's output.");
                            await this.addToApiConversationHistory({
                                role: "assistant",
                                content: [{ type: "text", text: "Failure: I did not provide a response." }],
                            });
                        }
                    }
                }
                // If we reach here without continuing, return false (will always be false for now)
                return false;
            }
            catch (error) {
                // This should never happen since the only thing that can throw an
                // error is the attemptApiRequest, which is wrapped in a try catch
                // that sends an ask where if noButtonClicked, will clear current
                // task and destroy this instance. However to avoid unhandled
                // promise rejection, we will end this loop which will end execution
                // of this instance (see `startTask`).
                return true; // Needs to be true so parent loop knows to end task.
            }
        }
        // If we exit the while loop normally (stack is empty), return false
        return false;
    }
    async getSystemPrompt() {
        const { mcpEnabled } = (await this.providerRef.deref()?.getState()) ?? {};
        let mcpHub;
        if (mcpEnabled ?? true) {
            const provider = this.providerRef.deref();
            if (!provider) {
                throw new Error("Provider reference lost during view transition");
            }
            // Wait for MCP hub initialization through McpServerManager
            mcpHub = await McpServerManager_1.McpServerManager.getInstance(provider.context, provider);
            if (!mcpHub) {
                throw new Error("Failed to get MCP hub from server manager");
            }
            // Wait for MCP servers to be connected before generating system prompt
            await (0, p_wait_for_1.default)(() => !mcpHub.isConnecting, { timeout: 10_000 }).catch(() => {
                console.error("MCP servers failed to connect in time");
            });
        }
        const rooIgnoreInstructions = this.rooIgnoreController?.getInstructions();
        const state = await this.providerRef.deref()?.getState();
        const { browserViewportSize, mode, customModes, customModePrompts, customInstructions, experiments, enableMcpServerCreation, browserToolEnabled, language, maxConcurrentFileReads, maxReadFileLine, apiConfiguration, } = state ?? {};
        return await (async () => {
            const provider = this.providerRef.deref();
            if (!provider) {
                throw new Error("Provider not available");
            }
            // Align browser tool enablement with generateSystemPrompt: require model image support,
            // mode to include the browser group, and the user setting to be enabled.
            const modeConfig = (0, modes_1.getModeBySlug)(mode ?? modes_1.defaultModeSlug, customModes);
            const modeSupportsBrowser = modeConfig?.groups.some((group) => (0, modes_1.getGroupName)(group) === "browser") ?? false;
            // Check if model supports browser capability (images)
            const modelInfo = this.api.getModel().info;
            const modelSupportsBrowser = modelInfo?.supportsImages === true;
            const canUseBrowserTool = modelSupportsBrowser && modeSupportsBrowser && (browserToolEnabled ?? true);
            // Resolve the tool protocol based on profile, model, and provider settings
            const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(apiConfiguration ?? this.apiConfiguration, modelInfo, (apiConfiguration ?? this.apiConfiguration)?.apiProvider);
            return (0, system_1.SYSTEM_PROMPT)(provider.context, this.cwd, canUseBrowserTool, mcpHub, this.diffStrategy, browserViewportSize ?? "900x600", mode ?? modes_1.defaultModeSlug, customModePrompts, customModes, customInstructions, this.diffEnabled, experiments, enableMcpServerCreation, language, rooIgnoreInstructions, maxReadFileLine !== -1, {
                maxConcurrentFileReads: maxConcurrentFileReads ?? 5,
                todoListEnabled: apiConfiguration?.todoListEnabled ?? true,
                browserToolEnabled: browserToolEnabled ?? true,
                useAgentRules: vscode.workspace.getConfiguration(package_1.Package.name).get("useAgentRules") ?? true,
                newTaskRequireTodos: vscode.workspace
                    .getConfiguration(package_1.Package.name)
                    .get("newTaskRequireTodos", false),
                toolProtocol,
            }, undefined, // todoList
            this.api.getModel().id);
        })();
    }
    getCurrentProfileId(state) {
        return (state?.listApiConfigMeta?.find((profile) => profile.name === state?.currentApiConfigName)?.id ??
            "default");
    }
    async handleContextWindowExceededError() {
        const state = await this.providerRef.deref()?.getState();
        const { profileThresholds = {} } = state ?? {};
        const { contextTokens } = this.getTokenUsage();
        const modelInfo = this.api.getModel().info;
        const maxTokens = (0, api_2.getModelMaxOutputTokens)({
            modelId: this.api.getModel().id,
            model: modelInfo,
            settings: this.apiConfiguration,
        });
        const contextWindow = modelInfo.contextWindow;
        // Get the current profile ID using the helper method
        const currentProfileId = this.getCurrentProfileId(state);
        // Log the context window error for debugging
        console.warn(`[Task#${this.taskId}] Context window exceeded for model ${this.api.getModel().id}. ` +
            `Current tokens: ${contextTokens}, Context window: ${contextWindow}. ` +
            `Forcing truncation to ${FORCED_CONTEXT_REDUCTION_PERCENT}% of current context.`);
        // Force aggressive truncation by keeping only 75% of the conversation history
        const truncateResult = await (0, context_management_1.manageContext)({
            messages: this.apiConversationHistory,
            totalTokens: contextTokens || 0,
            maxTokens,
            contextWindow,
            apiHandler: this.api,
            autoCondenseContext: true,
            autoCondenseContextPercent: FORCED_CONTEXT_REDUCTION_PERCENT,
            systemPrompt: await this.getSystemPrompt(),
            taskId: this.taskId,
            profileThresholds,
            currentProfileId,
        });
        if (truncateResult.messages !== this.apiConversationHistory) {
            await this.overwriteApiConversationHistory(truncateResult.messages);
        }
        if (truncateResult.summary) {
            const { summary, cost, prevContextTokens, newContextTokens = 0 } = truncateResult;
            const contextCondense = { summary, cost, newContextTokens, prevContextTokens };
            await this.say("condense_context", undefined /* text */, undefined /* images */, false /* partial */, undefined /* checkpoint */, undefined /* progressStatus */, { isNonInteractive: true } /* options */, contextCondense);
        }
    }
    async *attemptApiRequest(retryAttempt = 0) {
        const state = await this.providerRef.deref()?.getState();
        const { apiConfiguration, autoApprovalEnabled, alwaysApproveResubmit, requestDelaySeconds, mode, autoCondenseContext = true, autoCondenseContextPercent = 100, profileThresholds = {}, } = state ?? {};
        // Get condensing configuration for automatic triggers.
        const customCondensingPrompt = state?.customCondensingPrompt;
        const condensingApiConfigId = state?.condensingApiConfigId;
        const listApiConfigMeta = state?.listApiConfigMeta;
        // Determine API handler to use for condensing.
        let condensingApiHandler;
        if (condensingApiConfigId && listApiConfigMeta && Array.isArray(listApiConfigMeta)) {
            // Find matching config by ID
            const matchingConfig = listApiConfigMeta.find((config) => config.id === condensingApiConfigId);
            if (matchingConfig) {
                const profile = await this.providerRef.deref()?.providerSettingsManager.getProfile({
                    id: condensingApiConfigId,
                });
                // Ensure profile and apiProvider exist before trying to build handler.
                if (profile && profile.apiProvider) {
                    condensingApiHandler = (0, api_1.buildApiHandler)(profile);
                }
            }
        }
        let rateLimitDelay = 0;
        // Use the shared timestamp so that subtasks respect the same rate-limit
        // window as their parent tasks.
        if (Task.lastGlobalApiRequestTime) {
            const now = performance.now();
            const timeSinceLastRequest = now - Task.lastGlobalApiRequestTime;
            const rateLimit = apiConfiguration?.rateLimitSeconds || 0;
            rateLimitDelay = Math.ceil(Math.min(rateLimit, Math.max(0, rateLimit * 1000 - timeSinceLastRequest) / 1000));
        }
        // Only show rate limiting message if we're not retrying. If retrying, we'll include the delay there.
        if (rateLimitDelay > 0 && retryAttempt === 0) {
            // Show countdown timer
            for (let i = rateLimitDelay; i > 0; i--) {
                const delayMessage = `Rate limiting for ${i} seconds...`;
                await this.say("api_req_retry_delayed", delayMessage, undefined, true);
                await (0, delay_1.default)(1000);
            }
        }
        // Update last request time before making the request so that subsequent
        // requests — even from new subtasks — will honour the provider's rate-limit.
        Task.lastGlobalApiRequestTime = performance.now();
        const systemPrompt = await this.getSystemPrompt();
        const { contextTokens } = this.getTokenUsage();
        if (contextTokens) {
            const modelInfo = this.api.getModel().info;
            const maxTokens = (0, api_2.getModelMaxOutputTokens)({
                modelId: this.api.getModel().id,
                model: modelInfo,
                settings: this.apiConfiguration,
            });
            const contextWindow = modelInfo.contextWindow;
            // Get the current profile ID using the helper method
            const currentProfileId = this.getCurrentProfileId(state);
            const truncateResult = await (0, context_management_1.manageContext)({
                messages: this.apiConversationHistory,
                totalTokens: contextTokens,
                maxTokens,
                contextWindow,
                apiHandler: this.api,
                autoCondenseContext,
                autoCondenseContextPercent,
                systemPrompt,
                taskId: this.taskId,
                customCondensingPrompt,
                condensingApiHandler,
                profileThresholds,
                currentProfileId,
            });
            if (truncateResult.messages !== this.apiConversationHistory) {
                await this.overwriteApiConversationHistory(truncateResult.messages);
            }
            if (truncateResult.error) {
                await this.say("condense_context_error", truncateResult.error);
            }
            else if (truncateResult.summary) {
                const { summary, cost, prevContextTokens, newContextTokens = 0 } = truncateResult;
                const contextCondense = { summary, cost, newContextTokens, prevContextTokens };
                await this.say("condense_context", undefined /* text */, undefined /* images */, false /* partial */, undefined /* checkpoint */, undefined /* progressStatus */, { isNonInteractive: true } /* options */, contextCondense);
            }
        }
        const messagesSinceLastSummary = (0, condense_1.getMessagesSinceLastSummary)(this.apiConversationHistory);
        const messagesWithoutImages = (0, image_cleaning_1.maybeRemoveImageBlocks)(messagesSinceLastSummary, this.api);
        const cleanConversationHistory = this.buildCleanConversationHistory(messagesWithoutImages);
        // Check auto-approval limits
        const approvalResult = await this.autoApprovalHandler.checkAutoApprovalLimits(state, this.combineMessages(this.clineMessages.slice(1)), async (type, data) => this.ask(type, data));
        if (!approvalResult.shouldProceed) {
            // User did not approve, task should be aborted
            throw new Error("Auto-approval limit reached and user did not approve continuation");
        }
        // Determine if we should include native tools based on:
        // 1. Tool protocol is set to NATIVE
        // 2. Model supports native tools
        const modelInfo = this.api.getModel().info;
        const toolProtocol = (0, resolveToolProtocol_1.resolveToolProtocol)(this.apiConfiguration, modelInfo, this.apiConfiguration.apiProvider);
        const shouldIncludeTools = toolProtocol === types_1.TOOL_PROTOCOL.NATIVE && (modelInfo.supportsNativeTools ?? false);
        // Build complete tools array: native tools + dynamic MCP tools, filtered by mode restrictions
        let allTools = [];
        if (shouldIncludeTools) {
            const provider = this.providerRef.deref();
            const mcpHub = provider?.getMcpHub();
            // Get CodeIndexManager for feature checking
            const { CodeIndexManager } = await import("../../services/code-index/manager");
            const codeIndexManager = CodeIndexManager.getInstance(provider.context, this.cwd);
            // Build settings object for tool filtering
            // Include browserToolEnabled to filter browser_action when disabled by user
            const filterSettings = {
                todoListEnabled: apiConfiguration?.todoListEnabled ?? true,
                browserToolEnabled: state?.browserToolEnabled ?? true,
            };
            // Filter native tools based on mode restrictions (similar to XML tool filtering)
            const filteredNativeTools = (0, filter_tools_for_mode_1.filterNativeToolsForMode)(native_tools_1.nativeTools, mode, state?.customModes, state?.experiments, codeIndexManager, filterSettings);
            // Filter MCP tools based on mode restrictions
            const mcpTools = (0, native_tools_1.getMcpServerTools)(mcpHub);
            const filteredMcpTools = (0, filter_tools_for_mode_1.filterMcpToolsForMode)(mcpTools, mode, state?.customModes, state?.experiments);
            allTools = [...filteredNativeTools, ...filteredMcpTools];
        }
        const metadata = {
            mode: mode,
            taskId: this.taskId,
            // Include tools and tool protocol when using native protocol and model supports it
            ...(shouldIncludeTools ? { tools: allTools, tool_choice: "auto", toolProtocol } : {}),
        };
        // The provider accepts reasoning items alongside standard messages; cast to the expected parameter type.
        const stream = this.api.createMessage(systemPrompt, cleanConversationHistory, metadata);
        const iterator = stream[Symbol.asyncIterator]();
        try {
            // Awaiting first chunk to see if it will throw an error.
            this.isWaitingForFirstChunk = true;
            const firstChunk = await iterator.next();
            yield firstChunk.value;
            this.isWaitingForFirstChunk = false;
        }
        catch (error) {
            this.isWaitingForFirstChunk = false;
            const isContextWindowExceededError = (0, context_error_handling_1.checkContextWindowExceededError)(error);
            // If it's a context window error and we haven't exceeded max retries for this error type
            if (isContextWindowExceededError && retryAttempt < MAX_CONTEXT_WINDOW_RETRIES) {
                console.warn(`[Task#${this.taskId}] Context window exceeded for model ${this.api.getModel().id}. ` +
                    `Retry attempt ${retryAttempt + 1}/${MAX_CONTEXT_WINDOW_RETRIES}. ` +
                    `Attempting automatic truncation...`);
                await this.handleContextWindowExceededError();
                // Retry the request after handling the context window error
                yield* this.attemptApiRequest(retryAttempt + 1);
                return;
            }
            // note that this api_req_failed ask is unique in that we only present this option if the api hasn't streamed any content yet (ie it fails on the first chunk due), as it would allow them to hit a retry button. However if the api failed mid-stream, it could be in any arbitrary state where some tools may have executed, so that error is handled differently and requires cancelling the task entirely.
            if (autoApprovalEnabled && alwaysApproveResubmit) {
                let errorMsg;
                if (error.error?.metadata?.raw) {
                    errorMsg = JSON.stringify(error.error.metadata.raw, null, 2);
                }
                else if (error.message) {
                    errorMsg = error.message;
                }
                else {
                    errorMsg = "Unknown error";
                }
                // Apply shared exponential backoff and countdown UX
                await this.backoffAndAnnounce(retryAttempt, error, errorMsg);
                // CRITICAL: Check if task was aborted during the backoff countdown
                // This prevents infinite loops when users cancel during auto-retry
                // Without this check, the recursive call below would continue even after abort
                if (this.abort) {
                    throw new Error(`[Task#attemptApiRequest] task ${this.taskId}.${this.instanceId} aborted during retry`);
                }
                // Delegate generator output from the recursive call with
                // incremented retry count.
                yield* this.attemptApiRequest(retryAttempt + 1);
                return;
            }
            else {
                const { response } = await this.ask("api_req_failed", error.message ?? JSON.stringify((0, serialize_error_1.serializeError)(error), null, 2));
                if (response !== "yesButtonClicked") {
                    // This will never happen since if noButtonClicked, we will
                    // clear current task, aborting this instance.
                    throw new Error("API request failed");
                }
                await this.say("api_req_retried");
                // Delegate generator output from the recursive call.
                yield* this.attemptApiRequest();
                return;
            }
        }
        // No error, so we can continue to yield all remaining chunks.
        // (Needs to be placed outside of try/catch since it we want caller to
        // handle errors not with api_req_failed as that is reserved for first
        // chunk failures only.)
        // This delegates to another generator or iterable object. In this case,
        // it's saying "yield all remaining values from this iterator". This
        // effectively passes along all subsequent chunks from the original
        // stream.
        yield* iterator;
    }
    // Shared exponential backoff for retries (first-chunk and mid-stream)
    async backoffAndAnnounce(retryAttempt, error, header) {
        try {
            const state = await this.providerRef.deref()?.getState();
            const baseDelay = state?.requestDelaySeconds || 5;
            let exponentialDelay = Math.min(Math.ceil(baseDelay * Math.pow(2, retryAttempt)), MAX_EXPONENTIAL_BACKOFF_SECONDS);
            // Respect provider rate limit window
            let rateLimitDelay = 0;
            const rateLimit = state?.apiConfiguration?.rateLimitSeconds || 0;
            if (Task.lastGlobalApiRequestTime && rateLimit > 0) {
                const elapsed = performance.now() - Task.lastGlobalApiRequestTime;
                rateLimitDelay = Math.ceil(Math.min(rateLimit, Math.max(0, rateLimit * 1000 - elapsed) / 1000));
            }
            // Prefer RetryInfo on 429 if present
            if (error?.status === 429) {
                const retryInfo = error?.errorDetails?.find((d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
                const match = retryInfo?.retryDelay?.match?.(/^(\d+)s$/);
                if (match) {
                    exponentialDelay = Number(match[1]) + 1;
                }
            }
            const finalDelay = Math.max(exponentialDelay, rateLimitDelay);
            if (finalDelay <= 0)
                return;
            // Build header text; fall back to error message if none provided
            let headerText = header;
            if (!headerText) {
                if (error?.error?.metadata?.raw) {
                    headerText = JSON.stringify(error.error.metadata.raw, null, 2);
                }
                else if (error?.message) {
                    headerText = error.message;
                }
                else {
                    headerText = "Unknown error";
                }
            }
            headerText = headerText ? `${headerText}\n\n` : "";
            // Show countdown timer with exponential backoff
            for (let i = finalDelay; i > 0; i--) {
                // Check abort flag during countdown to allow early exit
                if (this.abort) {
                    throw new Error(`[Task#${this.taskId}] Aborted during retry countdown`);
                }
                await this.say("api_req_retry_delayed", `${headerText}Retry attempt ${retryAttempt + 1}\nRetrying in ${i} seconds...`, undefined, true);
                await (0, delay_1.default)(1000);
            }
            await this.say("api_req_retry_delayed", `${headerText}Retry attempt ${retryAttempt + 1}\nRetrying now...`, undefined, false);
        }
        catch (err) {
            console.error("Exponential backoff failed:", err);
        }
    }
    // Checkpoints
    async checkpointSave(force = false, suppressMessage = false) {
        return (0, checkpoints_1.checkpointSave)(this, force, suppressMessage);
    }
    buildCleanConversationHistory(messages) {
        const cleanConversationHistory = [];
        for (const msg of messages) {
            // Legacy path: standalone reasoning items stored as separate messages
            if (msg.type === "reasoning" && msg.encrypted_content) {
                cleanConversationHistory.push({
                    type: "reasoning",
                    summary: msg.summary,
                    encrypted_content: msg.encrypted_content,
                    ...(msg.id ? { id: msg.id } : {}),
                });
                continue;
            }
            // Preferred path: assistant message with embedded reasoning as first content block
            if (msg.role === "assistant") {
                const rawContent = msg.content;
                const contentArray = Array.isArray(rawContent)
                    ? rawContent
                    : rawContent !== undefined
                        ? [
                            { type: "text", text: rawContent },
                        ]
                        : [];
                const [first, ...rest] = contentArray;
                const hasEmbeddedReasoning = first && first.type === "reasoning" && typeof first.encrypted_content === "string";
                if (hasEmbeddedReasoning) {
                    const reasoningBlock = first;
                    // Emit a separate reasoning item for the provider
                    cleanConversationHistory.push({
                        type: "reasoning",
                        summary: reasoningBlock.summary ?? [],
                        encrypted_content: reasoningBlock.encrypted_content,
                        ...(reasoningBlock.id ? { id: reasoningBlock.id } : {}),
                    });
                    // Build assistant message without the embedded reasoning block
                    let assistantContent;
                    if (rest.length === 0) {
                        assistantContent = "";
                    }
                    else if (rest.length === 1 && rest[0].type === "text") {
                        assistantContent = rest[0].text;
                    }
                    else {
                        assistantContent = rest;
                    }
                    cleanConversationHistory.push({
                        role: "assistant",
                        content: assistantContent,
                    });
                    continue;
                }
            }
            // Default path for regular messages (no embedded reasoning)
            if (msg.role) {
                cleanConversationHistory.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }
        return cleanConversationHistory;
    }
    async checkpointRestore(options) {
        return (0, checkpoints_1.checkpointRestore)(this, options);
    }
    async checkpointDiff(options) {
        return (0, checkpoints_1.checkpointDiff)(this, options);
    }
    // Metrics
    combineMessages(messages) {
        return (0, combineApiRequests_1.combineApiRequests)((0, combineCommandSequences_1.combineCommandSequences)(messages));
    }
    getTokenUsage() {
        return (0, getApiMetrics_1.getApiMetrics)(this.combineMessages(this.clineMessages.slice(1)));
    }
    recordToolUsage(toolName) {
        if (!this.toolUsage[toolName]) {
            this.toolUsage[toolName] = { attempts: 0, failures: 0 };
        }
        this.toolUsage[toolName].attempts++;
    }
    recordToolError(toolName, error) {
        if (!this.toolUsage[toolName]) {
            this.toolUsage[toolName] = { attempts: 0, failures: 0 };
        }
        this.toolUsage[toolName].failures++;
        if (error) {
            this.emit(types_1.RooCodeEventName.TaskToolFailed, this.taskId, toolName, error);
        }
    }
    // Getters
    get taskStatus() {
        if (this.interactiveAsk) {
            return types_1.TaskStatus.Interactive;
        }
        if (this.resumableAsk) {
            return types_1.TaskStatus.Resumable;
        }
        if (this.idleAsk) {
            return types_1.TaskStatus.Idle;
        }
        return types_1.TaskStatus.Running;
    }
    get taskAsk() {
        return this.idleAsk || this.resumableAsk || this.interactiveAsk;
    }
    get queuedMessages() {
        return this.messageQueueService.messages;
    }
    get tokenUsage() {
        if (this.tokenUsageSnapshot && this.tokenUsageSnapshotAt) {
            return this.tokenUsageSnapshot;
        }
        this.tokenUsageSnapshot = this.getTokenUsage();
        this.tokenUsageSnapshotAt = this.clineMessages.at(-1)?.ts;
        return this.tokenUsageSnapshot;
    }
    get cwd() {
        return this.workspacePath;
    }
    /**
     * Process any queued messages by dequeuing and submitting them.
     * This ensures that queued user messages are sent when appropriate,
     * preventing them from getting stuck in the queue.
     *
     * @param context - Context string for logging (e.g., the calling tool name)
     */
    processQueuedMessages() {
        try {
            if (!this.messageQueueService.isEmpty()) {
                const queued = this.messageQueueService.dequeueMessage();
                if (queued) {
                    setTimeout(() => {
                        this.submitUserMessage(queued.text, queued.images).catch((err) => console.error(`[Task] Failed to submit queued message:`, err));
                    }, 0);
                }
            }
        }
        catch (e) {
            console.error(`[Task] Queue processing error:`, e);
        }
    }
}
exports.Task = Task;
//# sourceMappingURL=Task.js.map