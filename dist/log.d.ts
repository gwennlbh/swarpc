/**
 * Convenience shortcuts for logging.
 */
export declare const l: {
    server: {
        debug: (rqid: string | null, message: string, ...args: any[]) => void;
        info: (rqid: string | null, message: string, ...args: any[]) => void;
        warn: (rqid: string | null, message: string, ...args: any[]) => void;
        error: (rqid: string | null, message: string, ...args: any[]) => void;
    };
    client: {
        debug: (rqid: string | null, message: string, ...args: any[]) => void;
        info: (rqid: string | null, message: string, ...args: any[]) => void;
        warn: (rqid: string | null, message: string, ...args: any[]) => void;
        error: (rqid: string | null, message: string, ...args: any[]) => void;
    };
};
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
export declare function log(severity: "debug" | "info" | "warn" | "error", side: "server" | "client", rqid: string | null, message: string, ...args: any[]): void;
//# sourceMappingURL=log.d.ts.map