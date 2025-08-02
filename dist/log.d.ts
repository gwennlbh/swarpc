export declare function createLogger(side: "server" | "client", level?: LogLevel): {
    debug: (rqid: string | null, message: string, ...args: any[]) => void;
    info: (rqid: string | null, message: string, ...args: any[]) => void;
    warn: (rqid: string | null, message: string, ...args: any[]) => void;
    error: (rqid: string | null, message: string, ...args: any[]) => void;
};
export type Logger = ReturnType<typeof createLogger>;
declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
export type LogLevel = (typeof LOG_LEVELS)[number];
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
export declare function log(severity: "debug" | "info" | "warn" | "error", side: "server" | "client", rqid: string | null, message: string, ...args: any[]): void;
export {};
//# sourceMappingURL=log.d.ts.map