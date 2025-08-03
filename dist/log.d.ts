/**
 * @module
 * @mergeModuleWith <project>
 */
/**
 * @ignore
 */
export declare function createLogger(side: "server" | "client", level: LogLevel): Logger;
export declare function createLogger(side: "server" | "client", level: LogLevel, rqid: string): RequestBoundLogger;
/**
 * @ignore
 */
export type Logger = {
    debug: (rqid: string | null, message: string, ...args: any[]) => void;
    info: (rqid: string | null, message: string, ...args: any[]) => void;
    warn: (rqid: string | null, message: string, ...args: any[]) => void;
    error: (rqid: string | null, message: string, ...args: any[]) => void;
};
export type RequestBoundLogger = {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
};
/** @source */
export declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
export type LogLevel = (typeof LOG_LEVELS)[number];
//# sourceMappingURL=log.d.ts.map