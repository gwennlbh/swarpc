/**
 * @module
 * @mergeModuleWith <project>
 */
/**
 * @ignore
 */
export declare function createLogger(side: "server" | "client", level: LogLevel, nid?: string): Logger;
export declare function createLogger(side: "server" | "client", level: LogLevel, nid: string, rqid: string): RequestBoundLogger;
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
declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
export type LogLevel = (typeof LOG_LEVELS)[number];
/**
 *
 * @param scope
 */
export declare function injectIntoConsoleGlobal(scope: WorkerGlobalScope | SharedWorkerGlobalScope, nodeId: string): void;
export {};
//# sourceMappingURL=log.d.ts.map