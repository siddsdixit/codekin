export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static instance;
    private outputChannel;
    private level;
    private constructor();
    static getInstance(): Logger;
    private log;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: any): void;
    show(): void;
    setLevel(level: LogLevel): void;
    dispose(): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map